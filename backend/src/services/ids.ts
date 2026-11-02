import { z } from 'zod';

// A value that is not a uuid can never be an id in our tables (and Postgres would throw an error).
export const isUuid = (value: string) => z.uuid().safeParse(value).success;
