import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db, pool } from '../db/client.js';
import { questions, submissions } from '../db/schema.js';
import { makeCampaignInput } from '../test-utils.js';
import { createCampaignSchema, updateCampaignSchema } from '../validation/campaign.js';
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
} from './campaigns.js';

const createdIds: string[] = [];

async function create(overrides: Record<string, unknown> = {}) {
  const campaign = await createCampaign(createCampaignSchema.parse(makeCampaignInput(overrides)));
  createdIds.push(campaign.id);
  return campaign;
}

afterAll(async () => {
  for (const id of createdIds) await deleteCampaign(id);
  await pool.end();
});

describe('createCampaign', () => {
  it('saves the campaign with questions and answers in order', async () => {
    const campaign = await create({ title: 'Service Test One' });
    expect(campaign.slug).toMatch(/^service-test-one/);
    expect(campaign.questions.map((q) => q.position)).toEqual([1, 2, 3]);
    expect(campaign.questions[0].options.map((o) => o.position)).toEqual([1, 2]);
    expect(campaign.questions[0].options[0].isCorrect).toBe(true);
  });

  it('gives different slugs to campaigns with the same title, even at the same time', async () => {
    const title = 'Same Title Test';
    const results = await Promise.all([create({ title }), create({ title }), create({ title })]);
    expect(new Set(results.map((c) => c.slug)).size).toBe(3);
  });
});

describe('getCampaign', () => {
  it('returns null for an unknown id and for an id that is not a uuid', async () => {
    expect(await getCampaign('00000000-0000-4000-8000-000000000000')).toBeNull();
    expect(await getCampaign('not-a-uuid')).toBeNull();
  });
});

describe('listCampaigns', () => {
  it('counts the participants of each campaign', async () => {
    const campaign = await create();
    await db.insert(submissions).values([
      { campaignId: campaign.id, score: 2, total: 3 },
      { campaignId: campaign.id, score: 3, total: 3 },
    ]);

    const list = await listCampaigns();
    expect(list.find((c) => c.id === campaign.id)?.participants).toBe(2);
  });
});

describe('updateCampaign', () => {
  it('changes only the fields that are sent, and keeps the slug', async () => {
    const campaign = await create({ title: 'Before' });
    const result = await updateCampaign(
      campaign.id,
      updateCampaignSchema.parse({ title: 'After', status: 'published' }),
    );

    if (result.status !== 'ok') throw new Error('expected ok');
    expect(result.campaign.title).toBe('After');
    expect(result.campaign.status).toBe('published');
    expect(result.campaign.slug).toBe(campaign.slug);
    expect(result.campaign.accentColor).toBe(campaign.accentColor);
    expect(result.campaign.description).toBe(campaign.description);
    expect(result.campaign.questions).toHaveLength(3);
  });

  it('replaces the questions when no one has answered yet', async () => {
    const campaign = await create();
    const newQuestions = makeCampaignInput({ title: 'x' })
      .questions.slice(0, 3)
      .map((q, i) => ({
        ...q,
        text: `New question ${i + 1}?`,
      }));
    const result = await updateCampaign(
      campaign.id,
      updateCampaignSchema.parse({ questions: newQuestions }),
    );

    if (result.status !== 'ok') throw new Error('expected ok');
    expect(result.campaign.questions.map((q) => q.text)).toEqual([
      'New question 1?',
      'New question 2?',
      'New question 3?',
    ]);
    const rows = await db.select().from(questions).where(eq(questions.campaignId, campaign.id));
    expect(rows).toHaveLength(3);
  });

  it('does not change the questions when the campaign has participants', async () => {
    const campaign = await create();
    await db.insert(submissions).values({ campaignId: campaign.id, score: 1, total: 3 });

    const blocked = await updateCampaign(
      campaign.id,
      updateCampaignSchema.parse({ questions: makeCampaignInput().questions }),
    );
    expect(blocked.status).toBe('has_participants');
    expect((await getCampaign(campaign.id))?.questions.map((q) => q.id)).toEqual(
      campaign.questions.map((q) => q.id),
    );

    // The other fields can still be changed
    const ok = await updateCampaign(campaign.id, updateCampaignSchema.parse({ title: 'Still ok' }));
    expect(ok.status).toBe('ok');
  });

  it('returns not_found for an unknown id', async () => {
    const result = await updateCampaign(
      '00000000-0000-4000-8000-000000000000',
      updateCampaignSchema.parse({ title: 'x' }),
    );
    expect(result.status).toBe('not_found');
  });
});

describe('deleteCampaign', () => {
  it('deletes the campaign and its questions', async () => {
    const campaign = await create();
    expect(await deleteCampaign(campaign.id)).toBe(true);
    expect(await getCampaign(campaign.id)).toBeNull();
    const rows = await db.select().from(questions).where(eq(questions.campaignId, campaign.id));
    expect(rows).toHaveLength(0);
  });

  it('returns false for an unknown id', async () => {
    expect(await deleteCampaign('00000000-0000-4000-8000-000000000000')).toBe(false);
    expect(await deleteCampaign('not-a-uuid')).toBe(false);
  });
});
