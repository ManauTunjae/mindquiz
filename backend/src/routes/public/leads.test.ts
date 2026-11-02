import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db, pool } from '../../db/client.js';
import { leads } from '../../db/schema.js';
import { app } from '../../index.js';
import { deleteCampaign } from '../../services/campaigns.js';
import { CONSENT_TEXT } from '../../services/consent.js';
import { createCampaignWithSubmission } from '../../test-utils.js';

// The lead route allows 10 requests per file (rate limit). Keep the number of POSTs below 10.

const createdCampaignIds: string[] = [];

async function setup() {
  const made = await createCampaignWithSubmission();
  createdCampaignIds.push(made.campaign.id);
  return made;
}

const valid = { name: 'Anna Svensson', email: 'Anna@Example.com', consent: true };

const sendLead = (submissionId: string, body: unknown) =>
  app.request(`/api/public/submissions/${submissionId}/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const leadsFor = (submissionId: string) =>
  db.select().from(leads).where(eq(leads.submissionId, submissionId));

afterAll(async () => {
  for (const id of createdCampaignIds) await deleteCampaign(id);
  await pool.end();
});

describe('GET /api/public/campaigns/:slug', () => {
  it('includes the consent text that is saved with a lead', async () => {
    const { campaign } = await setup();
    const res = await app.request(`/api/public/campaigns/${campaign.slug}`);
    expect((await res.json()).campaign.consentText).toBe(CONSENT_TEXT);
  });
});

describe('POST /api/public/submissions/:id/lead', () => {
  it('returns 201 without personal data, saves the lead, and then returns 409', async () => {
    const { submissionId } = await setup();

    const res = await sendLead(submissionId, valid);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });

    const [lead] = await leadsFor(submissionId);
    expect(lead).toMatchObject({ name: 'Anna Svensson', email: 'anna@example.com', consent: true });

    const again = await sendLead(submissionId, valid);
    expect(again.status).toBe(409);
    expect(await again.json()).toEqual({ error: 'Your details were already sent for this quiz' });
    expect(await leadsFor(submissionId)).toHaveLength(1);
  });

  it('returns 400 when the consent box is not ticked, and saves nothing', async () => {
    const { submissionId } = await setup();

    const res = await sendLead(submissionId, { ...valid, consent: false });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'consent: You need to agree to continue' });

    expect((await sendLead(submissionId, { name: valid.name, email: valid.email })).status).toBe(
      400,
    );
    expect(await leadsFor(submissionId)).toHaveLength(0);
  });

  it('returns 400 for an invalid e-mail or an empty name', async () => {
    const { submissionId } = await setup();

    const badEmail = await sendLead(submissionId, { ...valid, email: 'not-an-email' });
    expect(badEmail.status).toBe(400);
    expect((await badEmail.json()).error).toMatch(/^email:/);

    expect((await sendLead(submissionId, { ...valid, name: ' ' })).status).toBe(400);
    expect(await leadsFor(submissionId)).toHaveLength(0);
  });

  it('returns 404 for an unknown submission', async () => {
    const res = await sendLead('00000000-0000-4000-8000-000000000000', valid);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Submission not found' });
  });

  it('returns 413 for a body that is too big', async () => {
    const { submissionId } = await setup();
    const res = await sendLead(submissionId, { ...valid, padding: 'a'.repeat(8 * 1024) });
    expect(res.status).toBe(413);
    expect(await leadsFor(submissionId)).toHaveLength(0);
  });
});
