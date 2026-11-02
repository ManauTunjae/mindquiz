import { count, eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db, pool } from '../db/client.js';
import { submissionAnswers, submissions } from '../db/schema.js';
import { makeCampaignInput } from '../test-utils.js';
import { createCampaignSchema } from '../validation/campaign.js';
import { createCampaign, deleteCampaign, listCampaigns, type CampaignDetail } from './campaigns.js';
import { getPublicCampaign, submitAnswers } from './public-campaigns.js';

const createdIds: string[] = [];

async function create(overrides: Record<string, unknown> = {}) {
  const campaign = await createCampaign(
    createCampaignSchema.parse(makeCampaignInput({ status: 'published', ...overrides })),
  );
  createdIds.push(campaign.id);
  return campaign;
}

// One answer per question. `pickCorrect(index)` decides if question number `index` is answered right.
const answersFor = (campaign: CampaignDetail, pickCorrect: (index: number) => boolean) => ({
  answers: campaign.questions.map((q, i) => ({
    questionId: q.id,
    optionId: q.options.find((o) => o.isCorrect === pickCorrect(i))!.id,
  })),
});

const submissionCount = async (campaignId: string) => {
  const [row] = await db
    .select({ n: count() })
    .from(submissions)
    .where(eq(submissions.campaignId, campaignId));
  return row.n;
};

afterAll(async () => {
  for (const id of createdIds) await deleteCampaign(id);
  await pool.end();
});

describe('getPublicCampaign', () => {
  it('returns the published campaign without any sign of the correct answers', async () => {
    const campaign = await create();
    const result = await getPublicCampaign(campaign.slug);

    expect(result?.title).toBe(campaign.title);
    expect(result?.questions).toHaveLength(3);
    expect(Object.keys(result!.questions[0].options[0]).sort()).toEqual(['id', 'text']);
    const json = JSON.stringify(result);
    expect(json).not.toMatch(/isCorrect|is_correct|correct/i);
  });

  it('returns null for a draft and for an unknown slug', async () => {
    const draft = await create({ status: 'draft' });
    expect(await getPublicCampaign(draft.slug)).toBeNull();
    expect(await getPublicCampaign('no-such-campaign')).toBeNull();
  });
});

describe('submitAnswers', () => {
  it('gives full score when all answers are right', async () => {
    const campaign = await create();
    const result = await submitAnswers(
      campaign.slug,
      answersFor(campaign, () => true),
    );

    if (result.status !== 'ok') throw new Error('expected ok');
    expect(result.score).toBe(3);
    expect(result.total).toBe(3);
    expect(result.results).toHaveLength(3);
    for (const r of result.results) expect(r.chosenOptionId).toBe(r.correctOptionId);
  });

  it('gives 0 when all answers are wrong', async () => {
    const campaign = await create();
    const result = await submitAnswers(
      campaign.slug,
      answersFor(campaign, () => false),
    );

    if (result.status !== 'ok') throw new Error('expected ok');
    expect(result.score).toBe(0);
    for (const r of result.results) expect(r.chosenOptionId).not.toBe(r.correctOptionId);
  });

  it('counts a mix of right and wrong answers', async () => {
    const campaign = await create();
    const result = await submitAnswers(
      campaign.slug,
      answersFor(campaign, (i) => i === 1),
    );

    if (result.status !== 'ok') throw new Error('expected ok');
    expect(result.score).toBe(1);
    expect(result.total).toBe(3);
  });

  it('saves the submission and the answers, and the admin list counts the participant', async () => {
    const campaign = await create();
    const result = await submitAnswers(
      campaign.slug,
      answersFor(campaign, () => true),
    );
    if (result.status !== 'ok') throw new Error('expected ok');

    const [saved] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, result.submissionId));
    expect(saved).toMatchObject({ campaignId: campaign.id, score: 3, total: 3 });

    const answers = await db
      .select()
      .from(submissionAnswers)
      .where(eq(submissionAnswers.submissionId, result.submissionId));
    expect(answers).toHaveLength(3);

    const list = await listCampaigns();
    expect(list.find((c) => c.id === campaign.id)?.participants).toBe(1);
  });

  describe('rejects bad input and saves nothing', () => {
    it('when a question is not answered', async () => {
      const campaign = await create();
      const input = answersFor(campaign, () => true);
      input.answers.pop();

      expect(await submitAnswers(campaign.slug, input)).toEqual({
        status: 'invalid',
        message: 'Answer all the questions',
      });
      expect(await submissionCount(campaign.id)).toBe(0);
    });

    it('when a question is answered twice', async () => {
      const campaign = await create();
      const input = answersFor(campaign, () => true);
      input.answers[2] = { ...input.answers[0] };

      const result = await submitAnswers(campaign.slug, input);
      expect(result).toEqual({
        status: 'invalid',
        message: 'Each question can only be answered once',
      });
      expect(await submissionCount(campaign.id)).toBe(0);
    });

    it('when the answer belongs to another question', async () => {
      const campaign = await create();
      const input = answersFor(campaign, () => true);
      input.answers[0].optionId = campaign.questions[1].options[0].id;

      const result = await submitAnswers(campaign.slug, input);
      expect(result.status).toBe('invalid');
      expect(await submissionCount(campaign.id)).toBe(0);
    });

    it('when the answer belongs to another campaign', async () => {
      const campaign = await create();
      const other = await create();
      const input = answersFor(campaign, () => true);
      input.answers[0].optionId = other.questions[0].options[0].id;

      expect((await submitAnswers(campaign.slug, input)).status).toBe('invalid');
      expect(await submissionCount(campaign.id)).toBe(0);
    });

    it('when a question id does not exist', async () => {
      const campaign = await create();
      const input = answersFor(campaign, () => true);
      input.answers[0].questionId = 2_000_000_000;

      expect((await submitAnswers(campaign.slug, input)).status).toBe('invalid');
      expect(await submissionCount(campaign.id)).toBe(0);
    });
  });

  it('returns not_found for a draft and for an unknown slug', async () => {
    const draft = await create({ status: 'draft' });
    expect(
      await submitAnswers(
        draft.slug,
        answersFor(draft, () => true),
      ),
    ).toEqual({
      status: 'not_found',
    });
    expect(
      await submitAnswers('no-such-campaign', { answers: [{ questionId: 1, optionId: 1 }] }),
    ).toEqual({ status: 'not_found' });
    expect(await submissionCount(draft.id)).toBe(0);
  });
});
