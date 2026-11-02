import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { db } from './db/client.js';
import { admins } from './db/schema.js';

// Creates an admin with a random e-mail for one test file.
// cleanup() deletes only this admin (its sessions go away with it, because of cascade).
export async function createTestAdmin() {
  const email = `test-${randomUUID()}@example.com`;
  const password = `pw-${randomUUID()}`;
  const [admin] = await db
    .insert(admins)
    .values({ email, passwordHash: await argon2.hash(password) })
    .returning();

  return {
    id: admin.id,
    email,
    password,
    cleanup: async () => {
      await db.delete(admins).where(eq(admins.id, admin.id));
    },
  };
}

// A valid campaign body. Override fields to test one rule at a time.
export function makeCampaignInput(overrides: Record<string, unknown> = {}) {
  const question = (n: number) => ({
    text: `Question ${n}?`,
    options: [
      { text: 'Right', isCorrect: true },
      { text: 'Wrong', isCorrect: false },
    ],
  });
  return {
    title: `Test campaign ${randomUUID()}`,
    description: 'Made by a test',
    accentColor: '#FF7A00',
    status: 'draft',
    questions: [question(1), question(2), question(3)],
    ...overrides,
  };
}

// A published campaign (3 questions) with one finished quiz submission. Returns the ids.
// The caller must delete the campaign after the test (this also deletes the submission and lead).
export async function createCampaignWithSubmission() {
  const { createCampaign } = await import('./services/campaigns.js');
  const { submitAnswers } = await import('./services/public-campaigns.js');
  const { createCampaignSchema } = await import('./validation/campaign.js');

  const campaign = await createCampaign(
    createCampaignSchema.parse(makeCampaignInput({ status: 'published' })),
  );
  const result = await submitAnswers(campaign.slug, {
    answers: campaign.questions.map((q) => ({
      questionId: q.id,
      optionId: q.options.find((o) => o.isCorrect)!.id,
    })),
  });
  if (result.status !== 'ok') throw new Error('could not create a test submission');

  return { campaign, submissionId: result.submissionId };
}
