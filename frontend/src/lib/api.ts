import type {
  Admin,
  CampaignDetail,
  CampaignInput,
  CampaignListItem,
  CampaignStats,
  Lead,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const isUnauthorized = (err: unknown) => err instanceof ApiError && err.status === 401;

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}

type RequestOptions = {
  // Admin calls send the session cookie. Public calls must not.
  credentials?: RequestCredentials;
};

export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  { credentials = 'include' }: RequestOptions = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      credentials,
      cache: 'no-store',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
  }

  if (!res.ok) {
    let message = 'Something went wrong';
    try {
      const data = await res.json();
      if (typeof data.error === 'string') message = data.error;
    } catch {
      // The body was not JSON. Keep the default message.
    }
    throw new ApiError(res.status, message);
  }

  return res.json();
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ admin: Admin }>('POST', '/admin/auth/login', { email, password }),
  logout: () => request<{ ok: true }>('POST', '/admin/auth/logout', {}),
  me: () => request<{ admin: Admin }>('GET', '/admin/auth/me'),

  listCampaigns: () => request<{ campaigns: CampaignListItem[] }>('GET', '/admin/campaigns'),
  getCampaign: (id: string) =>
    request<{ campaign: CampaignDetail }>('GET', `/admin/campaigns/${id}`),
  createCampaign: (input: CampaignInput) =>
    request<{ campaign: CampaignDetail }>('POST', '/admin/campaigns', input),
  updateCampaign: (id: string, input: Partial<CampaignInput>) =>
    request<{ campaign: CampaignDetail }>('PUT', `/admin/campaigns/${id}`, input),
  deleteCampaign: (id: string) => request<{ ok: true }>('DELETE', `/admin/campaigns/${id}`),

  getStats: (id: string) =>
    request<{ stats: CampaignStats }>('GET', `/admin/campaigns/${id}/stats`),
  listLeads: (id: string) => request<{ leads: Lead[] }>('GET', `/admin/campaigns/${id}/leads`),
  deleteLead: (campaignId: string, leadId: number) =>
    request<{ ok: true }>('DELETE', `/admin/campaigns/${campaignId}/leads/${leadId}`),
};
