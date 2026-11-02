import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { errorHandler } from './error-handler.js';
import { rateLimit } from './rate-limit.js';

function makeApp(max: number) {
  const app = new Hono();
  app.onError(errorHandler);
  app.get('/', rateLimit({ windowMs: 60_000, max }), (c) => c.json({ ok: true }));
  return app;
}

describe('rateLimit', () => {
  it('allows requests up to the limit, then returns 429', async () => {
    const app = makeApp(2);
    expect((await app.request('/')).status).toBe(200);
    expect((await app.request('/')).status).toBe(200);

    const blocked = await app.request('/');
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBeTruthy();
    expect(await blocked.json()).toHaveProperty('error');
  });

  it('keeps separate counters for separate limiters', async () => {
    const a = makeApp(1);
    const b = makeApp(1);
    await a.request('/');
    expect((await a.request('/')).status).toBe(429);
    expect((await b.request('/')).status).toBe(200);
  });
});
