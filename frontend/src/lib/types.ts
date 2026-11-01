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
