import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import {
  answerOptions,
  campaigns,
  leads,
  questions,
  submissionAnswers,
  submissions,
} from '../db/schema.js';
import { getCampaign } from './campaigns.js';
import { formatUtc, toCsv, type CsvCell, type CsvDelimiter } from './csv.js';
import { isUuid } from './ids.js';
import { listLeads } from './leads.js';
import { buildReportPdf } from './pdf-report.js';
import { getCampaignStats } from './stats.js';

export type ExportFile = { filename: string; body: string };

const percent = (score: number, total: number) =>
  total > 0 ? Math.round((score / total) * 100) : 0;

// "2026-11-02", used in file names so you can see when the file was made
const day = (date: Date) => date.toISOString().slice(0, 10);

async function findCampaign(campaignId: string) {
  if (!isUuid(campaignId)) return null;
  const [campaign] = await db
    .select({ id: campaigns.id, title: campaigns.title, slug: campaigns.slug })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));
  return campaign ?? null;
}

// People who left their name and e-mail, one row for each. Newest first.
export async function buildLeadsCsv(
  campaignId: string,
  delimiter: CsvDelimiter,
  now = new Date(),
): Promise<ExportFile | null> {
  const campaign = await findCampaign(campaignId);
  if (!campaign) return null;

  const rows = await db
    .select({
      name: leads.name,
      email: leads.email,
      score: submissions.score,
      total: submissions.total,
      consentAt: leads.consentAt,
      consentText: leads.consentText,
      completedAt: submissions.completedAt,
      submissionId: leads.submissionId,
    })
    .from(leads)
    .innerJoin(submissions, eq(leads.submissionId, submissions.id))
    .where(eq(leads.campaignId, campaign.id))
    .orderBy(desc(leads.createdAt), desc(leads.id));

  const table: CsvCell[][] = [
    [
      'Name',
      'E-mail',
      'Score',
      'Questions',
      'Score %',
      'Consent given',
      'Consent given at (UTC)',
      'Consent text',
      'Quiz completed at (UTC)',
      'Submission ID',
      'Campaign',
    ],
    ...rows.map((r) => [
      r.name,
      r.email,
      r.score,
      r.total,
      percent(r.score, r.total),
      true, // a lead can only exist with consent (the database checks it)
      formatUtc(r.consentAt),
      r.consentText,
      formatUtc(r.completedAt),
      r.submissionId,
      campaign.title,
    ]),
  ];

  return {
    filename: `mindquiz-${campaign.slug}-leads-${day(now)}.csv`,
    body: toCsv(table, { delimiter }),
  };
}

// Everyone who finished the quiz, one row for each. Newest first.
// Name and e-mail are only filled in for people who chose to leave them.
export async function buildParticipantsCsv(
  campaignId: string,
  delimiter: CsvDelimiter,
  now = new Date(),
): Promise<ExportFile | null> {
  const campaign = await findCampaign(campaignId);
  if (!campaign) return null;

  const questionRows = await db
    .select({ id: questions.id, text: questions.text })
    .from(questions)
    .where(eq(questions.campaignId, campaign.id))
    .orderBy(asc(questions.position));

  const participantRows = await db
    .select({
      id: submissions.id,
      completedAt: submissions.completedAt,
      score: submissions.score,
      total: submissions.total,
      leadName: leads.name,
      leadEmail: leads.email,
    })
    .from(submissions)
    .leftJoin(leads, eq(leads.submissionId, submissions.id))
    .where(eq(submissions.campaignId, campaign.id))
    .orderBy(desc(submissions.completedAt), desc(submissions.id));

  const answerRows = await db
    .select({
      submissionId: submissionAnswers.submissionId,
      questionId: submissionAnswers.questionId,
      text: answerOptions.text,
      isCorrect: answerOptions.isCorrect,
    })
    .from(submissionAnswers)
    .innerJoin(submissions, eq(submissionAnswers.submissionId, submissions.id))
    .innerJoin(answerOptions, eq(submissionAnswers.optionId, answerOptions.id))
    .where(eq(submissions.campaignId, campaign.id));

  const answerOf = new Map(answerRows.map((a) => [`${a.submissionId}:${a.questionId}`, a]));

  const table: CsvCell[][] = [
    [
      'Submission ID',
      'Completed at (UTC)',
      'Score',
      'Questions',
      'Score %',
      'Left contact details',
      'Name',
      'E-mail',
      ...questionRows.flatMap((q, i) => [`Q${i + 1}: ${q.text}`, `Q${i + 1} correct`]),
    ],
    ...participantRows.map((p) => [
      p.id,
      formatUtc(p.completedAt),
      p.score,
      p.total,
      percent(p.score, p.total),
      p.leadEmail !== null,
      p.leadName,
      p.leadEmail,
      ...questionRows.flatMap((q) => {
        const answer = answerOf.get(`${p.id}:${q.id}`);
        return [answer?.text ?? '', answer ? answer.isCorrect : null];
      }),
    ]),
  ];

  return {
    filename: `mindquiz-${campaign.slug}-answers-${day(now)}.csv`,
    body: toCsv(table, { delimiter }),
  };
}

export type ReportFile = { filename: string; body: Buffer };

// The PDF report: a summary, the answers per question and the leads.
// `generatedBy` is the e-mail of the admin who asked for it, and it is written in the report.
export async function buildReportFile(
  campaignId: string,
  generatedBy: string,
  now = new Date(),
): Promise<ReportFile | null> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) return null;

  const [stats, leadRows] = await Promise.all([
    getCampaignStats(campaign.id),
    listLeads(campaign.id),
  ]);
  if (!stats || !leadRows) return null;

  const body = await buildReportPdf({
    campaign: { title: campaign.title, status: campaign.status, createdAt: campaign.createdAt },
    stats,
    leads: leadRows,
    generatedAt: now,
    generatedBy,
  });

  return { filename: `mindquiz-${campaign.slug}-report-${day(now)}.pdf`, body };
}
