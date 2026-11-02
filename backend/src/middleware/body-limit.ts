import { bodyLimit } from 'hono/body-limit';
import { HttpError } from './error-handler.js';

// Refuse big request bodies before we read them. Public routes only get small JSON.
export const limitBody = (maxBytes: number) =>
  bodyLimit({
    maxSize: maxBytes,
    onError: () => {
      throw new HttpError(413, 'Request body is too large');
    },
  });
