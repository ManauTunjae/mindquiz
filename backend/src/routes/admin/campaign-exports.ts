import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';
import { HttpError } from '../../middleware/error-handler.js';
import type { CsvDelimiter } from '../../services/csv.js';
import { type AuthEnv } from '../../middleware/auth.js';
import {
  buildLeadsCsv,
  buildParticipantsCsv,
  buildReportFile,
  type ExportFile,
} from '../../services/exports.js';

// Download your data. Mounted after the auth middleware, so every route here needs an admin session.
// The files contain personal data, so they must never be saved in a cache.
export const campaignExportRoutes = new Hono<AuthEnv>();

const delimiterSchema = z.enum(['semicolon', 'comma']).default('semicolon');

function readDelimiter(c: Context<AuthEnv>): CsvDelimiter {
  const parsed = delimiterSchema.safeParse(c.req.query('delimiter') ?? undefined);
  if (!parsed.success) throw new HttpError(400, 'delimiter must be "semicolon" or "comma"');
  return parsed.data === 'comma' ? ',' : ';';
}

export function downloadHeaders(contentType: string, filename: string) {
  return {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}

function csvResponse(c: Context<AuthEnv>, file: ExportFile | null) {
  if (!file) throw new HttpError(404, 'Campaign not found');
  return c.body(file.body, 200, downloadHeaders('text/csv; charset=utf-8', file.filename));
}

campaignExportRoutes.get('/:id/export/leads.csv', async (c) =>
  csvResponse(c, await buildLeadsCsv(c.req.param('id'), readDelimiter(c))),
);

campaignExportRoutes.get('/:id/export/participants.csv', async (c) =>
  csvResponse(c, await buildParticipantsCsv(c.req.param('id'), readDelimiter(c))),
);

campaignExportRoutes.get('/:id/export/report.pdf', async (c) => {
  const file = await buildReportFile(c.req.param('id'), c.get('admin').email);
  if (!file) throw new HttpError(404, 'Campaign not found');
  return c.body(new Uint8Array(file.body), 200, downloadHeaders('application/pdf', file.filename));
});
