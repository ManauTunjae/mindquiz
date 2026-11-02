import { describe, expect, it } from 'vitest';
import { app } from '../../index.js';

// In its own file, so the counter of the limiter is not shared with the other route tests.
describe('submit rate limit', () => {
  it('allows 30 requests, then returns 429 with Retry-After', async () => {
    const send = () =>
      app.request('/api/public/campaigns/any-slug/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}', // invalid on purpose: it is rejected, but it still counts
      });

    for (let i = 0; i < 30; i++) {
      expect((await send()).status).toBe(400);
    }

    const blocked = await send();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBeTruthy();
    expect(await blocked.json()).toHaveProperty('error');
  });
});
