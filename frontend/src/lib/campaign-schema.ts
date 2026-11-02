import { z } from 'zod';
import type { CampaignInput } from './types';

// A copy of the rules in backend/src/validation/campaign.ts, so the form can show errors
// before anything is sent. The backend always checks again, so it is the one that decides.
// If you change a rule there, change it here too.

const optionSchema = z.object({
  text: z.string().trim().min(1, 'Answer text is required').max(200, 'Max 200 characters'),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  text: z.string().trim().min(1, 'Question text is required').max(300, 'Max 300 characters'),
  options: z
    .array(optionSchema)
    .min(2, 'Each question needs 2 to 4 answers')
    .max(4, 'Each question needs 2 to 4 answers')
    .refine((options) => options.filter((o) => o.isCorrect).length === 1, {
      message: 'Pick exactly one correct answer',
    }),
});

export const campaignFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Max 120 characters'),
  description: z.string().trim().max(500, 'Max 500 characters'),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Colour must look like #FF7A00')
    .transform((value) => value.toUpperCase()),
  status: z.enum(['draft', 'published']),
  questions: z
    .array(questionSchema)
    .min(3, 'A campaign needs 3 to 5 questions')
    .max(5, 'A campaign needs 3 to 5 questions'),
});

export type ValidationResult =
  { ok: true; data: CampaignInput } | { ok: false; errors: Record<string, string> };

// Errors are keyed by path, for example "title", "questions.1.text" or "questions.0.options".
export function validateCampaign(values: unknown): ValidationResult {
  const result = campaignFormSchema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (!(key in errors)) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
