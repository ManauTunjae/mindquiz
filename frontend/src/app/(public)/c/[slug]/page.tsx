import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Quiz } from '@/components/quiz/Quiz';
import { accentStyle } from '@/lib/accent';
import { getPublicCampaign } from '@/lib/public-api';

type Props = { params: Promise<{ slug: string }> };

// The title and the page both need the campaign. Fetch it only once per request.
const loadCampaign = cache(getPublicCampaign);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) return { title: 'Quiz not found · MindQuiz' };

  return {
    title: `${campaign.title} · MindQuiz`,
    description: campaign.description || undefined,
  };
}

export default async function QuizPage({ params }: Props) {
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) notFound();

  return (
    <div style={accentStyle(campaign.accentColor)} className="min-h-screen">
      <Quiz campaign={campaign} />
    </div>
  );
}
