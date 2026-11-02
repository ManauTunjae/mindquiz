import { Hono } from 'hono';
import { limitBody } from '../../middleware/body-limit.js';
import { HttpError } from '../../middleware/error-handler.js';
import { rateLimit } from '../../middleware/rate-limit.js';
import { getPublicCampaign, submitAnswers } from '../../services/public-campaigns.js';
import { submitAnswersSchema } from '../../validation/submission.js';
import { parseBody } from '../../validation/parse.js';

// No login needed for these routes.
export const publicCampaignRoutes = new Hono();

// 30 submissions per 15 minutes per client. Schools and offices share one address, so not too low.
const submitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

// A quiz answer is tiny.
const smallBody = limitBody(10 * 1024);

publicCampaignRoutes.get('/campaigns/:slug', async (c) => {
  const campaign = await getPublicCampaign(c.req.param('slug'));
  if (!campaign) throw new HttpError(404, 'Campaign not found');

  c.header('Cache-Control', 'no-store'); // the admin can change or unpublish it at any time
  return c.json({ campaign });
});

publicCampaignRoutes.post('/campaigns/:slug/submissions', submitLimiter, smallBody, async (c) => {
  const input = await parseBody(c, submitAnswersSchema);
  const result = await submitAnswers(c.req.param('slug'), input);

  if (result.status === 'not_found') throw new HttpError(404, 'Campaign not found');
  if (result.status === 'invalid') throw new HttpError(400, result.message);

  const { submissionId, score, total, results } = result;
  return c.json({ submissionId, score, total, results }, 201);
});
