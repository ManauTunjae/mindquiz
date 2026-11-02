import PDFDocument from 'pdfkit';
import { formatUtc } from './csv.js';
import type { LeadRow } from './leads.js';
import type { CampaignStats } from './stats.js';

// A PDF report of one campaign: a summary, the answers per question, and the leads.

export type ReportInput = {
  campaign: { title: string; status: 'draft' | 'published'; createdAt: Date };
  stats: CampaignStats;
  leads: LeadRow[];
  generatedAt: Date;
  generatedBy: string; // the e-mail of the admin who made the report
};

// --- text -------------------------------------------------------------------------------

// The built-in PDF fonts (Helvetica) can show Western European letters: the Latin-1 letters
// (å, ä, ö, é, ü ...) and a few extra signs. Other letters would break the text, so they become "?".
const EXTRA_SIGNS = new Set([
  0x0152, 0x0153, 0x0160, 0x0161, 0x0178, 0x017d, 0x017e, 0x2013, 0x2014, 0x2018, 0x2019, 0x201c,
  0x201d, 0x2022, 0x2026, 0x20ac, 0x2122,
]);

function canShow(code: number) {
  return (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || EXTRA_SIGNS.has(code);
}

export function pdfText(value: string): string {
  let result = '';
  for (const char of value.replace(/\s+/g, ' ')) {
    result += canShow(char.codePointAt(0) ?? 0) ? char : '?';
  }
  return result;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

// --- look -------------------------------------------------------------------------------

const INK = '#1E1E1E';
const SOFT = '#5F5E5B';
const MIST = '#D9D6D0';
const PAPER = '#F7F4EF';
const ACCENT = '#FF7A00';

const MARGIN = 50;
const FOOTER_SPACE = 52; // room at the bottom of every page for the footer

type Doc = InstanceType<typeof PDFDocument>;

const contentWidth = (doc: Doc) => doc.page.width - MARGIN * 2;
const pageBottom = (doc: Doc) => doc.page.height - FOOTER_SPACE;

// Start a new page if the next block does not fit on this one.
function ensureSpace(doc: Doc, height: number) {
  if (doc.y + height > pageBottom(doc)) doc.addPage();
}

function sectionTitle(doc: Doc, title: string) {
  ensureSpace(doc, 70);
  doc.moveDown(1.2);
  doc.font('Helvetica-Bold').fontSize(13).fillColor(INK).text(title, MARGIN, doc.y);
  const y = doc.y + 3;
  doc
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + contentWidth(doc), y)
    .lineWidth(0.75)
    .strokeColor(MIST)
    .stroke();
  doc.y = y + 10;
}

// --- parts of the report ----------------------------------------------------------------

function drawHeader(doc: Doc, input: ReportInput) {
  const { campaign, generatedAt, generatedBy } = input;

  doc.rect(0, 0, doc.page.width, 6).fill(ACCENT);

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(SOFT)
    .text('MINDQUIZ · CAMPAIGN REPORT', MARGIN, 34);
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(INK)
    .text(pdfText(campaign.title), MARGIN, 52, {
      width: contentWidth(doc),
    });

  const status = campaign.status === 'published' ? 'Published' : 'Draft';
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(SOFT)
    .text(
      `${status} · Created ${dateFormat.format(campaign.createdAt)} · Report made ${dateTimeFormat.format(generatedAt)} UTC by ${pdfText(generatedBy)}`,
      MARGIN,
      doc.y + 4,
      { width: contentWidth(doc) },
    );
  doc.moveDown(1.2);
}

function drawSummary(doc: Doc, { stats }: ReportInput) {
  const average =
    stats.averageScore === null
      ? '-'
      : `${stats.averageScore} of ${stats.total} (${Math.round((stats.averageScore / Math.max(stats.total, 1)) * 100)}%)`;
  const leadRate =
    stats.participants > 0 ? `${Math.round((stats.leads / stats.participants) * 100)}%` : '-';

  const tiles = [
    ['Participants', String(stats.participants)],
    ['Average score', average],
    ['Leads', String(stats.leads)],
    ['Left their details', leadRate],
  ];

  const gap = 10;
  const width = (contentWidth(doc) - gap * (tiles.length - 1)) / tiles.length;
  const top = doc.y;

  tiles.forEach(([label, value], i) => {
    const x = MARGIN + i * (width + gap);
    doc.roundedRect(x, top, width, 58, 8).lineWidth(0.75).fillAndStroke(PAPER, MIST);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(SOFT)
      .text(label, x + 10, top + 10, { width: width - 20 });
    doc
      .font('Helvetica-Bold')
      .fontSize(i === 1 ? 12 : 18)
      .fillColor(INK)
      .text(value, x + 10, top + 28, {
        width: width - 20,
      });
  });

  doc.y = top + 58;
}

function drawQuestions(doc: Doc, { stats }: ReportInput) {
  sectionTitle(doc, 'Answers per question');

  if (stats.participants === 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(SOFT)
      .text('No one has answered yet.', MARGIN, doc.y);
    return;
  }

  const barWidth = contentWidth(doc);

  stats.questions.forEach((question, index) => {
    const title = `${index + 1}. ${pdfText(question.text)}`;
    const titleHeight = doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .heightOfString(title, { width: barWidth });
    // keep a question together: it needs room for its title and all its answers
    ensureSpace(doc, titleHeight + 20 + question.options.length * 30);

    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(INK)
      .text(title, MARGIN, doc.y, { width: barWidth });
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(SOFT)
      .text(
        `${question.answered} ${question.answered === 1 ? 'answer' : 'answers'}`,
        MARGIN,
        doc.y + 1,
      );
    doc.y += 6;

    for (const option of question.options) {
      const label = pdfText(option.text) + (option.isCorrect ? '  (correct answer)' : '');
      const numbers = `${option.count} (${option.percent}%)`;
      const top = doc.y;

      doc
        .font(option.isCorrect ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9.5)
        .fillColor(INK)
        .text(label, MARGIN, top, { width: barWidth - 80 });
      const textBottom = doc.y;
      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .text(numbers, MARGIN + barWidth - 78, top, {
          width: 78,
          align: 'right',
        });

      const barTop = textBottom + 2;
      doc.roundedRect(MARGIN, barTop, barWidth, 5, 2.5).fill(MIST);
      if (option.percent > 0) {
        doc
          .roundedRect(MARGIN, barTop, Math.max(5, (barWidth * option.percent) / 100), 5, 2.5)
          .fill(option.isCorrect ? INK : '#8A8883');
      }
      doc.y = barTop + 13;
    }
    doc.y += 8;
  });
}

// The leads table. Long names and e-mails are cut with "...", so every row is one line.
function drawLeads(doc: Doc, { leads }: ReportInput) {
  sectionTitle(doc, `Leads (${leads.length})`);

  if (leads.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(SOFT)
      .text('No one has left their details yet.', MARGIN, doc.y);
    return;
  }

  const columns = [
    { title: 'Name', width: 140 },
    { title: 'E-mail', width: 185 },
    { title: 'Score', width: 55 },
    { title: 'Consent given (UTC)', width: contentWidth(doc) - 380 },
  ];
  const rowHeight = 20;

  const drawRow = (cells: string[], y: number, bold: boolean, shaded: boolean) => {
    if (shaded) doc.rect(MARGIN, y, contentWidth(doc), rowHeight).fill(PAPER);
    let x = MARGIN;
    columns.forEach((column, i) => {
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9)
        .fillColor(INK)
        .text(cells[i], x + 6, y + 6, { width: column.width - 12, height: 11, ellipsis: true });
      x += column.width;
    });
  };

  const drawHeaderRow = () => {
    drawRow(
      columns.map((c) => c.title),
      doc.y,
      true,
      false,
    );
    const y = doc.y + rowHeight;
    doc
      .moveTo(MARGIN, y)
      .lineTo(MARGIN + contentWidth(doc), y)
      .lineWidth(0.75)
      .strokeColor(INK)
      .stroke();
    doc.y = y + 1;
  };

  drawHeaderRow();

  leads.forEach((lead, i) => {
    if (doc.y + rowHeight > pageBottom(doc)) {
      doc.addPage();
      doc.y = MARGIN;
      drawHeaderRow();
    }
    drawRow(
      [
        pdfText(lead.name),
        pdfText(lead.email),
        `${lead.score} of ${lead.total}`,
        formatUtc(lead.consentAt),
      ],
      doc.y,
      false,
      i % 2 === 1,
    );
    doc.y += rowHeight;
  });
}

