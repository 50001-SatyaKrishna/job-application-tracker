import { JobStatus, OfferStatus, Job } from '../types';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface ColumnFilters {
  job_title: string;
  company: string;
  location: string;
  remarks: string;
}

export interface TablePersistedState {
  page: number;
  pageSize: number;
  searchQuery: string;
  statusFilter: JobStatus | 'All';
  offerStatusFilter: OfferStatus | 'All';
  columnFilters: ColumnFilters;
  sortField?: keyof Job;
  sortDirection?: 'asc' | 'desc';
  currencyCode: CurrencyCode;
  columnWidths: Partial<Record<string, number>>;
}

const STORAGE_KEY = 'jobtracker_table_state_v1';

export const DEFAULT_COLUMN_FILTERS: ColumnFilters = {
  job_title: '',
  company: '',
  location: '',
  remarks: '',
};

export const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  job_title: 170,
  company: 160,
  location: 150,
  applied_date: 125,
  salary: 125,
  status: 135,
  current_round: 110,
  interview_date: 155,
  offer_status: 130,
  remarks: 220,
};

export const CURRENCY_OPTIONS: Array<{ code: CurrencyCode; label: string; symbol: string }> = [
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
];

export const getCurrencyMeta = (currencyCode: CurrencyCode = 'INR') =>
  CURRENCY_OPTIONS.find((option) => option.code === currencyCode) ?? CURRENCY_OPTIONS[0];

export const loadTableState = (): Partial<TablePersistedState> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.warn('Failed to load table state from localStorage', err);
    return {};
  }
};

export const saveTableState = (state: Partial<TablePersistedState>): void => {
  try {
    const current = loadTableState();
    const updated = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save table state to localStorage', err);
  }
};

export const clearStoredTableState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear table state from localStorage', err);
  }
};
