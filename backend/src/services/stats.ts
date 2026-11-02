import { asc, avg, count, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import {
  answerOptions,
  campaigns,
  leads,
  questions,
  submissionAnswers,
  submissions,
} from '../db/schema.js';
import { isUuid } from './ids.js';

export type CampaignStats = {
  participants: number; // finished quizzes. The same person can be counted twice (no login for visitors).
  averageScore: number | null; // average number of right answers, for example 2.4. null if no one answered.
  total: number; // number of questions, so "2.4 of 3"
  leads: number;
  questions: Array<{
    id: number;
    text: string;
    position: number;
    answered: number;
    options: Array<{
      id: number;
      text: string;
      isCorrect: boolean;
      count: number;
      percent: number; // of the people who answered this question
    }>;
  }>;
};

// Admin view, so isCorrect is included. Returns null if the campaign does not exist.
export async function getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
  if (!isUuid(campaignId)) return null;

  const [campaign] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));
  if (!campaign) return null;

  const [totals] = await db
    .select({ participants: count(), averageScore: avg(submissions.score) })
    .from(submissions)
    .where(eq(submissions.campaignId, campaignId));

  const [leadTotals] = await db
    .select({ leads: count() })
    .from(leads)
    .where(eq(leads.campaignId, campaignId));

  // One row for every answer option of the campaign, with the number of times it was chosen.
  // The left join keeps options that no one has chosen (count 0).
  const rows = await db
    .select({
      questionId: questions.id,
      questionText: questions.text,
      questionPosition: questions.position,
      optionId: answerOptions.id,
      optionText: answerOptions.text,
      isCorrect: answerOptions.isCorrect,
      chosen: count(submissionAnswers.id),
    })
    .from(questions)
    .innerJoin(answerOptions, eq(answerOptions.questionId, questions.id))
    .leftJoin(submissionAnswers, eq(submissionAnswers.optionId, answerOptions.id))
    .where(eq(questions.campaignId, campaignId))
    .groupBy(questions.id, answerOptions.id)
    .orderBy(asc(questions.position), asc(answerOptions.position));

  const byQuestion = new Map<number, CampaignStats['questions'][number]>();
  for (const row of rows) {
    let question = byQuestion.get(row.questionId);
    if (!question) {
      question = {
        id: row.questionId,
        text: row.questionText,
        position: row.questionPosition,
        answered: 0,
        options: [],
      };
      byQuestion.set(row.questionId, question);
    }
    question.answered += row.chosen;
    question.options.push({
      id: row.optionId,
      text: row.optionText,
      isCorrect: row.isCorrect,
      count: row.chosen,
      percent: 0,
    });
  }

  const questionStats = [...byQuestion.values()];
  for (const question of questionStats) {
    for (const option of question.options) {
      option.percent =
        question.answered > 0 ? Math.round((option.count / question.answered) * 100) : 0;
    }
  }

  return {
    participants: totals.participants,
    averageScore:
      totals.averageScore === null ? null : Math.round(Number(totals.averageScore) * 10) / 10,
    total: questionStats.length,
    leads: leadTotals.leads,
    questions: questionStats,
  };
}