// On every page: the name of the campaign, the page number, and a reminder about personal data.
function drawFooters(doc: Doc, { campaign }: ReportInput) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 38;
    // Text below the bottom margin would make PDFKit start a new page, so the margin is 0 here.
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc
      .moveTo(MARGIN, y - 8)
      .lineTo(doc.page.width - MARGIN, y - 8)
      .lineWidth(0.5)
      .strokeColor(MIST)
      .stroke();
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(SOFT)
      .text(pdfText(campaign.title), MARGIN, y, {
        width: contentWidth(doc) - 80,
        height: 10,
        ellipsis: true,
      });
    doc.text(`Page ${i - range.start + 1} of ${range.count}`, doc.page.width - MARGIN - 78, y, {
      width: 78,
      align: 'right',
    });
    doc.text(
      'Contains personal data. Handle with care and delete when it is no longer needed.',
      MARGIN,
      y + 12,
      {
        width: contentWidth(doc),
      },
    );

    doc.page.margins.bottom = savedBottom;
  }
}

// --- the file ---------------------------------------------------------------------------

export function buildReportPdf(input: ReportInput, { compress = true } = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      bufferPages: true, // needed to write "page 1 of 3" at the end
      compress,
      info: {
        Title: pdfText(`Campaign report: ${input.campaign.title}`),
        Author: 'MindQuiz',
        Creator: 'MindQuiz',
        CreationDate: input.generatedAt,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawHeader(doc, input);
    drawSummary(doc, input);
    drawQuestions(doc, input);
    drawLeads(doc, input);
    drawFooters(doc, input);

    doc.end();
  });
}
