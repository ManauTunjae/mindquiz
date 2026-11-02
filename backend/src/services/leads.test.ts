import { count, eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db, pool } from '../db/client.js';
import { leads, submissions } from '../db/schema.js';
import { createCampaignWithSubmission } from '../test-utils.js';
import { leadSchema } from '../validation/lead.js';
import { deleteCampaign, type CampaignDetail } from './campaigns.js';
import { CONSENT_TEXT } from './consent.js';
import { createLead, deleteLead, listLeads } from './leads.js';
import { submitAnswers } from './public-campaigns.js';

const createdCampaignIds: string[] = [];

async function setup() {
  const made = await createCampaignWithSubmission();
  createdCampaignIds.push(made.campaign.id);
  return made;
}

const input = (overrides: Record<string, unknown> = {}) =>
  leadSchema.parse({ name: 'Anna', email: 'Anna@Example.com', consent: true, ...overrides });

const leadsFor = (submissionId: string) =>
  db.select().from(leads).where(eq(leads.submissionId, submissionId));

afterAll(async () => {
  for (const id of createdCampaignIds) await deleteCampaign(id);
  await pool.end();
});

describe('createLead', () => {
  it('saves the lead with the consent text and the time from the server', async () => {
    const { campaign, submissionId } = await setup();
    const before = Date.now();

    expect(await createLead(submissionId, input())).toEqual({ status: 'ok' });

    const [lead] = await leadsFor(submissionId);
    expect(lead).toMatchObject({
      campaignId: campaign.id,
      name: 'Anna',
      email: 'anna@example.com',
      consent: true,
      consentText: CONSENT_TEXT,
    });
    expect(lead.consentAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(lead.consentAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('does not save a second lead for the same submission, and keeps the first', async () => {
    const { submissionId } = await setup();
    await createLead(submissionId, input({ name: 'First' }));

    expect(await createLead(submissionId, input({ name: 'Second' }))).toEqual({
      status: 'already_exists',
    });

    const rows = await leadsFor(submissionId);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('First');
  });

  it('saves exactly one lead when two requests arrive at the same time', async () => {
    const { submissionId } = await setup();

    const results = await Promise.all([
      createLead(submissionId, input({ name: 'A' })),
      createLead(submissionId, input({ name: 'B' })),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual(['already_exists', 'ok']);
    const [{ n }] = await db
      .select({ n: count() })
      .from(leads)
      .where(eq(leads.submissionId, submissionId));
    expect(n).toBe(1);
  });

  it('returns not_found for an unknown submission and for an id that is not a uuid', async () => {
    expect(await createLead('00000000-0000-4000-8000-000000000000', input())).toEqual({
      status: 'not_found',
    });
    expect(await createLead('not-a-uuid', input())).toEqual({ status: 'not_found' });
  });

  it('removes the lead when the campaign is deleted', async () => {
    const { campaign, submissionId } = await setup();
    await createLead(submissionId, input());

    await deleteCampaign(campaign.id);

    expect(await leadsFor(submissionId)).toHaveLength(0);
  });
});

// A second quiz for the same campaign (all answers right). Returns the submission id.
async function anotherSubmission(campaign: CampaignDetail) {
  const result = await submitAnswers(campaign.slug, {
    answers: campaign.questions.map((q) => ({
      questionId: q.id,
      optionId: q.options.find((o) => o.isCorrect)!.id,
    })),
  });
  if (result.status !== 'ok') throw new Error('quiz was not saved');
  return result.submissionId;
}

describe('listLeads', () => {
  it('returns an empty list for a campaign without leads', async () => {
    const { campaign } = await setup();
    expect(await listLeads(campaign.id)).toEqual([]);
  });

  it('returns the leads with their score, newest first', async () => {
    const { campaign, submissionId } = await setup();
    await createLead(submissionId, input({ name: 'First', email: 'first@example.com' }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    await createLead(
      await anotherSubmission(campaign),
      input({ name: 'Second', email: 'second@example.com' }),
    );

    const list = await listLeads(campaign.id);

    expect(list!.map((l) => l.name)).toEqual(['Second', 'First']);
    expect(list![0]).toMatchObject({ email: 'second@example.com', score: 3, total: 3 });
    expect(list![0].consentAt).toBeInstanceOf(Date);
  });

  it('returns null for an unknown campaign and for an id that is not a uuid', async () => {
    expect(await listLeads('00000000-0000-4000-8000-000000000000')).toBeNull();
    expect(await listLeads('not-a-uuid')).toBeNull();
  });
});

describe('deleteLead', () => {
  it('deletes only that lead and keeps the quiz submission', async () => {
    const { campaign, submissionId } = await setup();
    await createLead(submissionId, input({ name: 'Delete me' }));
    await createLead(await anotherSubmission(campaign), input({ name: 'Keep me' }));
    const [target] = (await listLeads(campaign.id))!.filter((l) => l.name === 'Delete me');

    expect(await deleteLead(campaign.id, target.id)).toBe(true);

    expect((await listLeads(campaign.id))!.map((l) => l.name)).toEqual(['Keep me']);
    const stillThere = await db.select().from(submissions).where(eq(submissions.id, submissionId));
    expect(stillThere).toHaveLength(1);
  });

  it('does not delete a lead through another campaign', async () => {
    const mine = await setup();
    const other = await setup();
    await createLead(other.submissionId, input());
    const [lead] = (await listLeads(other.campaign.id))!;

    expect(await deleteLead(mine.campaign.id, lead.id)).toBe(false);
    expect(await listLeads(other.campaign.id)).toHaveLength(1);
  });

  it('returns false for an unknown lead and for an id that is not a uuid', async () => {
    const { campaign } = await setup();
    expect(await deleteLead(campaign.id, 2_000_000_000)).toBe(false);
    expect(await deleteLead('not-a-uuid', 1)).toBe(false);
  });
});
