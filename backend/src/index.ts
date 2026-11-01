import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAdmin } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { loginRoutes, sessionRoutes } from './routes/admin/auth.js';
import { campaignRoutes } from './routes/admin/campaigns.js';

export const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);

app.use('/api/*', cors({ origin: 'http://localhost:3000', credentials: true }));

app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Admin routes. Order matters: login is public, everything after `requireAdmin` needs a session.
app.route('/api/admin/auth', loginRoutes);
app.use('/api/admin/*', requireAdmin);
app.route('/api/admin/auth', sessionRoutes);
app.route('/api/admin/campaigns', campaignRoutes);
