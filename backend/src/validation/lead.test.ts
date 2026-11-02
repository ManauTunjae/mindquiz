import { describe, expect, it } from 'vitest';
import { leadSchema } from './lead.js';

const valid = { name: 'Anna Svensson', email: 'anna@example.com', consent: true };

describe('leadSchema', () => {
  it('accepts valid details and cleans them up', () => {
    const result = leadSchema.parse({
      name: '  Anna  ',
      email: '  Anna@Example.COM ',
      consent: true,
    });
    expect(result).toEqual({ name: 'Anna', email: 'anna@example.com', consent: true });
  });

  it.each([
    ['consent false', { ...valid, consent: false }],
    ['no consent field', { name: valid.name, email: valid.email }],
    ['consent as text "true"', { ...valid, consent: 'true' }],
    ['consent as 1', { ...valid, consent: 1 }],
    ['empty name', { ...valid, name: '   ' }],
    ['name that is too long', { ...valid, name: 'a'.repeat(101) }],
    ['no @ in e-mail', { ...valid, email: 'anna.example.com' }],
    ['empty e-mail', { ...valid, email: '' }],
    ['e-mail that is too long', { ...valid, email: `${'a'.repeat(250)}@example.com` }],
  ])('rejects %s', (_name, body) => {
    expect(leadSchema.safeParse(body).success).toBe(false);
  });

  it('gives a clear message when consent is missing', () => {
    const result = leadSchema.safeParse({ ...valid, consent: false });
    expect(result.error?.issues[0].message).toBe('You need to agree to continue');
  });
});
