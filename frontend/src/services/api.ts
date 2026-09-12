import { Job, JobStatus, OfferStatus, UserItem, CreateUserInput, UpdateUserInput } from '../types';

const TOKEN_KEY = 'access_token';
const USERNAME_KEY = 'jobtracker_username';
const USER_ID_KEY = 'jobtracker_user_id';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const clearStoredToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(USER_ID_KEY);
  } catch {
    // ignore
  }
};

export const getStoredUsername = (): string | null => {
  try {
    return localStorage.getItem(USERNAME_KEY);
  } catch {
    return null;
  }
};

export const setStoredUsername = (username: string): void => {
  try {
    localStorage.setItem(USERNAME_KEY, username);
  } catch {
    // ignore
  }
};

export const getStoredUserId = (): string | null => {
  try {
    return localStorage.getItem(USER_ID_KEY);
  } catch {
    return null;
  }
};

export const setStoredUserId = (id: string | number): void => {
  try {
    localStorage.setItem(USER_ID_KEY, String(id));
  } catch {
    // ignore
  }
};

export const getApiBaseUrl = (): string => {
  const envUrl = ((import.meta as any).env?.VITE_API_URL as string) || '';
  return envUrl.trim().replace(/\/+$/, '');
};

const getHeaders = (contentType: string | null = 'application/json'): HeadersInit => {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper to safely parse detail from FastAPI HTTP errors
export const parseErrorDetail = (errorData: any, defaultMsg: string): string => {
  if (!errorData) return defaultMsg;
  if (typeof errorData.detail === 'string') return errorData.detail;
  if (Array.isArray(errorData.detail)) {
    return errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
  }
  if (typeof errorData.message === 'string') return errorData.message;
  if (typeof errorData.error === 'string') return errorData.error;
  return defaultMsg;
};

// Normalizer to align any FastAPI record schema to our frontend Job model
export const normalizeJob = (raw: any): Job => {
  const id = raw.id ?? raw._id ?? Math.random().toString(36).substring(2, 9);
  const job_title = raw.job_title ?? raw.title ?? raw.position ?? 'Untitled Position';
  const company = raw.company ?? raw.company_name ?? 'Unknown Company';
  const location = raw.location ?? raw.city ?? 'Remote / Unspecified';
  
  let applied_date = raw.applied_date ?? raw.created_at ?? new Date().toISOString().split('T')[0];
  if (typeof applied_date === 'string' && applied_date.includes('T')) {
    applied_date = applied_date.split('T')[0];
  }

  const salary = raw.salary !== undefined && raw.salary !== null && raw.salary !== ''
    ? Number(raw.salary)
    : null;

  const validStatuses: JobStatus[] = [
    'Applied',
    'Interviewing',
    'Offered',
    'Accepted',
    'Rejected',
    'Withdrawn',
  ];
  let status: JobStatus = 'Applied';
  if (raw.status) {
    const match = validStatuses.find(
      (s) => s.toLowerCase() === String(raw.status).trim().toLowerCase()
    );
    if (match) status = match;
  }

  const current_round = raw.current_round !== undefined && raw.current_round !== null && raw.current_round !== ''
    ? Number(raw.current_round)
    : 1;

  let interview_date = raw.interview_date ?? raw.interview_at ?? null;
  if (interview_date && typeof interview_date === 'string') {
    interview_date = interview_date.replace('Z', '').slice(0, 16);
  }

  const validOfferStatuses: OfferStatus[] = ['None', 'Offered', 'Accepted', 'Rejected'];
  let offer_status: OfferStatus = 'None';
  if (raw.offer_status) {
    const match = validOfferStatuses.find(
      (s) => s.toLowerCase() === String(raw.offer_status).trim().toLowerCase()
    );
    if (match) offer_status = match;
  }

  const remarks = raw.remarks ?? raw.notes ?? raw.comment ?? '';

  return {
    id,
    job_title,
    company,
    location,
    applied_date,
    salary: isNaN(salary as number) ? null : salary,
    status,
    current_round: isNaN(current_round) ? 1 : current_round,
    interview_date,
    offer_status,
    remarks,
  };
};

export const api = {
  // Login method directly querying FastAPI backend
  login: async (usernameOrEmail: string, password: string): Promise<{ access_token: string; username?: string; user?: any }> => {
    const trimmedUser = usernameOrEmail.trim();
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/login`;

    // Backend expects email for login, not username payloads.
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedUser,
          password: password,
        }),
      });
    } catch (err: any) {
      throw new Error(`Cannot reach FastAPI backend at ${baseUrl || '127.0.0.1:8000'}.`);
    }

    if (response.ok) {
      const data = await response.json();
      const token = data.access_token || data.token || data.jwt;
      if (token) {
        setStoredToken(token);
        const resolvedUsername = 
          data.username || data.user?.username || (trimmedUser.includes('@') ? trimmedUser.split('@')[0] : trimmedUser);
        setStoredUsername(resolvedUsername);
        if (data.id || data.user_id || data.user?.id) {
          setStoredUserId(data.id || data.user_id || data.user?.id);
        }
        return { access_token: token, username: resolvedUsername, user: data.user || data };
      }
    }

    if (response.status === 422 || response.status === 415) {
      // FastAPI OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
      const formBody = new URLSearchParams({
        username: trimmedUser,
        password: password,
      }).toString();

      const formResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody,
      });

      if (formResponse.ok) {
        const formData = await formResponse.json();
        const token = formData.access_token || formData.token;
        if (token) {
          setStoredToken(token);
          const resolvedUsername =
            formData.username || formData.user?.username || (trimmedUser.includes('@') ? trimmedUser.split('@')[0] : trimmedUser);
          setStoredUsername(resolvedUsername);
          if (formData.id || formData.user_id || formData.user?.id) {
            setStoredUserId(formData.id || formData.user_id || formData.user?.id);
          }
          return { access_token: token, username: resolvedUsername, user: formData.user || formData };
        }
      } else {
        const errData = await formResponse.json().catch(() => null);
        throw new Error(parseErrorDetail(errData, 'Invalid credentials'));
      }
    } else {
      const errData = await response.json().catch(() => null);
      throw new Error(parseErrorDetail(errData, 'Invalid credentials'));
    }

    throw new Error('Authentication failed');
  },

  // Get all jobs from GET /jobs/
  getJobs: async (): Promise<Job[]> => {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/jobs/`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      clearStoredToken();
      throw new Error('Session expired or unauthorized. Please log in again.');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(parseErrorDetail(errData, `Failed to load jobs (status ${response.status})`));
    }

    const data = await response.json();
    let rawList: any[] = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data && Array.isArray(data.items)) {
      rawList = data.items;
    } else if (data && Array.isArray(data.jobs)) {
      rawList = data.jobs;
    } else if (data && Array.isArray(data.data)) {
      rawList = data.data;
    }

    return rawList.map(normalizeJob);
  },

  // Create a new job via POST /jobs/
  createJob: async (job: Partial<Job>): Promise<Job> => {
    const payload = {
      job_title: job.job_title,
      company: job.company,
      location: job.location || '',
      applied_date: job.applied_date || new Date().toISOString().split('T')[0],
      salary: job.salary !== null && job.salary !== undefined ? Number(job.salary) : null,
      status: job.status || 'Applied',
      current_round: job.current_round !== null && job.current_round !== undefined ? Number(job.current_round) : 1,
      interview_date: job.interview_date || null,
      offer_status: job.offer_status || 'None',
      remarks: job.remarks || '',
    };

    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/jobs/`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      clearStoredToken();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(parseErrorDetail(errData, `Failed to create job (status ${response.status})`));
    }

    const created = await response.json();
    return normalizeJob(created);
  },

  // Update existing job via PATCH /jobs/{job_id}
  updateJob: async (jobId: string | number, updates: Partial<Job>): Promise<Job> => {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/jobs/${jobId}`;

    const payload: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id') continue;
      if (key === 'salary') {
        payload[key] = value === null || value === '' ? null : Number(value);
      } else if (key === 'current_round') {
        payload[key] = value === null || value === '' ? null : Number(value);
      } else {
        payload[key] = value;
      }
    }

    let response = await fetch(endpoint, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (response.status === 405) {
      response = await fetch(endpoint, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
    }

    if (response.status === 401) {
      clearStoredToken();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(parseErrorDetail(errData, `Failed to update job (status ${response.status})`));
    }

    const updated = await response.json();
    return normalizeJob(updated);
  },

  // Delete job via DELETE /jobs/{job_id}
  deleteJob: async (jobId: string | number): Promise<void> => {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/jobs/${jobId}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      clearStoredToken();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok && response.status !== 204) {
      const errData = await response.json().catch(() => null);
      throw new Error(parseErrorDetail(errData, `Failed to delete job (status ${response.status})`));
    }
  },

  // ==========================================
  // User Management APIs
  // ==========================================

  // Get all users via GET /users/ (or /users)
  getUsers: async (): Promise<UserItem[]> => {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/users/`;

    let response = await fetch(endpoint, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.status === 404) {
      // Retry without trailing slash
      response = await fetch(`${baseUrl}/users`, {
        method: 'GET',
        headers: getHeaders(),
      });
    }

    if (response.status === 401) {
      clearStoredToken();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(parseErrorDetail(errData, `Failed to load users (status ${response.status})`));
    }

    const data = await response.json();
    let rawList: any[] = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data && Array.isArray(data.items)) {
      rawList = data.items;
    } else if (data && Array.isArray(data.users)) {
      rawList = data.users;
    } else if (data && Array.isArray(data.data)) {
      rawList = data.data;
    }

    return rawList.map((u: any) => ({
      id: u.id ?? u._id ?? u.user_id ?? Math.random().toString(36).substring(2, 9),
      username: u.username ?? u.email ?? '',
      email: u.email ?? u.username ?? '',
      name: u.name ?? u.full_name ?? u.display_name ?? null,
      role: u.role ?? u.user_role ?? 'User',
      created_at: u.created_at ?? u.createdAt ?? null,
    }));
  },

  // Create user via POST /users/ (or /users)
  createUser: async (input: CreateUserInput): Promise<UserItem> => {
    const baseUrl = getApiBaseUrl();
    let endpoint = `${baseUrl}/users/`;

    const usernameVal = input.username.trim();
    const emailVal = (input.email || usernameVal).trim();

    const payload = {
      name: usernameVal,
      email: emailVal,
      password: input.password || 'TemporaryPassword123!',
    };

    let response = await fetch(endpoint, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      endpoint = `${baseUrl}/users`;
      response = await fetch(endpoint, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
    }

    if (response.status === 401) {
      clearStoredToken();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(parseErrorDetail(errData, `Failed to create user (status ${response.status})`));
    }

    const created = await response.json();
    return {
      id: created.id ?? created._id ?? created.user_id ?? Math.random().toString(36).substring(2, 9),
      username: created.username ?? usernameVal,
      email: created.email ?? emailVal,
      name: created.name ?? created.full_name ?? input.name ?? null,
      role: created.role ?? input.role ?? 'User',
      created_at: created.created_at ?? new Date().toISOString(),
    };
  },

  // Update user via PUT/PATCH /users/{user_id}
  updateUser: async (userId: string | number, input: UpdateUserInput): Promise<UserItem> => {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/users/${userId}`;

    const payload: Record<string, any> = {};
    if (input.username !== undefined) {
      payload.username = input.username.trim();
    }
    if (input.email !== undefined) {
      payload.email = input.email.trim();
    }
    if (input.password) {
      payload.password = input.password;
    }
    if (input.name !== undefined) {
      payload.name = input.name;
      payload.full_name = input.name;
    }
    if (input.role !== undefined) {
      payload.role = input.role;
    }

    let response = await fetch(endpoint, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (response.status === 405 || response.status === 404) {
      response = await fetch(endpoint, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
    }

    if (response.status === 401) {
      clearStoredToken();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(parseErrorDetail(errData, `Failed to update user profile (status ${response.status})`));
    }

    const updated = await response.json();
    return {
      id: updated.id ?? userId,
      username: updated.username ?? input.username ?? '',
      email: updated.email ?? input.email ?? '',
      name: updated.name ?? updated.full_name ?? input.name ?? null,
      role: updated.role ?? input.role ?? 'User',
      created_at: updated.created_at ?? null,
    };
  },

  // Delete user via DELETE /users/{user_id}
  deleteUser: async (userId: string | number): Promise<void> => {
    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/users/${userId}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (response.status === 401) {
      clearStoredToken();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok && response.status !== 204) {
      const errData = await response.json().catch(() => null);
      throw new Error(parseErrorDetail(errData, `Failed to delete user account (status ${response.status})`));
    }
  },
};
