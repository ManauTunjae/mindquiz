import { afterAll, describe, expect, it } from 'vitest';
import { pool } from '../db/client.js';
import { makeCampaignInput } from '../test-utils.js';
import { createCampaignSchema } from '../validation/campaign.js';
import { leadSchema } from '../validation/lead.js';
import { createCampaign, deleteCampaign, type CampaignDetail } from './campaigns.js';
import { CONSENT_TEXT } from './consent.js';
import { buildLeadsCsv, buildParticipantsCsv } from './exports.js';
import { createLead } from './leads.js';
import { submitAnswers } from './public-campaigns.js';

const createdIds: string[] = [];
const NOW = new Date('2026-11-02T10:00:00Z');

async function create() {
  const campaign = await createCampaign(
    createCampaignSchema.parse(makeCampaignInput({ status: 'published' })),
  );
  createdIds.push(campaign.id);
  return campaign;
}

// picks[i] says if question i is answered right (true) or wrong (false). Returns the submission id.
async function takeQuiz(campaign: CampaignDetail, picks: boolean[]) {
  const result = await submitAnswers(campaign.slug, {
    answers: campaign.questions.map((q, i) => ({
      questionId: q.id,
      optionId: q.options.find((o) => o.isCorrect === picks[i])!.id,
    })),
  });
  if (result.status !== 'ok') throw new Error('quiz was not saved');
  await new Promise((resolve) => setTimeout(resolve, 15)); // so the times differ
  return result.submissionId;
}

const addLead = (submissionId: string, name: string, email: string) =>
  createLead(submissionId, leadSchema.parse({ name, email, consent: true }));

// Simple reader for our own files (the cells in these tests have no quotes)
const table = (csv: string, delimiter = ';') =>
  csv
    .replace(/^\uFEFF/, '')
    .trimEnd()
    .split('\r\n')
    .map((line) => line.split(delimiter));

afterAll(async () => {
  for (const id of createdIds) await deleteCampaign(id);
  await pool.end();
});

