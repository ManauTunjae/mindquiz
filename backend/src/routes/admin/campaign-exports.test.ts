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
const createdCampaignIds: string[] = [];

const unknownId = '00000000-0000-4000-8000-000000000000';
const files = ['leads.csv', 'participants.csv', 'report.pdf'];

const get = (path: string, withCookie = true) =>
  app.request(`/api/admin/campaigns${path}`, { headers: withCookie ? { Cookie: cookie } : {} });

// Response.text() removes a BOM, so we read the bytes. A UTF-8 BOM is the three bytes EF BB BF.
async function getCsv(path: string) {
  const bytes = Buffer.from(await (await get(path)).arrayBuffer());
  return {
    hasBom: bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf,
    text: bytes.subarray(3).toString('utf8'),
  };
}

beforeAll(async () => {
  admin = await createTestAdmin();
  const login = await app.request('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: admin.email, password: admin.password }),
  });
  cookie = (login.headers.get('set-cookie') ?? '').split(';')[0];

  const made = await createCampaignWithSubmission();
  campaignId = made.campaign.id;
  createdCampaignIds.push(campaignId);
  await createLead(
    made.submissionId,
    leadSchema.parse({ name: 'Åsa Öberg', email: 'asa@example.com', consent: true }),
  );
});

afterAll(async () => {
  for (const id of createdCampaignIds) await deleteCampaign(id);
  await admin.cleanup();
  await pool.end();
});

describe('who may download', () => {
  it.each(files)('%s needs an admin session', async (file) => {
    const res = await get(`/${campaignId}/export/${file}`, false);
    expect(res.status).toBe(401);
    expect(await res.json()).toHaveProperty('error');
  });

  it.each(files)(
    '%s returns 404 for an unknown campaign and for an id that is not a uuid',
    async (file) => {
      expect((await get(`/${unknownId}/export/${file}`)).status).toBe(404);
      const res = await get(`/not-a-uuid/export/${file}`);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'Campaign not found' });
    },
  );
});

describe('the headers of every file', () => {
  it.each([
    [
      'leads.csv',
      'text/csv; charset=utf-8',
      /^attachment; filename="mindquiz-.+-leads-\d{4}-\d{2}-\d{2}\.csv"$/,
    ],
    [
      'participants.csv',
      'text/csv; charset=utf-8',
      /^attachment; filename="mindquiz-.+-answers-\d{4}-\d{2}-\d{2}\.csv"$/,
    ],
    [
      'report.pdf',
      'application/pdf',
      /^attachment; filename="mindquiz-.+-report-\d{4}-\d{2}-\d{2}\.pdf"$/,
    ],
  ])('%s is a download that is never cached', async (file, type, disposition) => {
    const res = await get(`/${campaignId}/export/${file}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(type);
    expect(res.headers.get('content-disposition')).toMatch(disposition);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('leads.csv', () => {
  it('starts with a BOM and has the header, and the lead with its letters intact', async () => {
    const { hasBom, text } = await getCsv(`/${campaignId}/export/leads.csv`);
    expect(hasBom).toBe(true);
    const lines = text.trimEnd().split('\r\n');
    expect(lines[0].startsWith('Name;E-mail;Score;')).toBe(true);
    expect(lines[1].startsWith('Åsa Öberg;asa@example.com;3;3;100;Yes;')).toBe(true);
  });

  it('uses a comma when asked for one', async () => {
    const { text } = await getCsv(`/${campaignId}/export/leads.csv?delimiter=comma`);
    expect(text.startsWith('Name,E-mail,Score,')).toBe(true);
  });

  it('returns 400 for another delimiter', async () => {
    const res = await get(`/${campaignId}/export/leads.csv?delimiter=tab`);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'delimiter must be "semicolon" or "comma"' });
  });
});

describe('participants.csv', () => {
  it('has one row for the finished quiz, with the name of the person who left details', async () => {
    const { hasBom, text } = await getCsv(`/${campaignId}/export/participants.csv`);
    expect(hasBom).toBe(true);
    const lines = text.trimEnd().split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[0].startsWith('Submission ID;Completed at (UTC);Score;')).toBe(true);
    expect(lines[0]).toContain('Left contact details;Name;E-mail;Q1: Question 1?;Q1 correct');
    expect(lines[1]).toContain(';3;3;100;Yes;Åsa Öberg;asa@example.com;Right;Yes;');
  });
});

describe('report.pdf', () => {
  it('is a real PDF file', async () => {
    const bytes = Buffer.from(await (await get(`/${campaignId}/export/report.pdf`)).arrayBuffer());
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(bytes.subarray(-6).toString().trim()).toBe('%%EOF');
    expect(bytes.length).toBeGreaterThan(1000);
  });
});
