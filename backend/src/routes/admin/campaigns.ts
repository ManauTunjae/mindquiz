import { Hono } from 'hono';
import { HttpError } from '../../middleware/error-handler.js';
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
} from '../../services/campaigns.js';
import { createCampaignSchema, updateCampaignSchema } from '../../validation/campaign.js';
import { parseBody } from '../../validation/parse.js';

const notFound = () => new HttpError(404, 'Campaign not found');

// Mounted after the auth middleware, so every route here needs an admin session.
export const campaignRoutes = new Hono();

campaignRoutes.get('/', async (c) => c.json({ campaigns: await listCampaigns() }));

campaignRoutes.post('/', async (c) => {
  const input = await parseBody(c, createCampaignSchema);
  return c.json({ campaign: await createCampaign(input) }, 201);
});

campaignRoutes.get('/:id', async (c) => {
  const campaign = await getCampaign(c.req.param('id'));
  if (!campaign) throw notFound();
  return c.json({ campaign });
});

campaignRoutes.put('/:id', async (c) => {
  const input = await parseBody(c, updateCampaignSchema);
  const result = await updateCampaign(c.req.param('id'), input);

  if (result.status === 'not_found') throw notFound();
  if (result.status === 'has_participants') {
    throw new HttpError(
      409,
      'This campaign already has participants, so its questions cannot be changed',
    );
  }
  return c.json({ campaign: result.campaign });
});

campaignRoutes.delete('/:id', async (c) => {
  if (!(await deleteCampaign(c.req.param('id')))) throw notFound();
  return c.json({ ok: true });
});
