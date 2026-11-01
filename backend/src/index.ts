import { Hono } from 'hono';
import { cors } from 'hono/cors';

export const app = new Hono();

app.use('/api/*', cors({ origin: 'http://localhost:3000', credentials: true }));

app.get('/api/health', (c) => c.json({ status: 'ok' }));
