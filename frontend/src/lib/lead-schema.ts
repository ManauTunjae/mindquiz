import { z } from 'zod';

// The same rules as backend/src/validation/lead.ts, so the form can show errors before it sends.
// The backend always checks again, so it is the one that decides.
export const leadFormSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name').max(100, 'Max 100 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Please enter a valid e-mail address').max(254, 'Max 254 characters')),
  consent: z.literal(true, { error: 'Please tick the box if you agree' }),
});

// Errors by field name, for example { email: "Please enter ..." }
export function validateLead(
  values: unknown,
):
  | { ok: true; data: { name: string; email: string } }
  | { ok: false; errors: Record<string, string> } {
  const result = leadFormSchema.safeParse(values);
  if (result.success) {
    return { ok: true, data: { name: result.data.name, email: result.data.email } };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!(key in errors)) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
