// Shapes of the data that the admin API returns.

export type CampaignStatus = 'draft' | 'published';

export type Admin = { id: number; email: string };

export type CampaignListItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  accentColor: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  participants: number;
};

export type CampaignOption = { id: number; text: string; isCorrect: boolean; position: number };

export type CampaignQuestion = {
  id: number;
  text: string;
  position: number;
  options: CampaignOption[];
};

export type CampaignDetail = Omit<CampaignListItem, 'participants'> & {
  questions: CampaignQuestion[];
};

// What we send when we create or update a campaign
export type CampaignInput = {
  title: string;
  description: string;
  accentColor: string;
  status: CampaignStatus;
  questions: Array<{ text: string; options: Array<{ text: string; isCorrect: boolean }> }>;
};

// --- Results of a campaign (admin) ---

export type CampaignStats = {
  participants: number;
  averageScore: number | null; // for example 2.4, or null if no one has answered
  total: number; // number of questions
  leads: number;
  questions: Array<{
    id: number;
    text: string;
    position: number;
    answered: number;
    options: Array<{
      id: number;
      text: string;
      isCorrect: boolean;
      count: number;
      percent: number;
    }>;
  }>;
};

export type Lead = {
  id: number;
  name: string;
  email: string;
  score: number;
  total: number;
  consentAt: string;
  createdAt: string;
};

// --- Public quiz (what a visitor gets) ---

// There is no "isCorrect" here. The visitor only sees the correct answers after submitting.
export type PublicCampaign = {
  slug: string;
  title: string;
  description: string;
  accentColor: string;
  consentText: string; // the text next to the checkbox of the lead form, saved with the lead
  questions: Array<{
    id: number;
    text: string;
    options: Array<{ id: number; text: string }>;
  }>;
};

export type QuizAnswer = { questionId: number; optionId: number };

export type QuizResult = {
  submissionId: string;
  score: number;
  total: number;
  results: Array<{ questionId: number; chosenOptionId: number; correctOptionId: number }>;
};
