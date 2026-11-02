import type { CampaignDetail, CampaignInput } from './types';

const emptyQuestion = () => ({
  text: '',
  options: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
});

// A new campaign starts with 3 empty questions. No answer is marked correct,
// so the admin has to choose on purpose.
export function emptyCampaignForm(): CampaignInput {
  return {
    title: '',
    description: '',
    accentColor: '#FF7A00',
    status: 'draft',
    questions: [emptyQuestion(), emptyQuestion(), emptyQuestion()],
  };
}

// Turn a campaign from the API into form values (without ids and positions).
export function detailToForm(campaign: CampaignDetail): CampaignInput {
  return {
    title: campaign.title,
    description: campaign.description,
    accentColor: campaign.accentColor,
    status: campaign.status,
    questions: campaign.questions.map((q) => ({
      text: q.text,
      options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
    })),
  };
}

export { emptyQuestion };
