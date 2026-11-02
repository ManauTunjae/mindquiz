import { z } from 'zod';

const optionSchema = z.object({
  text: z.string().trim().min(1, 'Answer text is required').max(200),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  text: z.string().trim().min(1, 'Question text is required').max(300),
  options: z
    .array(optionSchema)
    .min(2, 'Each question needs 2 to 4 answers')
    .max(4, 'Each question needs 2 to 4 answers')
    .refine((options) => options.filter((o) => o.isCorrect).length === 1, {
      message: 'Each question needs exactly one correct answer',
    }),
});

const title = z.string().trim().min(1, 'Title is required').max(120);
const description = z.string().trim().max(500);
const accentColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Colour must look like #FF7A00')
  .transform((value) => value.toUpperCase());
const status = z.enum(['draft', 'published']);
const questions = z
  .array(questionSchema)
  .min(3, 'A campaign needs 3 to 5 questions')
  .max(5, 'A campaign needs 3 to 5 questions');

export const createCampaignSchema = z.object({
  title,
  description: description.default(''),
  accentColor: accentColor.default('#FF7A00'),
  status: status.default('draft'),
  questions,
});

// All fields are optional here, and none has a default,
// so a field that is not sent is never changed.
export const updateCampaignSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
    accentColor: accentColor.optional(),
    status: status.optional(),
    questions: questions.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'Send at least one field' });

export type CreateCampaignInput = z.output<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.output<typeof updateCampaignSchema>;
