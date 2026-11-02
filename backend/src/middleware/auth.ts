import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { getAdminBySession, type AdminInfo } from '../services/auth.js';
import { HttpError } from './error-handler.js';

export const SESSION_COOKIE = 'mq_session';

export type AuthEnv = { Variables: { admin: AdminInfo; sessionToken: string } };

export const requireAdmin = createMiddleware<AuthEnv>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  const admin = token ? await getAdminBySession(token) : null;

  if (!token || !admin) {
    throw new HttpError(401, 'Not logged in');
  }

  c.set('admin', admin);
  c.set('sessionToken', token);
  await next();
});
