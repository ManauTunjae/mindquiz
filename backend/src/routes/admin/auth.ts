import { Hono } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import { HttpError } from '../../middleware/error-handler.js';
import { SESSION_COOKIE, type AuthEnv } from '../../middleware/auth.js';
import { createSession, deleteSession, verifyCredentials } from '../../services/auth.js';
import { loginSchema } from '../../validation/auth.js';
import { parseBody } from '../../validation/parse.js';

const isProduction = process.env.NODE_ENV === 'production';

// Public: login must work without a session. It is mounted before the auth middleware.
export const loginRoutes = new Hono();

loginRoutes.post('/login', async (c) => {
  const { email, password } = await parseBody(c, loginSchema);

  const admin = await verifyCredentials(email, password);
  if (!admin) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const { token, expiresAt } = await createSession(admin.id);
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'Lax',
    path: '/',
    expires: expiresAt,
  });

  return c.json({ admin });
});

// Protected: mounted after the auth middleware.
export const sessionRoutes = new Hono<AuthEnv>();

sessionRoutes.get('/me', (c) => c.json({ admin: c.get('admin') }));

sessionRoutes.post('/logout', async (c) => {
  await deleteSession(c.get('sessionToken'));
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
  return c.json({ ok: true });
});
