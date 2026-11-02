import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client.js';
import {
  answerOptions,
  campaigns,
  questions,
  submissionAnswers,
  submissions,
} from '../db/schema.js';
import type { SubmitAnswersInput } from '../validation/submission.js';
import { CONSENT_TEXT } from './consent.js';

// What a visitor may see. There is no isCorrect here, on purpose.
export type PublicCampaign = {
  slug: string;
  title: string;
  description: string;
  accentColor: string;
  consentText: string; // shown next to the checkbox of the lead form
  questions: Array<{
    id: number;
    text: string;
    options: Array<{ id: number; text: string }>;
  }>;
};

// Only published campaigns. A draft and a missing campaign look the same (null).
// Every field is copied by name. Never spread a database row here, because the
// answer rows contain isCorrect.
export async function getPublicCampaign(slug: string): Promise<PublicCampaign | null> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.slug, slug), eq(campaigns.status, 'published')));
  if (!campaign) return null;

  const questionRows = await db
    .select()
    .from(questions)
    .where(eq(questions.campaignId, campaign.id))
    .orderBy(asc(questions.position));

  const optionRows = questionRows.length
    ? await db
        .select()
        .from(answerOptions)
        .where(
          inArray(
            answerOptions.questionId,
            questionRows.map((q) => q.id),
          ),
        )
        .orderBy(asc(answerOptions.position))
    : [];

  return {
    slug: campaign.slug,
    title: campaign.title,
    description: campaign.description,
    accentColor: campaign.accentColor,
    consentText: CONSENT_TEXT,
    questions: questionRows.map((q) => ({
      id: q.id,
      text: q.text,
      options: optionRows
        .filter((o) => o.questionId === q.id)
        .map((o) => ({ id: o.id, text: o.text })),
    })),
  };
}

export type SubmitResult =
  | {
      status: 'ok';
      submissionId: string;
      score: number;
      total: number;
      results: Array<{ questionId: number; chosenOptionId: number; correctOptionId: number }>;
    }
  | { status: 'not_found' }
  | { status: 'invalid'; message: string };

// Check the answers, count the score on the server and save everything.
// The frontend never sends a score, and it only sees the correct answers in this result.
export async function submitAnswers(
  slug: string,
  input: SubmitAnswersInput,
): Promise<SubmitResult> {
  return db.transaction(async (tx): Promise<SubmitResult> => {
    // A shared lock on the campaign row. An admin who changes or unpublishes the campaign
    // needs an exclusive lock, so the questions cannot change while we count the score.
    const [campaign] = await tx
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(and(eq(campaigns.slug, slug), eq(campaigns.status, 'published')))
      .for('share');
    if (!campaign) return { status: 'not_found' };

    const questionRows = await tx
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.campaignId, campaign.id))
      .orderBy(asc(questions.position));

    const optionRows = questionRows.length
      ? await tx
          .select({
            id: answerOptions.id,
            questionId: answerOptions.questionId,
            isCorrect: answerOptions.isCorrect,
          })
          .from(answerOptions)
          .where(
            inArray(
              answerOptions.questionId,
              questionRows.map((q) => q.id),
            ),
          )
      : [];

    // One answer for every question, and not more than one for the same question
    const chosenByQuestion = new Map<number, number>();
    for (const answer of input.answers) {
      if (chosenByQuestion.has(answer.questionId)) {
        return { status: 'invalid', message: 'Each question can only be answered once' };
      }
      chosenByQuestion.set(answer.questionId, answer.optionId);
    }
    const questionIds = new Set(questionRows.map((q) => q.id));
    for (const questionId of chosenByQuestion.keys()) {
      if (!questionIds.has(questionId)) {
        return { status: 'invalid', message: `Unknown question: ${questionId}` };
      }
    }
    if (chosenByQuestion.size !== questionRows.length) {
      return { status: 'invalid', message: 'Answer all the questions' };
    }

    // Every chosen answer must belong to its own question
    const results: Array<{ questionId: number; chosenOptionId: number; correctOptionId: number }> =
      [];
    for (const question of questionRows) {
      const options = optionRows.filter((o) => o.questionId === question.id);
      const chosenOptionId = chosenByQuestion.get(question.id)!;
      const correct = options.find((o) => o.isCorrect);
      if (!correct || !options.some((o) => o.id === chosenOptionId)) {
        return { status: 'invalid', message: `Invalid answer for question ${question.id}` };
      }
      results.push({ questionId: question.id, chosenOptionId, correctOptionId: correct.id });
    }

    const score = results.filter((r) => r.chosenOptionId === r.correctOptionId).length;
    const total = results.length;

    const [submission] = await tx
      .insert(submissions)
      .values({ campaignId: campaign.id, score, total })
      .returning({ id: submissions.id });

    await tx.insert(submissionAnswers).values(
      results.map((r) => ({
        submissionId: submission.id,
        questionId: r.questionId,
        optionId: r.chosenOptionId,
      })),
    );

    return { status: 'ok', submissionId: submission.id, score, total, results };
  });
}
