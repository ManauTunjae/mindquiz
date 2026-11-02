import { describe, expect, it } from 'vitest';
import { submitAnswersSchema } from './submission.js';

const answer = { questionId: 1, optionId: 2 };

describe('submitAnswersSchema', () => {
  it('accepts a list of answers', () => {
    expect(submitAnswersSchema.safeParse({ answers: [answer] }).success).toBe(true);
  });

  it.each([
    ['no answers', { answers: [] }],
    ['no answers field', {}],
    ['a score sent by the client is not accepted as answers', { score: 3 }],
    ['id 0', { answers: [{ questionId: 0, optionId: 2 }] }],
    ['negative id', { answers: [{ questionId: 1, optionId: -5 }] }],
    ['decimal id', { answers: [{ questionId: 1.5, optionId: 2 }] }],
    ['id as text', { answers: [{ questionId: '1', optionId: 2 }] }],
    [
      'id bigger than a Postgres integer',
      { answers: [{ questionId: 1, optionId: 2_147_483_648 }] },
    ],
    ['too many answers', { answers: Array(21).fill(answer) }],
  ])('rejects %s', (_name, body) => {
    expect(submitAnswersSchema.safeParse(body).success).toBe(false);
  });
});
