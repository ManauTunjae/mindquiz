import { z } from 'zod';

export const loginSchema = z.object({
  // Clean first (spaces, capital letters), then check. A space at the end must not cause an error.
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1, 'Password is required').max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
