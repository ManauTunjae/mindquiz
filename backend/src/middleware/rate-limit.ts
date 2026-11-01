import { getConnInfo } from '@hono/node-server/conninfo';
import { createMiddleware } from 'hono/factory';
import { HttpError } from './error-handler.js';

type Options = {
  windowMs: number; // length of the time window
  max: number; // allowed requests per client in one window
};

// Simple in-memory limiter, one counter per client address. Fine for one server process.
// We use the socket address, not X-Forwarded-For, because that header can be faked.
// If the app runs behind a proxy later, this must be revisited.
export function rateLimit({ windowMs, max }: Options) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return createMiddleware(async (c, next) => {
    const now = Date.now();

    // Remove old counters now and then, so the map does not grow forever
    if (hits.size > 1000) {
      for (const [key, entry] of hits) {
        if (entry.resetAt <= now) hits.delete(key);
      }
    }

    let address = 'unknown';
    try {
      address = getConnInfo(c).remote.address ?? 'unknown';
    } catch {
      // No socket (for example in tests with app.request): use one shared counter
    }

    let entry = hits.get(address);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(address, entry);
    }
    entry.count += 1;

    if (entry.count > max) {
      c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      throw new HttpError(429, 'Too many requests, try again later');
    }

    await next();
  });
}
