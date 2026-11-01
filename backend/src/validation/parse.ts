import type { Context } from 'hono';
import type { z } from 'zod';
import { HttpError } from '../middleware/error-handler.js';

// Read the JSON body and check it with a Zod schema. Throws a 400 error if it is not valid.
export async function parseBody<T extends z.ZodType>(c: Context, schema: T): Promise<z.output<T>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new HttpError(400, 'Body must be valid JSON');
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path.join('.');
    throw new HttpError(400, field ? `${field}: ${issue.message}` : issue.message);
  }
  return result.data;
}
