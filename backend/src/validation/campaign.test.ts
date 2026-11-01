import { describe, expect, it } from 'vitest';
import { makeCampaignInput } from '../test-utils.js';
import { createCampaignSchema, updateCampaignSchema } from './campaign.js';

const question = (options: Array<{ text: string; isCorrect: boolean }>) => ({
  text: 'A question?',
  options,
});
const right = { text: 'Right', isCorrect: true };
const wrong = { text: 'Wrong', isCorrect: false };
const valid = question([right, wrong]);

const failsWith = (input: unknown, message: string) => {
  const result = createCampaignSchema.safeParse(input);
  expect(result.success).toBe(false);
  expect(result.error?.issues.map((i) => i.message)).toContain(message);
};

describe('createCampaignSchema', () => {
  it('accepts a valid campaign and adds defaults', () => {
    const { description, accentColor, status, ...rest } = makeCampaignInput();
    void description;
    void accentColor;
    void status;
    const result = createCampaignSchema.parse(rest);
    expect(result.status).toBe('draft');
    expect(result.accentColor).toBe('#FF7A00');
    expect(result.description).toBe('');
  });

  it.each([2, 6])('rejects %i questions', (n) => {
    failsWith(
      makeCampaignInput({ questions: Array(n).fill(valid) }),
      'A campaign needs 3 to 5 questions',
    );
  });

  it.each([3, 4, 5])('accepts %i questions', (n) => {
    expect(
      createCampaignSchema.safeParse(makeCampaignInput({ questions: Array(n).fill(valid) }))
        .success,
    ).toBe(true);
  });

  it('rejects a question with 1 answer', () => {
    failsWith(
      makeCampaignInput({ questions: [question([right]), valid, valid] }),
      'Each question needs 2 to 4 answers',
    );
  });

  it('rejects a question with 5 answers', () => {
    failsWith(
      makeCampaignInput({
        questions: [question([right, wrong, wrong, wrong, wrong]), valid, valid],
      }),
      'Each question needs 2 to 4 answers',
    );
  });

  it('rejects a question without a correct answer', () => {
    failsWith(
      makeCampaignInput({ questions: [question([wrong, wrong]), valid, valid] }),
      'Each question needs exactly one correct answer',
    );
  });

  it('rejects a question with two correct answers', () => {
    failsWith(
      makeCampaignInput({ questions: [question([right, right]), valid, valid] }),
      'Each question needs exactly one correct answer',
    );
  });

  it('rejects a bad colour and an empty title', () => {
    failsWith(makeCampaignInput({ accentColor: 'orange' }), 'Colour must look like #FF7A00');
    failsWith(makeCampaignInput({ title: '   ' }), 'Title is required');
  });

  it('makes the colour upper case', () => {
    expect(
      createCampaignSchema.parse(makeCampaignInput({ accentColor: '#ff7a00' })).accentColor,
    ).toBe('#FF7A00');
  });
});

describe('updateCampaignSchema', () => {
  it('accepts one field and does not add defaults for the others', () => {
    expect(updateCampaignSchema.parse({ title: 'New title' })).toEqual({ title: 'New title' });
  });

  it('rejects an empty body', () => {
    expect(updateCampaignSchema.safeParse({}).success).toBe(false);
  });

  it('checks the question rules when questions are sent', () => {
    expect(updateCampaignSchema.safeParse({ questions: [valid] }).success).toBe(false);
  });
});
