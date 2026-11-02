'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CircleHelp, ListChecks, Palette, Plus, Save, Trash2, Type, X } from 'lucide-react';
import { errorMessage, isUnauthorized } from '@/lib/api';
import { validateCampaign } from '@/lib/campaign-schema';
import { emptyQuestion } from '@/lib/campaign-form';
import type { CampaignInput } from '@/lib/types';
import { Button, buttonClasses } from './ui/button';
import { Card } from './ui/card';
import { IconBubble } from './ui/icon-bubble';
import { ContrastHint } from './ContrastHint';
import { TextArea, TextField } from './ui/text-field';

const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 5;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

type Props = {
  initial: CampaignInput;
  submitLabel: string;
  onSubmit: (data: CampaignInput) => Promise<void>;
};

export function CampaignForm({ initial, submitLabel, onSubmit }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<CampaignInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- small helpers that change one part of the form state ---

  const setField = <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const updateQuestion = (qi: number, change: (q: CampaignInput['questions'][number]) => void) =>
    setValues((v) => ({
      ...v,
      questions: v.questions.map((q, i) => {
        if (i !== qi) return q;
        const copy = { ...q, options: q.options.map((o) => ({ ...o })) };
        change(copy);
        return copy;
      }),
    }));

  const addQuestion = () =>
    setValues((v) => ({ ...v, questions: [...v.questions, emptyQuestion()] }));

  const removeQuestion = (qi: number) =>
    setValues((v) => ({ ...v, questions: v.questions.filter((_, i) => i !== qi) }));

  const addOption = (qi: number) =>
    updateQuestion(qi, (q) => q.options.push({ text: '', isCorrect: false }));

  const removeOption = (qi: number, oi: number) =>
    updateQuestion(qi, (q) => {
      q.options.splice(oi, 1);
    });

  const setCorrect = (qi: number, oi: number) =>
    updateQuestion(qi, (q) => q.options.forEach((o, i) => (o.isCorrect = i === oi)));

  // --- submit ---

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');

    const result = validateCampaign(values);
    if (!result.ok) {
      setErrors(result.errors);
      setFormError('Please fix the errors above and try again.');
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      if (isUnauthorized(err)) router.replace('/admin/login');
      else setFormError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <Card className="flex flex-col gap-5">
        <TextField
          label="Title"
          icon={Type}
          value={values.title}
          onChange={(e) => setField('title', e.target.value)}
          error={errors.title}
          maxLength={120}
        />
        <TextArea
          label="Description"
          hint="Shown on the start of the quiz (optional)."
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
          error={errors.description}
          maxLength={500}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="accent-hex" className="flex items-center gap-2 text-sm font-bold">
            <Palette className="size-4" aria-hidden="true" />
            Accent colour
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label="Pick a colour"
              value={values.accentColor.toLowerCase()}
              onChange={(e) => setField('accentColor', e.target.value.toUpperCase())}
              className="size-12 shrink-0 cursor-pointer rounded-2xl border border-charcoal/50 bg-surface p-1"
            />
            <input
              id="accent-hex"
              value={values.accentColor}
              onChange={(e) => setField('accentColor', e.target.value)}
              aria-invalid={errors.accentColor ? true : undefined}
              className="min-h-12 w-full rounded-2xl border border-charcoal/50 bg-surface px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
            />
          </div>
          <ContrastHint colour={values.accentColor} />
          {errors.accentColor && (
            <p role="alert" className="text-sm font-medium text-red-800">
              {errors.accentColor}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-bold">
            Status
          </label>
          <select
            id="status"
            value={values.status}
            onChange={(e) => setField('status', e.target.value as CampaignInput['status'])}
            className="min-h-12 w-full rounded-2xl border border-charcoal/50 bg-surface px-4 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
          >
            <option value="draft">Draft (not visible to visitors)</option>
            <option value="published">Published (visible with the public link)</option>
          </select>
        </div>
      </Card>

      <section className="flex flex-col gap-4" aria-labelledby="questions-heading">
        <div>
          <h2
            id="questions-heading"
            className="flex items-center gap-3 font-heading text-2xl font-semibold"
          >
            <IconBubble icon={ListChecks} size="sm" />
            Questions
          </h2>
          <p className="text-sm text-charcoal/70">
            {MIN_QUESTIONS} to {MAX_QUESTIONS} questions. Use general knowledge questions only. Do
            not ask visitors about their own health.
          </p>
          {errors.questions && (
            <p role="alert" className="mt-1 text-sm font-medium text-red-800">
              {errors.questions}
            </p>
          )}
        </div>

        {values.questions.map((question, qi) => (
          <Card key={qi}>
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-3 flex items-center gap-2 font-bold">
                <CircleHelp className="size-5" aria-hidden="true" />
                Question {qi + 1}
              </legend>

              <TextField
                label="Question text"
                value={question.text}
                onChange={(e) => updateQuestion(qi, (q) => (q.text = e.target.value))}
                error={errors[`questions.${qi}.text`]}
                maxLength={300}
              />

              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold">Answers (select the correct one)</p>
                {question.options.map((option, oi) => (
                  <div key={oi} className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={option.isCorrect}
                        onChange={() => setCorrect(qi, oi)}
                        aria-label={`Answer ${oi + 1} is correct`}
                        className="size-6 shrink-0 accent-primary"
                      />
                      <input
                        value={option.text}
                        onChange={(e) =>
                          updateQuestion(qi, (q) => (q.options[oi].text = e.target.value))
                        }
                        aria-label={`Answer ${oi + 1} for question ${qi + 1}`}
                        aria-invalid={
                          errors[`questions.${qi}.options.${oi}.text`] ? true : undefined
                        }
                        maxLength={200}
                        className="min-h-12 w-full min-w-0 rounded-2xl border border-charcoal/50 bg-surface px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        aria-label={`Remove answer ${oi + 1} of question ${qi + 1}`}
                        disabled={question.options.length <= MIN_OPTIONS}
                        onClick={() => removeOption(qi, oi)}
                      >
                        <X className="size-5" aria-hidden="true" />
                      </Button>
                    </div>
                    {errors[`questions.${qi}.options.${oi}.text`] && (
                      <p role="alert" className="pl-9 text-sm font-medium text-red-800">
                        {errors[`questions.${qi}.options.${oi}.text`]}
                      </p>
                    )}
                  </div>
                ))}

                {errors[`questions.${qi}.options`] && (
                  <p role="alert" className="text-sm font-medium text-red-800">
                    {errors[`questions.${qi}.options`]}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => addOption(qi)}
                    disabled={question.options.length >= MAX_OPTIONS}
                  >
                    <Plus className="size-5" aria-hidden="true" />
                    Add answer
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => removeQuestion(qi)}
                    disabled={values.questions.length <= MIN_QUESTIONS}
                  >
                    <Trash2 className="size-5" aria-hidden="true" />
                    Remove question
                  </Button>
                </div>
              </div>
            </fieldset>
          </Card>
        ))}

        <div>
          <Button
            variant="secondary"
            onClick={addQuestion}
            disabled={values.questions.length >= MAX_QUESTIONS}
          >
            <Plus className="size-5" aria-hidden="true" />
            Add question
          </Button>
        </div>
      </section>

      {formError && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          <Save className="size-5" aria-hidden="true" />
          {submitting ? 'Saving…' : submitLabel}
        </Button>
        <Link href="/admin/campaigns" className={buttonClasses('secondary')}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
