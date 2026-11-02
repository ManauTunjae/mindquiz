import { Hono } from 'hono';
import { HttpError } from '../../middleware/error-handler.js';
import { deleteLead, listLeads } from '../../services/leads.js';
import { getCampaignStats } from '../../services/stats.js';

const campaignNotFound = () => new HttpError(404, 'Campaign not found');

// What happened in a campaign: statistics and leads.
// Mounted after the auth middleware, so every route here needs an admin session.
export const campaignResultRoutes = new Hono();

campaignResultRoutes.get('/:id/stats', async (c) => {
  const stats = await getCampaignStats(c.req.param('id'));
  if (!stats) throw campaignNotFound();
  return c.json({ stats });
});

campaignResultRoutes.get('/:id/leads', async (c) => {
  const leads = await listLeads(c.req.param('id'));
  if (!leads) throw campaignNotFound();
  return c.json({ leads });
});

campaignResultRoutes.delete('/:id/leads/:leadId', async (c) => {
  // Lead ids are Postgres integers. Anything else cannot exist.
  const rawId = c.req.param('leadId');
  const leadId = /^\d{1,10}$/.test(rawId) ? Number(rawId) : NaN;
  const valid = Number.isSafeInteger(leadId) && leadId > 0 && leadId <= 2_147_483_647;

  if (!valid || !(await deleteLead(c.req.param('id'), leadId))) {
    throw new HttpError(404, 'Lead not found');
  }
  return c.json({ ok: true });
});
