import { describe, expect, it } from 'vitest';
import { formatUtc, neutralizeFormula, toCsv } from './csv.js';

const body = (csv: string) => csv.replace(/^\uFEFF/, '');

describe('toCsv', () => {
  it('starts with a BOM and ends every row with CRLF', () => {
    const csv = toCsv([
      ['a', 'b'],
      ['c', 'd'],
    ]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(body(csv)).toBe('a;b\r\nc;d\r\n');
  });

  it('uses a semicolon by default and a comma when asked', () => {
    expect(body(toCsv([['a', 'b']]))).toBe('a;b\r\n');
    expect(body(toCsv([['a', 'b']], { delimiter: ',' }))).toBe('a,b\r\n');
  });

  it('puts quotes around text with the delimiter, a quote or a line break', () => {
    expect(body(toCsv([['a;b', 'c']]))).toBe('"a;b";c\r\n');
    expect(body(toCsv([['say "hi"']]))).toBe('"say ""hi"""\r\n');
    expect(body(toCsv([['line1\nline2']]))).toBe('"line1\nline2"\r\n');
    expect(body(toCsv([['line1\r\nline2']]))).toBe('"line1\r\nline2"\r\n');
  });

  it('only quotes for the delimiter that is in use', () => {
    expect(body(toCsv([['a,b']]))).toBe('a,b\r\n'); // semicolon file: a comma is fine
    expect(body(toCsv([['a,b']], { delimiter: ',' }))).toBe('"a,b"\r\n');
  });

  it('writes empty cells for null and undefined, and Yes/No for booleans', () => {
    expect(body(toCsv([[null, undefined, true, false]]))).toBe(';;Yes;No\r\n');
  });

  it('keeps numbers as they are, also negative ones', () => {
    expect(body(toCsv([[0, 67, -5, 2.5]]))).toBe('0;67;-5;2.5\r\n');
  });

  it('keeps å, ä, ö and other letters', () => {
    expect(body(toCsv([['Åsa Öberg', 'Zoë', 'Łukasz']]))).toBe('Åsa Öberg;Zoë;Łukasz\r\n');
  });
});

describe('CSV injection', () => {
  it.each([
    '=1+1',
    '+46701234567',
    '-2+3',
    '@SUM(A1)',
    '\t=1+1',
    '\r=1+1',
    '=HYPERLINK("http://evil","x")',
  ])('puts a quote in front of the text %j', (text) => {
    const cell = body(toCsv([[text]])).trimEnd();
    expect(cell.replace(/^"/, '').startsWith("'")).toBe(true);
  });

  it('does not change normal text, also when it has a dash or equals sign inside', () => {
    expect(neutralizeFormula('Anna-Lisa')).toBe('Anna-Lisa');
    expect(neutralizeFormula('a=b')).toBe('a=b');
    expect(neutralizeFormula('')).toBe('');
  });

  it('also protects the headers', () => {
    expect(body(toCsv([['=bad header']]))).toBe("'=bad header\r\n");
  });
});

describe('formatUtc', () => {
  it('writes date and time in UTC without a T or Z', () => {
    expect(formatUtc(new Date('2026-11-02T09:36:05.123Z'))).toBe('2026-11-02 09:36:05');
  });
});
