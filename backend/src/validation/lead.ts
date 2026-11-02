import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z
    .email('Enter a valid e-mail address')
    .trim()
    .toLowerCase()
    .max(254, 'E-mail is too long'),
  // Must be exactly true. The visitor has to tick the box on purpose.
  consent: z.literal(true, { error: 'You need to agree to continue' }),
});

export type LeadInput = z.output<typeof leadSchema>;
