import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client.js';
import { answerOptions, campaigns, questions } from '../db/schema.js';

// What a visitor may see. There is no isCorrect here, on purpose.
export type PublicCampaign = {
  slug: string;
  title: string;
  description: string;
  accentColor: string;
  questions: Array<{
    id: number;
    text: string;
    options: Array<{ id: number; text: string }>;
  }>;
};

// Only published campaigns. A draft and a missing campaign look the same (null).
// Every field is copied by name. Never spread a database row here, because the
// answer rows contain isCorrect.
export async function getPublicCampaign(slug: string): Promise<PublicCampaign | null> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.slug, slug), eq(campaigns.status, 'published')));
  if (!campaign) return null;

  const questionRows = await db
    .select()
    .from(questions)
    .where(eq(questions.campaignId, campaign.id))
    .orderBy(asc(questions.position));

  const optionRows = questionRows.length
    ? await db
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
    slug: campaign.slug,
    title: campaign.title,
    description: campaign.description,
    accentColor: campaign.accentColor,
    questions: questionRows.map((q) => ({
      id: q.id,
      text: q.text,
      options: optionRows
        .filter((o) => o.questionId === q.id)
        .map((o) => ({ id: o.id, text: o.text })),
    })),
  };
}
