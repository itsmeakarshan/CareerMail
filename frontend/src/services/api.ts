import {
  User,
  JobApplication,
  Interview,
  FollowUp,
  Email,
  AnalyticsData,
  AssistantResponse
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('careermail_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    // If not on login or register, could redirect or trigger logout
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      localStorage.removeItem('careermail_token');
      localStorage.removeItem('careermail_user');
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.message || (errData.errors ? Object.values(errData.errors).join(', ') : 'Request failed');
    } catch {
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }

  // Check if response has content before parsing json
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) =>
    request<{ token: string; id: number; name: string; email: string; avatarUrl?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: { name: string; email: string; password: string }) =>
    request<{ token: string; id: number; name: string; email: string; avatarUrl?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCurrentUser: () => request<User>('/auth/me'),
};

// Job Applications API
export const applicationsApi = {
  getAll: () => request<JobApplication[]>('/applications'),
  getById: (id: number) => request<JobApplication>(`/applications/${id}`),
  create: (data: Partial<JobApplication>) =>
    request<JobApplication>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<JobApplication>) =>
    request<JobApplication>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: number, status: string) =>
    request<JobApplication>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/applications/${id}`, {
      method: 'DELETE',
    }),
  search: (query: string) => request<JobApplication[]>(`/applications/search?q=${encodeURIComponent(query)}`),
};

// Emails API
export const emailsApi = {
  getFolder: (folder: string) => request<Email[]>(`/emails?folder=${folder}`),
  getById: (id: number) => request<Email>(`/emails/${id}`),
  markRead: (id: number, read: boolean) =>
    request<Email>(`/emails/${id}/read?read=${read}`, {
      method: 'PATCH',
    }),
  toggleStar: (id: number) =>
    request<Email>(`/emails/${id}/star`, {
      method: 'PATCH',
    }),
  toggleImportant: (id: number) =>
    request<Email>(`/emails/${id}/important`, {
      method: 'PATCH',
    }),
  moveToFolder: (id: number, folder: string) =>
    request<Email>(`/emails/${id}/move?folder=${folder}`, {
      method: 'PATCH',
    }),
  compose: (data: { to: string; subject: string; body: string }) =>
    request<Email>('/emails/compose', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  simulate: (data: { sender: string; senderEmail: string; subject: string; body: string; important?: boolean }) =>
    request<Email>('/emails/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/emails/${id}`, {
      method: 'DELETE',
    }),
  getCounts: () => request<Record<string, number>>('/emails/counts'),
  search: (query: string) => request<Email[]>(`/emails/search?q=${encodeURIComponent(query)}`),
};

// Interviews API
export const interviewsApi = {
  getAll: () => request<Interview[]>('/interviews'),
  getById: (id: number) => request<Interview>(`/interviews/${id}`),
  create: (data: Partial<Interview>) =>
    request<Interview>('/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Interview>) =>
    request<Interview>(`/interviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/interviews/${id}`, {
      method: 'DELETE',
    }),
};

// Follow-ups API
export const followUpsApi = {
  getAll: () => request<FollowUp[]>('/followups'),
  getById: (id: number) => request<FollowUp>(`/followups/${id}`),
  create: (data: Partial<FollowUp>) =>
    request<FollowUp>('/followups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<FollowUp>) =>
    request<FollowUp>(`/followups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/followups/${id}`, {
      method: 'DELETE',
    }),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => request<AnalyticsData>('/analytics'),
};

// Career Assistant API
export const assistantApi = {
  ask: (query: string, currentScreen?: string) =>
    request<AssistantResponse>('/assistant/ask', {
      method: 'POST',
      body: JSON.stringify({ query, currentScreen }),
    }),
};
