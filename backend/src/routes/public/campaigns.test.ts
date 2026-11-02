import { afterAll, describe, expect, it } from 'vitest';
import { pool } from '../../db/client.js';
import { app } from '../../index.js';
import { createCampaign, deleteCampaign, type CampaignDetail } from '../../services/campaigns.js';
import { makeCampaignInput } from '../../test-utils.js';
import { createCampaignSchema } from '../../validation/campaign.js';

const createdIds: string[] = [];

async function create(overrides: Record<string, unknown> = {}) {
  const campaign = await createCampaign(
    createCampaignSchema.parse(makeCampaignInput({ status: 'published', ...overrides })),
  );
  createdIds.push(campaign.id);
  return campaign;
}

const answersFor = (campaign: CampaignDetail, correct: boolean) => ({
  answers: campaign.questions.map((q) => ({
    questionId: q.id,
    optionId: q.options.find((o) => o.isCorrect === correct)!.id,
  })),
});

const submit = (slug: string, body: unknown) =>
  app.request(`/api/public/campaigns/${slug}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

afterAll(async () => {
  for (const id of createdIds) await deleteCampaign(id);
  await pool.end();
});

describe('GET /api/public/campaigns/:slug', () => {
  it('works without a session and never shows the correct answers', async () => {
    const campaign = await create();
    const res = await app.request(`/api/public/campaigns/${campaign.slug}`);

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const text = await res.text();
    expect(text).not.toMatch(/isCorrect|is_correct|correct/i);
    const { campaign: body } = JSON.parse(text);
    expect(body.questions).toHaveLength(3);
    expect(body.questions[0].options[0]).toEqual({
      id: campaign.questions[0].options[0].id,
      text: 'Right',
    });
  });

  it('returns 404 for a draft and for an unknown slug', async () => {
    const draft = await create({ status: 'draft' });
    for (const slug of [draft.slug, 'no-such-campaign']) {
      const res = await app.request(`/api/public/campaigns/${slug}`);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'Campaign not found' });
    }
  });
});

describe('POST /api/public/campaigns/:slug/submissions', () => {
  it('returns 201 with the score and the correct answers', async () => {
    const campaign = await create();
    const res = await submit(campaign.slug, answersFor(campaign, true));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ score: 3, total: 3 });
    expect(body.submissionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.results).toHaveLength(3);
  });

  it('ignores a score sent by the client', async () => {
    const campaign = await create();
    const res = await submit(campaign.slug, { ...answersFor(campaign, false), score: 3, total: 3 });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ score: 0, total: 3 });
  });

  it('returns 400 with a clear message when a question is missing', async () => {
    const campaign = await create();
    const input = answersFor(campaign, true);
    input.answers.pop();

    const res = await submit(campaign.slug, input);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Answer all the questions' });
  });

  it('returns 400 for a body that is not valid', async () => {
    const campaign = await create();
    expect((await submit(campaign.slug, 'oops')).status).toBe(400);
    expect((await submit(campaign.slug, { answers: 'x' })).status).toBe(400);
  });

  it('returns 404 for a draft and for an unknown slug', async () => {
    const draft = await create({ status: 'draft' });
    expect((await submit(draft.slug, answersFor(draft, true))).status).toBe(404);
    expect(
      (await submit('no-such-campaign', { answers: [{ questionId: 1, optionId: 1 }] })).status,
    ).toBe(404);
  });

  it('returns 413 for a body that is too big', async () => {
    const campaign = await create();
    const res = await submit(campaign.slug, { answers: [], padding: 'a'.repeat(20 * 1024) });
    expect(res.status).toBe(413);
    expect(await res.json()).toHaveProperty('error');
  });
});
