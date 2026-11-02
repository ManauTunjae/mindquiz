import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { campaigns, leads, submissions } from '../db/schema.js';
import type { LeadInput } from '../validation/lead.js';
import { CONSENT_TEXT } from './consent.js';
import { isUuid } from './ids.js';

export type CreateLeadResult =
  { status: 'ok' } | { status: 'not_found' } | { status: 'already_exists' };

// The Postgres error can be wrapped by the driver, so we also look at `cause`.
function hasPgCode(err: unknown, code: string): boolean {
  const e = err as { code?: string; cause?: unknown } | null;
  if (!e) return false;
  return e.code === code || (e.cause ? hasPgCode(e.cause, code) : false);
}

// Save the contact details of a visitor, linked to their quiz submission.
// The consent text and the time come from the server. The client cannot set them.
export async function createLead(
  submissionId: string,
  input: LeadInput,
): Promise<CreateLeadResult> {
  if (!isUuid(submissionId)) return { status: 'not_found' };

  const [submission] = await db
    .select({ campaignId: submissions.campaignId })
    .from(submissions)
    .where(eq(submissions.id, submissionId));
  if (!submission) return { status: 'not_found' };

  try {
    // The database decides if a lead exists already (unique submission_id).
    // So two requests at the same time can never create two leads.
    const inserted = await db
      .insert(leads)
      .values({
        submissionId,
        campaignId: submission.campaignId,
        name: input.name,
        email: input.email,
        consent: true,
        consentText: CONSENT_TEXT,
        consentAt: new Date(),
      })
      .onConflictDoNothing({ target: leads.submissionId })
      .returning({ id: leads.id });

    return inserted.length > 0 ? { status: 'ok' } : { status: 'already_exists' };
  } catch (err) {
    // The campaign was deleted a moment ago, and the submission went with it (foreign key)
    if (hasPgCode(err, '23503')) return { status: 'not_found' };
    throw err;
  }
}

export type LeadRow = {
  id: number;
  name: string;
  email: string;
  score: number;
  total: number;
  consentAt: Date;
  createdAt: Date;
};

// The leads of one campaign, newest first. Returns null if the campaign does not exist.
export async function listLeads(campaignId: string): Promise<LeadRow[] | null> {
  if (!isUuid(campaignId)) return null;

  const [campaign] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));
  if (!campaign) return null;

  return db
    .select({
      id: leads.id,
      name: leads.name,
      email: leads.email,
      score: submissions.score,
      total: submissions.total,
      consentAt: leads.consentAt,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .innerJoin(submissions, eq(leads.submissionId, submissions.id))
    .where(eq(leads.campaignId, campaignId))
    .orderBy(desc(leads.createdAt), desc(leads.id));
}

// Delete one lead (a person asked to be deleted). Only the name and e-mail go away.
// The quiz submission stays, but nothing links it to the person any more.
// The campaign id must match, so a lead of another campaign cannot be deleted by mistake.
export async function deleteLead(campaignId: string, leadId: number): Promise<boolean> {
  if (!isUuid(campaignId)) return false;

  const deleted = await db
    .delete(leads)
    .where(and(eq(leads.id, leadId), eq(leads.campaignId, campaignId)))
    .returning({ id: leads.id });
  return deleted.length > 0;
}
