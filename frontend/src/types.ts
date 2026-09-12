export type JobStatus =
  | 'Applied'
  | 'Interviewing'
  | 'Offered'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn';

export type OfferStatus = 'None' | 'Offered' | 'Accepted' | 'Rejected';

export interface Job {
  id: string | number;
  job_title: string;
  company: string;
  location: string;
  applied_date: string;
  salary: number | null;
  status: JobStatus;
  current_round: number | null;
  interview_date: string | null;
  offer_status: OfferStatus;
  remarks: string | null;
}

export type JobField = keyof Omit<Job, 'id'>;

export interface JobFilters {
  search: string;
  status: JobStatus | 'All';
  offerStatus: OfferStatus | 'All';
  sortBy: keyof Job;
  sortOrder: 'asc' | 'desc';
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userEmail: string | null;
}

export interface ApiErrorResponse {
  detail?: string | Array<{ msg: string; loc?: string[] }>;
  message?: string;
  error?: string;
}

export interface UserItem {
  id: string | number;
  username: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  created_at?: string | null;
}

export interface CreateUserInput {
  username: string;
  email?: string;
  password?: string;
  name?: string;
  role?: string;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  password?: string;
  name?: string;
  role?: string;
}

export interface UpdateProfileInput {
  username?: string;
  email?: string;
  password?: string;
  name?: string;
}
