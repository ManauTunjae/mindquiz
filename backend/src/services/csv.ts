// Builds CSV text. No library: the rules are small, and we want to control them.

export type CsvCell = string | number | boolean | null | undefined;
export type CsvDelimiter = ';' | ',';

// Excel opens a file with a BOM as UTF-8, so å, ä and ö look right.
const BOM = '\uFEFF';

// "CSV injection": if a text cell starts with one of these, Excel and Sheets can treat it as a
// formula, and a visitor could write such a name in the quiz. We put a ' in front of it, so it
// stays plain text. (See OWASP "CSV Injection".) Numbers are never changed.
const FORMULA_START = /^[=+\-@\t\r]/;

export function neutralizeFormula(text: string): string {
  return FORMULA_START.test(text) ? `'${text}` : text;
}

function formatCell(cell: CsvCell, delimiter: CsvDelimiter): string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'number') return String(cell);
  if (typeof cell === 'boolean') return cell ? 'Yes' : 'No';

  const text = neutralizeFormula(cell);
  const needsQuotes = text.includes(delimiter) || /["\r\n]/.test(text);
  return needsQuotes ? `"${text.replaceAll('"', '""')}"` : text;
}

// One row per array. Rows end with CRLF, as the CSV standard (RFC 4180) says.
export function toCsv(rows: CsvCell[][], { delimiter = ';' }: { delimiter?: CsvDelimiter } = {}) {
  const lines = rows.map((row) => row.map((cell) => formatCell(cell, delimiter)).join(delimiter));
  return BOM + lines.join('\r\n') + '\r\n';
}

// "2026-11-02 09:36:00", always in UTC, so the same file means the same time for everyone.
export function formatUtc(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
