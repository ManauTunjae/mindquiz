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

// Turn a response that was not ok into an ApiError with the message from the server.
async function failureFrom(res: Response): Promise<ApiError> {
  let message = 'Something went wrong';
  try {
    const data = await res.json();
    if (typeof data.error === 'string') message = data.error;
  } catch {
    // The body was not JSON. Keep the default message.
  }
  return new ApiError(res.status, message);
}

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

  if (!res.ok) throw await failureFrom(res);

  return res.json();
}

// --- downloads (CSV and PDF) -----------------------------------------------------------------

export type ExportKind = 'leads' | 'participants' | 'report';
export type CsvSeparator = 'semicolon' | 'comma';

const exportFiles: Record<ExportKind, string> = {
  leads: 'leads.csv',
  participants: 'participants.csv',
  report: 'report.pdf',
};

// attachment; filename="mindquiz-wellbeing-basics-leads-2026-11-02.csv"  ->  the file name
function filenameFrom(header: string | null): string | null {
  const match = header ? /filename="([^"]+)"/.exec(header) : null;
  return match ? match[1] : null;
}

// Ask the server for a file and save it on the computer of the admin.
// We use fetch (and not a plain link), so a problem is shown as a message and not as a JSON page.
export async function downloadExport(
  campaignId: string,
  kind: ExportKind,
  separator: CsvSeparator = 'semicolon',
): Promise<string> {
  const query = kind === 'report' ? '' : `?delimiter=${separator}`;
  let res: Response;
  try {
    res = await fetch(
      `${API_URL}/api/admin/campaigns/${campaignId}/export/${exportFiles[kind]}${query}`,
      { credentials: 'include', cache: 'no-store' },
    );
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
  }
  if (!res.ok) throw await failureFrom(res);

  const filename = filenameFrom(res.headers.get('content-disposition')) ?? `mindquiz-${kind}`;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
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
