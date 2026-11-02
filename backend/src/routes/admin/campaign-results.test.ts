import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pool } from '../../db/client.js';
import { app } from '../../index.js';
import { deleteCampaign } from '../../services/campaigns.js';
import { createLead } from '../../services/leads.js';
import { createCampaignWithSubmission, createTestAdmin } from '../../test-utils.js';
import { leadSchema } from '../../validation/lead.js';

let admin: Awaited<ReturnType<typeof createTestAdmin>>;
let cookie: string;
let campaignId: string;
let leadId: number;
const createdCampaignIds: string[] = [];

const request = (method: string, path: string, withCookie = true) =>
  app.request(`/api/admin/campaigns${path}`, {
    method,
    headers: withCookie ? { Cookie: cookie } : {},
  });

beforeAll(async () => {
  admin = await createTestAdmin();
  const login = await app.request('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: admin.email, password: admin.password }),
  });
  cookie = (login.headers.get('set-cookie') ?? '').split(';')[0];

  // One campaign with one finished quiz and one lead
  const made = await createCampaignWithSubmission();
  campaignId = made.campaign.id;
  createdCampaignIds.push(campaignId);
  await createLead(
    made.submissionId,
    leadSchema.parse({ name: 'Anna', email: 'anna@example.com', consent: true }),
  );
  const list = await (await request('GET', `/${campaignId}/leads`)).json();
  leadId = list.leads[0].id;
});

afterAll(async () => {
  for (const id of createdCampaignIds) await deleteCampaign(id);
  await admin.cleanup();
  await pool.end();
});

describe('no session', () => {
  it.each([
    ['GET', '/stats'],
    ['GET', '/leads'],
    ['DELETE', '/leads/1'],
  ])('%s %s returns 401', async (method, suffix) => {
    const res = await request(method, `/00000000-0000-4000-8000-000000000000${suffix}`, false);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/campaigns/:id/stats', () => {
  it('returns the numbers', async () => {
    const res = await request('GET', `/${campaignId}/stats`);
    expect(res.status).toBe(200);

    const { stats } = await res.json();
    expect(stats).toMatchObject({ participants: 1, averageScore: 3, total: 3, leads: 1 });
    expect(stats.questions).toHaveLength(3);
    expect(stats.questions[0].options[0]).toMatchObject({
      isCorrect: true,
      count: 1,
      percent: 100,
    });
  });

  it('returns 404 for an unknown id and for an id that is not a uuid', async () => {
    expect((await request('GET', '/00000000-0000-4000-8000-000000000000/stats')).status).toBe(404);
    const res = await request('GET', '/not-a-uuid/stats');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Campaign not found' });
  });
});

describe('GET /api/admin/campaigns/:id/leads', () => {
  it('returns the leads', async () => {
    const res = await request('GET', `/${campaignId}/leads`);
    expect(res.status).toBe(200);

    const { leads } = await res.json();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ name: 'Anna', email: 'anna@example.com', score: 3, total: 3 });
    expect(leads[0]).toHaveProperty('consentAt');
  });

  it('returns 404 for an unknown campaign', async () => {
    expect((await request('GET', '/00000000-0000-4000-8000-000000000000/leads')).status).toBe(404);
  });
});

describe('DELETE /api/admin/campaigns/:id/leads/:leadId', () => {
  it('returns 404 for an id that is not a number, and for a lead of another campaign', async () => {
    expect((await request('DELETE', `/${campaignId}/leads/abc`)).status).toBe(404);
    expect(
      (await request('DELETE', `/00000000-0000-4000-8000-000000000000/leads/${leadId}`)).status,
    ).toBe(404);
  });

  it('deletes the lead, and then it is gone', async () => {
    const res = await request('DELETE', `/${campaignId}/leads/${leadId}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect((await (await request('GET', `/${campaignId}/leads`)).json()).leads).toHaveLength(0);
    expect((await request('DELETE', `/${campaignId}/leads/${leadId}`)).status).toBe(404);
    // The quiz itself stays
    expect((await (await request('GET', `/${campaignId}/stats`)).json()).stats).toMatchObject({
      participants: 1,
      leads: 0,
    });
  });
});
