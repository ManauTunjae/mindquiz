import { describe, expect, it } from 'vitest';
import { slugify, withRandomSuffix } from './slug.js';

describe('slugify', () => {
  it('makes a lowercase slug with dashes', () => {
    expect(slugify('Wellbeing basics')).toBe('wellbeing-basics');
  });

  it('removes accents and special characters', () => {
    expect(slugify('  Café: Tänk på dig!  ')).toBe('cafe-tank-pa-dig');
  });

  it('falls back to "campaign" when nothing is left', () => {
    expect(slugify('!!!')).toBe('campaign');
  });

  it('cuts long titles without a trailing dash', () => {
    const slug = slugify('a'.repeat(49) + ' bbb');
    expect(slug.length).toBeLessThanOrEqual(50);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('withRandomSuffix', () => {
  it('adds 6 random hex characters', () => {
    expect(withRandomSuffix('abc')).toMatch(/^abc-[0-9a-f]{6}$/);
  });
});