describe('buildLeadsCsv', () => {
  it('has one row per lead with the important columns, newest first', async () => {
    const campaign = await create();
    const first = await takeQuiz(campaign, [true, true, true]);
    await addLead(first, 'Anna Svensson', 'Anna.Svensson@Example.com');
    const second = await takeQuiz(campaign, [true, false, false]);
    await addLead(second, 'Bo Berg', 'bo@example.com');

    const file = (await buildLeadsCsv(campaign.id, ';', NOW))!;
    const rows = table(file.body);

    expect(rows[0]).toEqual([
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
    ]);
    expect(rows).toHaveLength(3);
    // newest first
    expect(rows[1].slice(0, 6)).toEqual(['Bo Berg', 'bo@example.com', '1', '3', '33', 'Yes']);
    expect(rows[2].slice(0, 6)).toEqual([
      'Anna Svensson',
      'anna.svensson@example.com',
      '3',
      '3',
      '100',
      'Yes',
    ]);
    expect(rows[1][6]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(rows[1][7]).toBe(CONSENT_TEXT);
    expect(rows[2][9]).toBe(first);
    expect(rows[2][10]).toBe(campaign.title);
  });

  it('names the file after the campaign, the kind of data and the day', async () => {
    const campaign = await create();
    const file = (await buildLeadsCsv(campaign.id, ';', NOW))!;
    expect(file.filename).toBe(`mindquiz-${campaign.slug}-leads-2026-11-02.csv`);
  });

  it('only has the header when there are no leads', async () => {
    const campaign = await create();
    await takeQuiz(campaign, [true, true, true]); // a participant, but no lead
    const rows = table((await buildLeadsCsv(campaign.id, ';', NOW))!.body);
    expect(rows).toHaveLength(1);
  });

  it('starts with a BOM and keeps å, ä and ö', async () => {
    const campaign = await create();
    await addLead(await takeQuiz(campaign, [true, true, true]), 'Åsa Öberg', 'asa@example.com');
    const { body } = (await buildLeadsCsv(campaign.id, ';', NOW))!;
    expect(body.charCodeAt(0)).toBe(0xfeff);
    expect(body).toContain('Åsa Öberg');
  });

  it('can use a comma instead of a semicolon', async () => {
    const campaign = await create();
    await addLead(await takeQuiz(campaign, [true, true, true]), 'Anna', 'a@example.com');
    const rows = table((await buildLeadsCsv(campaign.id, ',', NOW))!.body, ',');
    expect(rows[0][0]).toBe('Name');
    expect(rows[1].slice(0, 2)).toEqual(['Anna', 'a@example.com']);
  });

  it('stops a name from being run as a formula in Excel', async () => {
    const campaign = await create();
    const evil = '=HYPERLINK("http://evil.example","click me")';
    await addLead(await takeQuiz(campaign, [true, true, true]), evil, 'evil@example.com');

    const { body } = (await buildLeadsCsv(campaign.id, ';', NOW))!;

    expect(body).toContain("'=HYPERLINK(");
    expect(body).not.toMatch(/(^|;|")=HYPERLINK/m);
  });

  it('does not include the leads of another campaign', async () => {
    const mine = await create();
    const other = await create();
    await addLead(await takeQuiz(other, [true, true, true]), 'Someone Else', 'else@example.com');

    const { body } = (await buildLeadsCsv(mine.id, ';', NOW))!;
    expect(body).not.toContain('Someone Else');
  });

  it('returns null for an unknown campaign and for an id that is not a uuid', async () => {
    expect(await buildLeadsCsv('00000000-0000-4000-8000-000000000000', ';')).toBeNull();
    expect(await buildLeadsCsv('not-a-uuid', ';')).toBeNull();
  });
});

describe('buildParticipantsCsv', () => {
  it('has one row per finished quiz and one pair of columns per question', async () => {
    const campaign = await create();
    await takeQuiz(campaign, [true, true, true]);
    await takeQuiz(campaign, [false, true, false]);

    const file = (await buildParticipantsCsv(campaign.id, ';', NOW))!;
    const rows = table(file.body);

    expect(file.filename).toBe(`mindquiz-${campaign.slug}-answers-2026-11-02.csv`);
    expect(rows[0].slice(0, 8)).toEqual([
      'Submission ID',
      'Completed at (UTC)',
      'Score',
      'Questions',
      'Score %',
      'Left contact details',
      'Name',
      'E-mail',
    ]);
    expect(rows[0].slice(8)).toEqual([
      'Q1: Question 1?',
      'Q1 correct',
      'Q2: Question 2?',
      'Q2 correct',
      'Q3: Question 3?',
      'Q3 correct',
    ]);
    expect(rows).toHaveLength(3);
    // newest first: the second quiz (wrong, right, wrong)
    expect(rows[1].slice(2, 5)).toEqual(['1', '3', '33']);
    expect(rows[1].slice(8)).toEqual(['Wrong', 'No', 'Right', 'Yes', 'Wrong', 'No']);
    expect(rows[2].slice(2, 5)).toEqual(['3', '3', '100']);
    expect(rows[2].slice(8)).toEqual(['Right', 'Yes', 'Right', 'Yes', 'Right', 'Yes']);
  });

  it('shows name and e-mail only for people who left their details', async () => {
    const campaign = await create();
    await takeQuiz(campaign, [true, true, true]); // stays anonymous
    await addLead(await takeQuiz(campaign, [true, true, false]), 'Anna', 'anna@example.com');

    const rows = table((await buildParticipantsCsv(campaign.id, ';', NOW))!.body);

    const withDetails = rows.find((r) => r[7] === 'anna@example.com')!;
    expect(withDetails.slice(5, 8)).toEqual(['Yes', 'Anna', 'anna@example.com']);
    const anonymous = rows.slice(1).find((r) => r[7] === '')!;
    expect(anonymous.slice(5, 8)).toEqual(['No', '', '']);
  });

  it('does not include the quizzes of another campaign', async () => {
    const mine = await create();
    const other = await create();
    await takeQuiz(other, [true, true, true]);

    const rows = table((await buildParticipantsCsv(mine.id, ';', NOW))!.body);
    expect(rows).toHaveLength(1); // only the header
  });

  it('returns null for an unknown campaign', async () => {
    expect(await buildParticipantsCsv('00000000-0000-4000-8000-000000000000', ';')).toBeNull();
    expect(await buildParticipantsCsv('not-a-uuid', ';')).toBeNull();
  });
});
