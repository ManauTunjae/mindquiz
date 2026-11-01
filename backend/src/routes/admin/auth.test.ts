import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pool } from '../../db/client.js';
import { app } from '../../index.js';
import { createTestAdmin } from '../../test-utils.js';

let admin: Awaited<ReturnType<typeof createTestAdmin>>;
let cookie: string;
let loginSetCookie: string;

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const login = (email: string, password: string) =>
  post('/api/admin/auth/login', { email, password });

beforeAll(async () => {
  admin = await createTestAdmin();
  const res = await login(admin.email, admin.password);
  loginSetCookie = res.headers.get('set-cookie') ?? '';
  cookie = loginSetCookie.split(';')[0];
});

afterAll(async () => {
  await admin.cleanup();
  await pool.end();
});

describe('POST /api/admin/auth/login', () => {
  it('sets an httpOnly session cookie', () => {
    expect(cookie).toMatch(/^mq_session=.+/);
    expect(loginSetCookie).toContain('HttpOnly');
    expect(loginSetCookie).toContain('SameSite=Lax');
  });

  it('returns 401 for a wrong password', async () => {
    const res = await login(admin.email, 'wrong-password');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Invalid email or password' });
  });

  it('gives the same error for an unknown e-mail', async () => {
    const res = await login('nobody@example.com', 'whatever');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Invalid email or password' });
  });

  it('returns 400 for an invalid e-mail', async () => {
    const res = await login('abc', 'x');
    expect(res.status).toBe(400);
    expect(await res.json()).toHaveProperty('error');
  });

  it('returns 400 for a body that is not JSON', async () => {
    const res = await post('/api/admin/auth/login', 'oops');
    expect(res.status).toBe(400);
  });
});

describe('protected admin routes', () => {
  it('GET /me returns the admin with a valid cookie', async () => {
    const res = await app.request('/api/admin/auth/me', { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ admin: { id: admin.id, email: admin.email } });
  });

  it('GET /me returns 401 without a cookie', async () => {
    const res = await app.request('/api/admin/auth/me');
    expect(res.status).toBe(401);
    expect(await res.json()).toHaveProperty('error');
  });

  it('GET /me returns 401 with a fake cookie', async () => {
    const res = await app.request('/api/admin/auth/me', {
      headers: { Cookie: 'mq_session=not-a-real-token' },
    });
    expect(res.status).toBe(401);
  });

  it('any other /api/admin route needs a session too', async () => {
    const res = await app.request('/api/admin/campaigns');
    expect(res.status).toBe(401);
  });

  it('logout makes the cookie stop working', async () => {
    const loginRes = await login(admin.email, admin.password);
    const ownCookie = (loginRes.headers.get('set-cookie') ?? '').split(';')[0];

    const logout = await post('/api/admin/auth/logout', {}, { Cookie: ownCookie });
    expect(logout.status).toBe(200);

    const me = await app.request('/api/admin/auth/me', { headers: { Cookie: ownCookie } });
    expect(me.status).toBe(401);
  });
});

describe('public routes', () => {
  it('unknown routes return a JSON 404', async () => {
    const res = await app.request('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
  });
});
