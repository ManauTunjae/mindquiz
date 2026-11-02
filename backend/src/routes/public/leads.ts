import { Hono } from 'hono';
import { limitBody } from '../../middleware/body-limit.js';
import { HttpError } from '../../middleware/error-handler.js';
import { rateLimit } from '../../middleware/rate-limit.js';
import { createLead } from '../../services/leads.js';
import { leadSchema } from '../../validation/lead.js';
import { parseBody } from '../../validation/parse.js';

// No login needed. The submission id (a random uuid) is known only by the visitor who did the quiz.
export const leadRoutes = new Hono();

// 10 tries per 15 minutes per client
const leadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

leadRoutes.post('/submissions/:id/lead', leadLimiter, limitBody(4 * 1024), async (c) => {
  const input = await parseBody(c, leadSchema);
  const result = await createLead(c.req.param('id'), input);

  if (result.status === 'not_found') throw new HttpError(404, 'Submission not found');
  if (result.status === 'already_exists') {
    throw new HttpError(409, 'Your details were already sent for this quiz');
  }

  // No personal data in the answer
  return c.json({ ok: true }, 201);
});
