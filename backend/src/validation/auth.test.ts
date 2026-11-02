import { describe, expect, it } from 'vitest';
import { loginSchema } from './auth.js';

describe('loginSchema', () => {
  it('cleans the e-mail before it checks it', () => {
    const result = loginSchema.parse({ email: '  Admin@Example.COM ', password: 'secret' });
    expect(result.email).toBe('admin@example.com');
  });

  it('rejects an invalid e-mail and an empty password', () => {
    expect(loginSchema.safeParse({ email: 'abc', password: 'x' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@example.com', password: '' }).success).toBe(false);
  });
});
