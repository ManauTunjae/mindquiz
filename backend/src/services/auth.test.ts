import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db, pool } from '../db/client.js';
import { sessions } from '../db/schema.js';
import { createTestAdmin } from '../test-utils.js';
import {
  createSession,
  deleteSession,
  getAdminBySession,
  hashToken,
  verifyCredentials,
} from './auth.js';

let admin: Awaited<ReturnType<typeof createTestAdmin>>;

beforeAll(async () => {
  admin = await createTestAdmin();
});

afterAll(async () => {
  await admin.cleanup();
  await pool.end();
});

describe('verifyCredentials', () => {
  it('returns the admin for the right password', async () => {
    const result = await verifyCredentials(admin.email, admin.password);
    expect(result).toEqual({ id: admin.id, email: admin.email });
  });

  it('returns null for a wrong password', async () => {
    expect(await verifyCredentials(admin.email, 'wrong-password')).toBeNull();
  });

  it('returns null for an unknown e-mail', async () => {
    expect(await verifyCredentials('nobody@example.com', admin.password)).toBeNull();
  });
});

describe('sessions', () => {
  it('finds the admin for a valid token', async () => {
    const { token } = await createSession(admin.id);
    expect(await getAdminBySession(token)).toEqual({ id: admin.id, email: admin.email });
  });

  it('stores only a hash of the token, not the token', async () => {
    const { token } = await createSession(admin.id);
    const rows = await db.select().from(sessions);
    expect(rows.some((row) => row.id === token)).toBe(false);
    expect(rows.some((row) => row.id === hashToken(token))).toBe(true);
  });

  it('returns null for an unknown token', async () => {
    expect(await getAdminBySession(randomBytes(32).toString('base64url'))).toBeNull();
  });

  it('returns null for an expired session', async () => {
    const token = randomBytes(32).toString('base64url');
    await db.insert(sessions).values({
      id: hashToken(token),
      adminId: admin.id,
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await getAdminBySession(token)).toBeNull();
  });

  it('returns null after the session is deleted', async () => {
    const { token } = await createSession(admin.id);
    await deleteSession(token);
    expect(await getAdminBySession(token)).toBeNull();
  });
});
