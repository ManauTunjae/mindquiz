'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { validateLead } from '@/lib/lead-schema';
import { submitLead } from '@/lib/public-api';
import { PRIVACY_EMAIL } from '@/lib/site';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { TextField } from '../ui/text-field';

type Props = { submissionId: string; consentText: string };

function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0)
      return 'We could not reach the server. Please check your connection and try again.';
    if (err.status === 404)
      return 'We could not find your quiz result. Please take the quiz again.';
    if (err.status === 429) return 'Too many tries. Please wait a few minutes and try again.';
  }
  return 'Something went wrong. Please try again.';
}

// Optional form after the result. The consent box is NOT ticked from the start.
export function LeadForm({ submissionId, consentText }: Props) {
  const consentId = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<'saved' | 'already' | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');

    const result = validateLead({ name, email, consent });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSending(true);
    try {
      await submitLead(submissionId, result.data);
      setDone('saved');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setDone('already');
      else setFormError(friendlyError(err));
      setSending(false);
    }
  }

  if (done) {
    return (
      <Card role="status" className="text-center">
        <h2 className="font-serif text-2xl font-semibold">Thank you!</h2>
        <p className="mt-2 text-charcoal/80">
          {done === 'saved'
            ? 'We saved your details.'
            : 'Your details were already sent. Thank you!'}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-2xl font-semibold">Stay in touch</h2>
          <p className="text-charcoal/80">
            Want to hear from the organisation? Leave your details. This is optional.
          </p>
          <p className="text-sm text-charcoal/70">
            We only store your name and e-mail. We never store health data. To have your data
            deleted, write to {PRIVACY_EMAIL}. Read more on our{' '}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener"
              className="font-bold underline underline-offset-2"
            >
              privacy page<span className="sr-only"> (opens in a new tab)</span>
            </Link>
            .
          </p>
        </div>

        <TextField
          label="Name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          maxLength={100}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          maxLength={254}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-3">
            <input
              id={consentId}
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? `${consentId}-error` : undefined}
              className="mt-0.5 size-6 shrink-0 accent-charcoal"
            />
            <label htmlFor={consentId} className="cursor-pointer text-sm leading-relaxed">
              {consentText}
            </label>
          </div>
          {errors.consent && (
            <p id={`${consentId}-error`} role="alert" className="text-sm font-medium text-red-800">
              {errors.consent}
            </p>
          )}
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {formError}
          </p>
        )}

        <Button type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Send my details'}
        </Button>
      </form>
    </Card>
  );
}
