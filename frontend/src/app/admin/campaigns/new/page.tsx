'use client';

import { Sparkles } from 'lucide-react';
import { IconBubble } from '@/components/ui/icon-bubble';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CampaignForm } from '@/components/CampaignForm';
import { adminApi } from '@/lib/api';
import { emptyCampaignForm } from '@/lib/campaign-form';

export default function NewCampaignPage() {
  const router = useRouter();
  const [initial] = useState(emptyCampaignForm);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="flex items-center gap-3 font-heading text-3xl font-semibold">
        <IconBubble icon={Sparkles} />
        New campaign
      </h1>
      <CampaignForm
        initial={initial}
        submitLabel="Create campaign"
        onSubmit={async (data) => {
          await adminApi.createCampaign(data);
          router.push('/admin/campaigns');
        }}
      />
    </div>
  );
}
