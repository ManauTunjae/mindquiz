import { z } from 'zod';

// Ids in the database are Postgres integers. A bigger number would cause a database error.
const id = z.number().int().positive().max(2_147_483_647);

export const submitAnswersSchema = z.object({
  answers: z
    .array(z.object({ questionId: id, optionId: id }))
    .min(1, 'Answer all the questions')
    .max(20, 'Too many answers'),
});

export type SubmitAnswersInput = z.output<typeof submitAnswersSchema>;
