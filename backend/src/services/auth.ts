import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { and, eq, gt, lt } from 'drizzle-orm';
import { db } from '../db/client.js';
import { admins, sessions } from '../db/schema.js';

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type AdminInfo = { id: number; email: string };

// The cookie holds the random token. The database only holds its hash.
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Used when the e-mail does not exist, so the response time is the same as for a wrong password.
let dummyHash: Promise<string> | undefined;
function getDummyHash() {
  dummyHash ??= argon2.hash('not-a-real-password');
  return dummyHash;
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AdminInfo | null> {
  const [admin] = await db.select().from(admins).where(eq(admins.email, email));

  if (!admin) {
    await argon2.verify(await getDummyHash(), password);
    return null;
  }

  const ok = await argon2.verify(admin.passwordHash, password);
  return ok ? { id: admin.id, email: admin.email } : null;
}

export async function createSession(adminId: number) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  // Remove old sessions that are expired, so the table does not grow forever
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  await db.insert(sessions).values({ id: hashToken(token), adminId, expiresAt });

  return { token, expiresAt };
}

export async function getAdminBySession(token: string): Promise<AdminInfo | null> {
  const [row] = await db
    .select({ id: admins.id, email: admins.email })
    .from(sessions)
    .innerJoin(admins, eq(sessions.adminId, admins.id))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())));

  return row ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}
