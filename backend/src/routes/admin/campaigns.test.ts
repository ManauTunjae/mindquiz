import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pool } from '../../db/client.js';
import { app } from '../../index.js';
import { deleteCampaign } from '../../services/campaigns.js';
import { createTestAdmin, makeCampaignInput } from '../../test-utils.js';

let admin: Awaited<ReturnType<typeof createTestAdmin>>;
let cookie: string;
const createdIds: string[] = [];

const request = (method: string, path: string, body?: unknown, withCookie = true) =>
  app.request(`/api/admin/campaigns${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(withCookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

async function createViaApi(overrides: Record<string, unknown> = {}) {
  const res = await request('POST', '', makeCampaignInput(overrides));
  const { campaign } = await res.json();
  createdIds.push(campaign.id);
  return campaign;
}

beforeAll(async () => {
  admin = await createTestAdmin();
  const res = await app.request('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: admin.email, password: admin.password }),
  });
  cookie = (res.headers.get('set-cookie') ?? '').split(';')[0];
});

afterAll(async () => {
  for (const id of createdIds) await deleteCampaign(id);
  await admin.cleanup();
  await pool.end();
});

describe('no session', () => {
  it.each([
    ['GET', ''],
    ['POST', ''],
    ['GET', '/00000000-0000-4000-8000-000000000000'],
    ['PUT', '/00000000-0000-4000-8000-000000000000'],
    ['DELETE', '/00000000-0000-4000-8000-000000000000'],
  ])('%s %s returns 401', async (method, path) => {
    const res = await request(method, path, method === 'GET' ? undefined : {}, false);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/admin/campaigns', () => {
  it('creates a campaign and returns 201', async () => {
    const res = await request('POST', '', makeCampaignInput({ title: 'Route Test' }));
    expect(res.status).toBe(201);
    const { campaign } = await res.json();
    createdIds.push(campaign.id);
    expect(campaign.slug).toMatch(/^route-test/);
    expect(campaign.questions).toHaveLength(3);
  });

  it('returns 400 with a clear message when a rule is broken', async () => {
    const res = await request('POST', '', makeCampaignInput({ questions: [] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'questions: A campaign needs 3 to 5 questions' });
  });
});

describe('GET /api/admin/campaigns', () => {
  it('lists campaigns with the number of participants', async () => {
    const campaign = await createViaApi();
    const res = await request('GET', '');
    expect(res.status).toBe(200);
    const { campaigns } = await res.json();
    expect(campaigns.find((c: { id: string }) => c.id === campaign.id)).toMatchObject({
      participants: 0,
    });
  });
});

describe('GET /api/admin/campaigns/:id', () => {
  it('returns the campaign with isCorrect for the admin', async () => {
    const campaign = await createViaApi();
    const res = await request('GET', `/${campaign.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.campaign.questions[0].options[0]).toHaveProperty('isCorrect', true);
  });

  it('returns 404 for an unknown id and for an id that is not a uuid', async () => {
    expect((await request('GET', '/00000000-0000-4000-8000-000000000000')).status).toBe(404);
    const res = await request('GET', '/not-a-uuid');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Campaign not found' });
  });
});

describe('PUT /api/admin/campaigns/:id', () => {
  it('updates the title', async () => {
    const campaign = await createViaApi();
    const res = await request('PUT', `/${campaign.id}`, { title: 'Renamed' });
    expect(res.status).toBe(200);
    expect((await res.json()).campaign.title).toBe('Renamed');
  });

  it('returns 400 for an empty body and 404 for an unknown id', async () => {
    const campaign = await createViaApi();
    expect((await request('PUT', `/${campaign.id}`, {})).status).toBe(400);
    expect(
      (await request('PUT', '/00000000-0000-4000-8000-000000000000', { title: 'x' })).status,
    ).toBe(404);
  });
});

describe('DELETE /api/admin/campaigns/:id', () => {
  it('deletes the campaign, then it is gone', async () => {
    const campaign = await createViaApi();
    const res = await request('DELETE', `/${campaign.id}`);
    expect(res.status).toBe(200);
    expect((await request('GET', `/${campaign.id}`)).status).toBe(404);
    expect((await request('DELETE', `/${campaign.id}`)).status).toBe(404);
  });
});
