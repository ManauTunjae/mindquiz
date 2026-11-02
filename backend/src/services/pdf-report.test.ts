import { describe, expect, it } from 'vitest';
import { buildReportPdf, pdfText, type ReportInput } from './pdf-report.js';

const countPages = (pdf: Buffer) =>
  (pdf.toString('latin1').match(/\/Type \/Page(?!s)/g) ?? []).length;

function makeInput(overrides: Partial<ReportInput> = {}, leadCount = 0): ReportInput {
  return {
    campaign: { title: 'Wellbeing basics', status: 'published', createdAt: new Date('2026-11-01') },
    stats: {
      participants: 4,
      averageScore: 2.5,
      total: 3,
      leads: leadCount,
      questions: [1, 2, 3].map((n) => ({
        id: n,
        text: `Question ${n}?`,
        position: n,
        answered: 4,
        options: [
          { id: n * 10 + 1, text: 'Right', isCorrect: true, count: 3, percent: 75 },
          { id: n * 10 + 2, text: 'Wrong', isCorrect: false, count: 1, percent: 25 },
        ],
      })),
    },
    leads: Array.from({ length: leadCount }, (_, i) => ({
      id: i + 1,
      name: `Person ${i + 1}`,
      email: `person${i + 1}@example.com`,
      score: i % 4,
      total: 3,
      consentAt: new Date(Date.UTC(2026, 10, 2, 9, i % 60)),
      createdAt: new Date(),
    })),
    generatedAt: new Date('2026-11-02T09:20:00Z'),
    generatedBy: 'admin@example.com',
    ...overrides,
  };
}

describe('pdfText', () => {
  it('keeps Western European letters and common signs', () => {
    expect(pdfText('Åsa Öberg, Zoë, José, Müller, Œuvre')).toBe(
      'Åsa Öberg, Zoë, José, Müller, Œuvre',
    );
    expect(pdfText('“quotes” – dash … 5 € •')).toBe('“quotes” – dash … 5 € •');
  });

  it('turns letters the PDF font cannot show into a question mark', () => {
    expect(pdfText('Łukasz')).toBe('?ukasz');
    expect(pdfText('Иван')).toBe('????');
    expect(pdfText('李雷')).toBe('??');
    expect(pdfText('Hi 😀')).toBe('Hi ?'); // an emoji is one character, so one question mark
  });

  it('makes line breaks and tabs into single spaces', () => {
    expect(pdfText('one\ntwo\r\n\tthree   four')).toBe('one two three four');
  });
});

describe('buildReportPdf', () => {
  it('makes a real PDF file', async () => {
    const pdf = await buildReportPdf(makeInput());
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.subarray(-6).toString().trim()).toBe('%%EOF');
  });

  it('fits a normal report on one page, with no empty page at the end', async () => {
    expect(countPages(await buildReportPdf(makeInput({}, 3)))).toBe(1);
  });

  it('works when nobody has answered and there are no leads', async () => {
    const pdf = await buildReportPdf(
      makeInput({
        stats: { participants: 0, averageScore: null, total: 3, leads: 0, questions: [] },
        leads: [],
      }),
    );
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(countPages(pdf)).toBe(1);
  });

  it('continues the leads table on more pages when there are many leads', async () => {
    const pdf = await buildReportPdf(makeInput({}, 120));
    const pages = countPages(pdf);
    expect(pages).toBeGreaterThan(1);
    expect(pages).toBeLessThan(10); // rows are close together, so it does not need a page for each
  });

  it('does not break on odd names, long texts and letters the font cannot show', async () => {
    const input = makeInput({}, 8);
    const odd = [
      'Łukasz Żółć',
      'Иван',
      '李雷',
      'Emoji 😀',
      '=HYPERLINK("x")',
      'x'.repeat(400),
      'Åsa "Quote" O\'Neil',
      '',
    ];
    input.leads.forEach((lead, i) => {
      lead.name = odd[i];
      lead.email = `${'long'.repeat(60)}@example.com`;
    });
    input.campaign.title = 'Very long title '.repeat(20) + 'ÅÄÖ Łódź';
    input.stats.questions[0].text = 'A long question? '.repeat(40);
    input.stats.questions[0].options[0].text = 'A long answer '.repeat(40);

    const pdf = await buildReportPdf(input);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('can be made without compression (so a person can read the file when debugging)', async () => {
    const pdf = await buildReportPdf(makeInput(), { compress: false });
    expect(pdf.toString('latin1')).toContain('/Title');
  });
});
