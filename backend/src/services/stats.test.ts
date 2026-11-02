import { afterAll, describe, expect, it } from 'vitest';
import { pool } from '../db/client.js';
import { makeCampaignInput } from '../test-utils.js';
import { createCampaignSchema } from '../validation/campaign.js';
import { leadSchema } from '../validation/lead.js';
import { createCampaign, deleteCampaign, type CampaignDetail } from './campaigns.js';
import { createLead } from './leads.js';
import { submitAnswers } from './public-campaigns.js';
import { getCampaignStats } from './stats.js';

const createdIds: string[] = [];

async function create() {
  const campaign = await createCampaign(
    createCampaignSchema.parse(makeCampaignInput({ status: 'published' })),
  );
  createdIds.push(campaign.id);
  return campaign;
}

// One quiz. picks[i] says if question i is answered right (true) or wrong (false).
async function takeQuiz(campaign: CampaignDetail, picks: boolean[]) {
  const result = await submitAnswers(campaign.slug, {
    answers: campaign.questions.map((q, i) => ({
      questionId: q.id,
      optionId: q.options.find((o) => o.isCorrect === picks[i])!.id,
    })),
  });
  if (result.status !== 'ok') throw new Error('quiz was not saved');
  return result.submissionId;
}

afterAll(async () => {
  for (const id of createdIds) await deleteCampaign(id);
  await pool.end();
});

describe('getCampaignStats', () => {
  it('shows zeros and no average when no one has answered', async () => {
    const campaign = await create();
    const stats = await getCampaignStats(campaign.id);

    expect(stats).toMatchObject({ participants: 0, averageScore: null, total: 3, leads: 0 });
    expect(stats!.questions).toHaveLength(3);
    for (const question of stats!.questions) {
      expect(question.answered).toBe(0);
      expect(question.options).toHaveLength(2);
      for (const option of question.options) expect(option).toMatchObject({ count: 0, percent: 0 });
    }
  });

  it('counts participants, average score, answers per option and leads', async () => {
    const campaign = await create();
    await takeQuiz(campaign, [true, true, true]); // score 3
    await takeQuiz(campaign, [false, false, false]); // score 0
    const third = await takeQuiz(campaign, [true, true, false]); // score 2
    await createLead(
      third,
      leadSchema.parse({ name: 'Anna', email: 'a@example.com', consent: true }),
    );

    const stats = await getCampaignStats(campaign.id);

    expect(stats).toMatchObject({ participants: 3, total: 3, leads: 1 });
    expect(stats!.averageScore).toBe(1.7); // (3 + 0 + 2) / 3 = 1.67

    // Per question: [right, wrong] counts
    const counts = stats!.questions.map((q) => q.options.map((o) => o.count));
    expect(counts).toEqual([
      [2, 1],
      [2, 1],
      [1, 2],
    ]);
    expect(stats!.questions[0].options.map((o) => o.percent)).toEqual([67, 33]);
    expect(stats!.questions[2].options.map((o) => o.percent)).toEqual([33, 67]);
    expect(stats!.questions.every((q) => q.answered === 3)).toBe(true);
  });

  it('marks the right answer and keeps the order of questions and answers', async () => {
    const campaign = await create();
    const stats = await getCampaignStats(campaign.id);

    expect(stats!.questions.map((q) => q.position)).toEqual([1, 2, 3]);
    expect(stats!.questions[0].options.map((o) => [o.text, o.isCorrect])).toEqual([
      ['Right', true],
      ['Wrong', false],
    ]);
  });

  it('does not count the quizzes of another campaign', async () => {
    const mine = await create();
    const other = await create();
    await takeQuiz(other, [true, true, true]);

    const stats = await getCampaignStats(mine.id);
    expect(stats!.participants).toBe(0);
    expect(stats!.questions.every((q) => q.answered === 0)).toBe(true);
  });

  it('returns null for an unknown campaign and for an id that is not a uuid', async () => {
    expect(await getCampaignStats('00000000-0000-4000-8000-000000000000')).toBeNull();
    expect(await getCampaignStats('not-a-uuid')).toBeNull();
  });
});
