import { asc, count, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { answerOptions, campaigns, questions, submissions } from '../db/schema.js';
import type { CreateCampaignInput, UpdateCampaignInput } from '../validation/campaign.js';
import { slugify, withRandomSuffix } from './slug.js';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type CampaignDetail = typeof campaigns.$inferSelect & {
  questions: Array<{
    id: number;
    text: string;
    position: number;
    options: Array<{ id: number; text: string; isCorrect: boolean; position: number }>;
  }>;
};

// Load one campaign with its questions and answers (admin view: includes isCorrect).
async function loadCampaign(ex: Tx | typeof db, id: string): Promise<CampaignDetail | null> {
  const [campaign] = await ex.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) return null;

  const questionRows = await ex
    .select()
    .from(questions)
    .where(eq(questions.campaignId, id))
    .orderBy(asc(questions.position));

  const optionRows = questionRows.length
    ? await ex
        .select()
        .from(answerOptions)
        .where(
          inArray(
            answerOptions.questionId,
            questionRows.map((q) => q.id),
          ),
        )
        .orderBy(asc(answerOptions.position))
    : [];

  return {
    ...campaign,
    questions: questionRows.map((q) => ({
      id: q.id,
      text: q.text,
      position: q.position,
      options: optionRows
        .filter((o) => o.questionId === q.id)
        .map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect, position: o.position })),
    })),
  };
}

// Insert the questions and answers of a campaign. Positions start at 1.
async function insertQuestions(
  tx: Tx,
  campaignId: string,
  items: CreateCampaignInput['questions'],
) {
  for (const [qIndex, q] of items.entries()) {
    const [question] = await tx
      .insert(questions)
      .values({ campaignId, text: q.text, position: qIndex + 1 })
      .returning({ id: questions.id });

    await tx.insert(answerOptions).values(
      q.options.map((o, oIndex) => ({
        questionId: question.id,
        text: o.text,
        isCorrect: o.isCorrect,
        position: oIndex + 1,
      })),
    );
  }
}

// The driver can wrap the Postgres error, so we also look at `cause`.
function isSlugConflict(err: unknown): boolean {
  const e = err as { code?: string; constraint?: string; cause?: unknown } | null;
  if (!e) return false;
  if (e.code === '23505' && e.constraint === 'campaigns_slug_unique') return true;
  return e.cause ? isSlugConflict(e.cause) : false;
}

export async function createCampaign(input: CreateCampaignInput): Promise<CampaignDetail> {
  const baseSlug = slugify(input.title);

  // If the slug is taken, try again with a random ending. The database decides what is taken,
  // so two requests at the same time can never get the same slug.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : withRandomSuffix(baseSlug);
    try {
      return await db.transaction(async (tx) => {
        const [campaign] = await tx
          .insert(campaigns)
          .values({
            slug,
            title: input.title,
            description: input.description,
            accentColor: input.accentColor,
            status: input.status,
          })
          .returning();

        await insertQuestions(tx, campaign.id, input.questions);
        return (await loadCampaign(tx, campaign.id))!;
      });
    } catch (err) {
      if (!isSlugConflict(err)) throw err;
    }
  }
  throw new Error('Could not create a unique slug');
}

// A value that is not a uuid can never be a campaign id (and Postgres would throw an error).
const isUuid = (value: string) => z.uuid().safeParse(value).success;

export async function listCampaigns() {
  return db
    .select({
      id: campaigns.id,
      slug: campaigns.slug,
      title: campaigns.title,
      description: campaigns.description,
      accentColor: campaigns.accentColor,
      status: campaigns.status,
      createdAt: campaigns.createdAt,
      updatedAt: campaigns.updatedAt,
      participants: count(submissions.id),
    })
    .from(campaigns)
    .leftJoin(submissions, eq(submissions.campaignId, campaigns.id))
    .groupBy(campaigns.id)
    .orderBy(desc(campaigns.createdAt));
}

export async function getCampaign(id: string): Promise<CampaignDetail | null> {
  if (!isUuid(id)) return null;
  return loadCampaign(db, id);
}

export type UpdateResult =
  | { status: 'ok'; campaign: CampaignDetail }
  | { status: 'not_found' }
  | { status: 'has_participants' };

export async function updateCampaign(
  id: string,
  input: UpdateCampaignInput,
): Promise<UpdateResult> {
  if (!isUuid(id)) return { status: 'not_found' };

  return db.transaction(async (tx) => {
    // Lock the campaign row. A visitor cannot send a submission while we change the questions,
    // because saving a submission needs a lock on this row too.
    const [existing] = await tx.select().from(campaigns).where(eq(campaigns.id, id)).for('update');
    if (!existing) return { status: 'not_found' };

    if (input.questions) {
      const [{ total }] = await tx
        .select({ total: count() })
        .from(submissions)
        .where(eq(submissions.campaignId, id));
      // Changing questions would delete the answers of the participants and break the statistics
      if (total > 0) return { status: 'has_participants' };
    }

    await tx
      .update(campaigns)
      .set({
        title: input.title,
        description: input.description,
        accentColor: input.accentColor,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id));

    if (input.questions) {
      await tx.delete(questions).where(eq(questions.campaignId, id));
      await insertQuestions(tx, id, input.questions);
    }

    return { status: 'ok', campaign: (await loadCampaign(tx, id))! };
  });
}

// Questions, answers, submissions and leads of the campaign are removed too (cascade).
export async function deleteCampaign(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const deleted = await db
    .delete(campaigns)
    .where(eq(campaigns.id, id))
    .returning({ id: campaigns.id });
  return deleted.length > 0;
}
