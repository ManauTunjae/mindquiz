import type { Context, ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

// Throw this from services or routes to return `{ "error": message }` with a status code.
export class HttpError extends Error {
  constructor(
    public status: ContentfulStatusCode,
    message: string,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorHandler = (err, c: Context) => {
  if (err instanceof HttpError) {
    return c.json({ error: err.message }, err.status);
  }
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status as ContentfulStatusCode);
  }

  console.error(err);
  return c.json({ error: 'Something went wrong' }, 500);
};

export const notFoundHandler: NotFoundHandler = (c) => c.json({ error: 'Not found' }, 404);
