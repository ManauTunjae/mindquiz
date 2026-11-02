import { ApiError, request } from './api';
import type { PublicCampaign, QuizAnswer, QuizResult } from './types';

const publicOptions = { credentials: 'omit' } as const; // no cookies for visitors

// Returns null when the campaign does not exist or is not published (404).
export async function getPublicCampaign(slug: string): Promise<PublicCampaign | null> {
  try {
    const { campaign } = await request<{ campaign: PublicCampaign }>(
      'GET',
      `/public/campaigns/${encodeURIComponent(slug)}`,
      undefined,
      publicOptions,
    );
    return campaign;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export const submitQuiz = (slug: string, answers: QuizAnswer[]) =>
  request<QuizResult>(
    'POST',
    `/public/campaigns/${encodeURIComponent(slug)}/submissions`,
    { answers },
    publicOptions,
  );

// Send the contact details. The visitor must have ticked the consent box before this is called,
// so consent is always true here. The backend checks it again.
export const submitLead = (submissionId: string, lead: { name: string; email: string }) =>
  request<{ ok: true }>(
    'POST',
    `/public/submissions/${encodeURIComponent(submissionId)}/lead`,
    { ...lead, consent: true },
    publicOptions,
  );
