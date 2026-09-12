import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Job, JobStatus, OfferStatus } from '../types';
import { EditableCell, NavigationDirection } from './EditableCell';
import { StatusBadge } from './StatusBadge';
import { OfferStatusBadge } from './OfferStatusBadge';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import {
  loadTableState,
  saveTableState,
  clearStoredTableState,
  ColumnFilters,
  DEFAULT_COLUMN_FILTERS,
  DEFAULT_COLUMN_WIDTHS,
  CurrencyCode,
  CURRENCY_OPTIONS,
  getCurrencyMeta,
} from '../utils/tableStorage';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface JobTableProps {
  jobs: Job[];
  isLoading: boolean;
  statusFilter: JobStatus | 'All';
  onStatusFilterChange: (status: JobStatus | 'All') => void;
  onUpdateJob: (jobId: string | number, field: keyof Job, value: any) => Promise<void>;
  onDeleteJob: (jobId: string | number) => Promise<void>;
  onOpenAddModal: () => void;
  currencyCode?: CurrencyCode;
  onCurrencyChange?: (currencyCode: CurrencyCode) => void;
}

const COLUMN_NAMES = [
  'Job Title',
  'Company',
  'Location',
  'Applied Date',
  'Salary',
  'Status',
  'Round',
  'Interview Date',
  'Offer Status',
  'Remarks',
];

export const JobTable: React.FC<JobTableProps> = ({
  jobs,
  isLoading,
  statusFilter,
  onStatusFilterChange,
  onUpdateJob,
  onDeleteJob,
  onOpenAddModal,
  currencyCode: currencyCodeProp = 'INR',
  onCurrencyChange,
}) => {
  // Load persisted state or fallback to defaults
  const savedState = useMemo(() => loadTableState(), []);

  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery || '');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(
    savedState.columnFilters || DEFAULT_COLUMN_FILTERS
  );
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(() => {
    const raw = savedState.currencyCode ?? currencyCodeProp;
    return raw && CURRENCY_OPTIONS.some((option) => option.code === raw) ? raw : 'INR';
  });
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => ({
    ...DEFAULT_COLUMN_WIDTHS,
    ...(savedState.columnWidths || {}),
  }));
  const [offerStatusFilter, setOfferStatusFilter] = useState<OfferStatus | 'All'>(
    savedState.offerStatusFilter || 'All'
  );
  const [sortField, setSortField] = useState<keyof Job>(
    savedState.sortField || 'applied_date'
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    savedState.sortDirection || 'desc'
  );
  const [page, setPage] = useState(savedState.page || 1);
  const [pageSize, setPageSize] = useState(savedState.pageSize || 10);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [jobPendingDelete, setJobPendingDelete] = useState<Job | null>(null);
  const resizeStateRef = useRef<{ field: string; startX: number; startWidth: number } | null>(null);

  // Spreadsheet keyboard navigation state
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [isEditingCell, setIsEditingCell] = useState<boolean>(false);

  // Sync state to localStorage whenever relevant table options change
  useEffect(() => {
    if (currencyCodeProp !== currencyCode) {
      setCurrencyCode(currencyCodeProp);
    }
  }, [currencyCodeProp, currencyCode]);

  useEffect(() => {
    if (onCurrencyChange) {
      onCurrencyChange(currencyCode);
    }
  }, [currencyCode, onCurrencyChange]);

  useEffect(() => {
    saveTableState({
      page,
      pageSize,
      searchQuery,
      statusFilter,
      offerStatusFilter,
      sortField,
      sortDirection,
      columnFilters,
      currencyCode,
      columnWidths,
    });
  }, [
    page,
    pageSize,
    searchQuery,
    statusFilter,
    offerStatusFilter,
    sortField,
    sortDirection,
    columnFilters,
    currencyCode,
    columnWidths,
  ]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeStateRef.current) return;
      const delta = event.clientX - resizeStateRef.current.startX;
      const nextWidth = Math.max(80, resizeStateRef.current.startWidth + delta);
      setColumnWidths((prev) => ({
        ...prev,
        [resizeStateRef.current!.field]: nextWidth,
      }));
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Column search filter helper
  const handleColumnFilterChange = (field: keyof ColumnFilters, val: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [field]: val,
    }));
    setPage(1);
  };

  // Sorting handler
  const handleSort = (field: keyof Job) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & sort jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Global Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.job_title?.toLowerCase().includes(q);
        const matchesCompany = job.company?.toLowerCase().includes(q);
        const matchesLoc = job.location?.toLowerCase().includes(q);
        const matchesRemarks = job.remarks?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesLoc && !matchesRemarks) {
          return false;
        }
      }

      // Column-specific search filters
      if (columnFilters.job_title.trim()) {
        const q = columnFilters.job_title.toLowerCase();
        if (!job.job_title?.toLowerCase().includes(q)) return false;
      }

      if (columnFilters.company.trim()) {
        const q = columnFilters.company.toLowerCase();
        if (!job.company?.toLowerCase().includes(q)) return false;
      }

      if (columnFilters.location.trim()) {
        const q = columnFilters.location.toLowerCase();
        if (!job.location?.toLowerCase().includes(q)) return false;
      }

      if (columnFilters.remarks.trim()) {
        const q = columnFilters.remarks.toLowerCase();
        if (!job.remarks?.toLowerCase().includes(q)) return false;
      }

      // Status
      if (statusFilter !== 'All' && job.status !== statusFilter) {
        return false;
      }

      // Offer Status
      if (offerStatusFilter !== 'All' && job.offer_status !== offerStatusFilter) {
        return false;
      }

      return true;
    });
  }, [jobs, searchQuery, columnFilters, statusFilter, offerStatusFilter]);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === null || valA === undefined || valA === '') return 1;
      if (valB === null || valB === undefined || valB === '') return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredJobs, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedJobs.slice(start, start + pageSize);
  }, [sortedJobs, currentPage, pageSize]);

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, sortedJobs.length);

  const getColumnWidth = (field: string) => {
    return Math.max(80, columnWidths[field] ?? DEFAULT_COLUMN_WIDTHS[field] ?? 120);
  };

  const startColumnResize = (field: string, clientX: number) => {
    resizeStateRef.current = {
      field,
      startX: clientX,
      startWidth: getColumnWidth(field),
    };
  };

  const columnHeaderStyle = (field: string) => ({
    width: `${getColumnWidth(field)}px`,
    minWidth: '80px',
  });

  // Spreadsheet keyboard navigation handler
  const navigateCell = useCallback(
    (direction: NavigationDirection, startEdit: boolean = false) => {
      setActiveCell((prev) => {
        const maxRow = paginatedJobs.length - 1;
        if (maxRow < 0) return null;
        if (!prev) return { row: 0, col: 0 };
        const maxCol = COLUMN_NAMES.length - 1; // 0 to 9

        let nextRow = prev.row;
        let nextCol = prev.col;

        switch (direction) {
          case 'up':
            nextRow = Math.max(0, prev.row - 1);
            break;
          case 'down':
            nextRow = Math.min(maxRow, prev.row + 1);
            break;
          case 'left':
            if (prev.col > 0) {
              nextCol = prev.col - 1;
            } else if (prev.row > 0) {
              nextRow = prev.row - 1;
              nextCol = maxCol;
            }
            break;
          case 'right':
            if (prev.col < maxCol) {
              nextCol = prev.col + 1;
            } else if (prev.row < maxRow) {
              nextRow = prev.row + 1;
              nextCol = 0;
            }
            break;
          case 'next': // Tab
            if (prev.col < maxCol) {
              nextCol = prev.col + 1;
            } else if (prev.row < maxRow) {
              nextRow = prev.row + 1;
              nextCol = 0;
            }
            break;
          case 'prev': // Shift + Tab
            if (prev.col > 0) {
              nextCol = prev.col - 1;
            } else if (prev.row > 0) {
              nextRow = prev.row - 1;
              nextCol = maxCol;
            }
            break;
        }
        return { row: nextRow, col: nextCol };
      });
      setIsEditingCell(startEdit);
    },
    [paginatedJobs.length]
  );

  // Keep focused cell smoothly inside the viewport
  useEffect(() => {
    if (activeCell) {
      const el = document.querySelector(`[data-cell="${activeCell.row}-${activeCell.col}"]`);
      if (el) {
        (el as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeCell]);

  // Adjust active cell if page or filter changes reduce row count
  useEffect(() => {
    if (activeCell) {
      if (paginatedJobs.length === 0) {
        setActiveCell(null);
        setIsEditingCell(false);
      } else if (activeCell.row >= paginatedJobs.length) {
        setActiveCell({ row: paginatedJobs.length - 1, col: activeCell.col });
      }
    }
  }, [paginatedJobs.length, currentPage]);

  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLTableElement>) => {
    if (!activeCell && paginatedJobs.length > 0) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
        e.preventDefault();
        setActiveCell({ row: 0, col: 0 });
        setIsEditingCell(false);
      }
    }
  };

  // Currency formatter
  const formatSalary = (val: any) => {
    if (val === null || val === undefined || val === '') return '—';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    const currencyMeta = getCurrencyMeta(currencyCode);
    const locale = currencyCode === 'INR' ? 'en-IN' : currencyCode === 'USD' ? 'en-US' : 'en-GB';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyMeta.code,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'All' ||
    offerStatusFilter !== 'All' ||
    Boolean(columnFilters.job_title) ||
    Boolean(columnFilters.company) ||
    Boolean(columnFilters.location) ||
    Boolean(columnFilters.remarks);

  const clearAllFilters = () => {
    setSearchQuery('');
    setColumnFilters(DEFAULT_COLUMN_FILTERS);
    onStatusFilterChange('All');
    setOfferStatusFilter('All');
    setPage(1);
    clearStoredTableState();
  };

  const renderSortIcon = (field: keyof Job) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 text-blue-600 dark:text-blue-400" />
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col transition-colors">
      {/* Search and Filters Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/40">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search title, company, location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                onStatusFilterChange(e.target.value as JobStatus | 'All');
                setPage(1);
              }}
              className="py-1.5 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offered">Offered</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>

          {/* Offer Status Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Offer:
            </label>
            <select
              value={offerStatusFilter}
              onChange={(e) => {
                setOfferStatusFilter(e.target.value as OfferStatus | 'All');
                setPage(1);
              }}
              className="py-1.5 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="All">All Offers</option>
              <option value="None">None</option>
              <option value="Offered">Offered</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Currency:
            </label>
            <select
              value={currencyCode}
              onChange={(e) => {
                const nextCurrency = e.target.value as CurrencyCode;
                setCurrencyCode(nextCurrency);
                onCurrencyChange?.(nextCurrency);
              }}
              className="py-1.5 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-400 cursor-pointer"
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.symbol} {option.code}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Quick Add Button & Keyboard Help */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Application
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto w-full relative min-h-[300px]">
        <table
          tabIndex={0}
          onKeyDown={handleTableKeyDown}
          className="w-full text-left border-collapse min-w-[1280px] focus:outline-none"
        >
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-semibold border-b border-slate-200 dark:border-slate-700 select-none">
              <th className="w-10 px-2 py-3 text-center border-r border-slate-200 dark:border-slate-700 text-slate-400 font-mono text-[11px]">
                #
              </th>
              <th
                onClick={() => handleSort('job_title')}
                className="group px-3 py-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 relative"
                style={columnHeaderStyle('job_title')}
              >
                <div className="flex items-center justify-between pr-2">
                  <span>Job Title</span>
                  {renderSortIcon('job_title')}
                </div>
                <div
                  data-column-resize-handle
                  className="absolute right-1 top-0 bottom-0 w-3.5 cursor-col-resize hover:bg-blue-400/40 z-20 rounded-sm"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    startColumnResize('job_title', event.clientX);
                  }}
                />
              </th>
              <th
                onClick={() => handleSort('company')}
                className="group px-3 py-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 relative"
                style={columnHeaderStyle('company')}
              >
                <div className="flex items-center justify-between pr-2">
                  <span>Company</span>
                  {renderSortIcon('company')}
                </div>
                <div
                  data-column-resize-handle
                  className="absolute right-1 top-0 bottom-0 w-3.5 cursor-col-resize hover:bg-blue-400/40 z-20 rounded-sm"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    startColumnResize('company', event.clientX);
                  }}
                />
              </th>
              <th
                onClick={() => handleSort('location')}
                className="group px-3 py-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 relative"
                style={columnHeaderStyle('location')}
              >
                <div className="flex items-center justify-between pr-2">
                  <span>Location</span>
                  {renderSortIcon('location')}
                </div>
                <div
                  data-column-resize-handle
                  className="absolute right-1 top-0 bottom-0 w-3.5 cursor-col-resize hover:bg-blue-400/40 z-20 rounded-sm"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    startColumnResize('location', event.clientX);
                  }}
                />
              </th>
              <th
                onClick={() => handleSort('applied_date')}
                className="group px-3 py-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 relative"
                style={columnHeaderStyle('applied_date')}
              >
                <div className="flex items-center justify-between pr-2">
                  <span>Applied Date</span>
                  {renderSortIcon('applied_date')}
                </div>
                <div
                  data-column-resize-handle
                  className="absolute right-1 top-0 bottom-0 w-3.5 cursor-col-resize hover:bg-blue-400/40 z-20 rounded-sm"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    startColumnResize('applied_date', event.clientX);
                  }}
                />
              </th>
              <th
                onClick={() => handleSort('salary')}
                className="group px-3 py-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 relative"
                style={columnHeaderStyle('salary')}
              >
                <div className="flex items-center justify-between pr-2">
                  <span>Salary</span>
                  {renderSortIcon('salary')}
                </div>
                <div
                  data-column-resize-handle
                  className="absolute right-1 top-0 bottom-0 w-3.5 cursor-col-resize hover:bg-blue-400/40 z-20 rounded-sm"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    startColumnResize('salary', event.clientX);
                  }}
                />
              </th>
              <th
                onClick={() => handleSort('status')}
                className="group px-3 py-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 relative"
                style={columnHeaderStyle('status')}
              >
                <div className="flex items-center justify-between pr-2">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
                <div
                  data-column-resize-handle
                  className="absolute right-1 top-0 bottom-0 w-3.5 cursor-col-resize hover:bg-blue-400/40 z-20 rounded-sm"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    startColumnResize('status', event.clientX);
                  }}
                />
              </th>
              <th
                onClick={() => handleSort('current_round')}
                className="group px-3 py-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 relative"
                style={columnHeaderStyle('current_round')}
              >
                <div className="flex items-center justify-between pr-2">
                  <span>Round</span>
                  {renderSortIcon('current_round')}
                </div>
                <div
                  data-column-resize-handle
                  className="absolute right-1 top-0 bottom-0 w-3.5 cursor-col-resize hover:bg-blue-400/40 z-20 rounded-sm"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    startColumnResize('current_round', event.clientX);
                  }}
                />
              </th>
              <th
                onClick={() => handleSort('interview_date')}
                className="group px-3 py-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 relative"
                style={columnHeaderStyle('interview_date')}
              >
                <div className="flex items-center justify-between pr-2">
                  <span>Interview Date</span>
                  {renderSortIcon('interview_date')}
                </div>
                <div
                  data-column-resize-handle
                  className="absolute right-1 top-0 bottom-0 w-3.5 cursor-col-resize hover:bg-blue-400/40 z-20 rounded-sm"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    startColumnResize('interview_date', event.clientX);
                  }}
                />
              </th>
              <th
                onClick={() => handleSort('offer_status')}
                className="group px-3 py-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 relative"
                style={columnHeaderStyle('offer_status')}
              >
                <div className="flex items-center justify-between pr-2">
                  <span>Offer Status</span>
                  {renderSortIcon('offer_status')}
                </div>
                <div
                  data-column-resize-handle
                  className="absolute right-1 top-0 bottom-0 w-3.5 cursor-col-resize hover:bg-blue-400/40 z-20 rounded-sm"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    startColumnResize('offer_status', event.clientX);
                  }}
                />
              </th>
              <th className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 relative" style={columnHeaderStyle('remarks')}>
                <span>Remarks</span>
                <div
                  data-column-resize-handle
                  className="absolute right-1 top-0 bottom-0 w-3.5 cursor-col-resize hover:bg-blue-400/40 z-20 rounded-sm"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    startColumnResize('remarks', event.clientX);
                  }}
                />
              </th>
              <th className="w-16 px-3 py-3 text-center text-slate-500 dark:text-slate-400">
                <span>Actions</span>
              </th>
            </tr>
            {/* Column Search Filter Row */}
            <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
              <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 text-center text-slate-400">
                <Filter className="w-3 h-3 mx-auto opacity-40" />
              </td>
              <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700">
                <input
                  type="text"
                  placeholder="Filter title..."
                  value={columnFilters.job_title}
                  onChange={(e) => handleColumnFilterChange('job_title', e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 font-normal"
                />
              </td>
              <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700">
                <input
                  type="text"
                  placeholder="Filter company..."
                  value={columnFilters.company}
                  onChange={(e) => handleColumnFilterChange('company', e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 font-normal"
                />
              </td>
              <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700">
                <input
                  type="text"
                  placeholder="Filter location..."
                  value={columnFilters.location}
                  onChange={(e) => handleColumnFilterChange('location', e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 font-normal"
                />
              </td>
              <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 bg-slate-50/20 dark:bg-slate-800/20" />
              <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 bg-slate-50/20 dark:bg-slate-800/20" />
              <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 bg-slate-50/20 dark:bg-slate-800/20" />
              <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 bg-slate-50/20 dark:bg-slate-800/20" />
              <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 bg-slate-50/20 dark:bg-slate-800/20" />
              <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700 bg-slate-50/20 dark:bg-slate-800/20" />
              <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-700">
                <input
                  type="text"
                  placeholder="Filter remarks..."
                  value={columnFilters.remarks}
                  onChange={(e) => handleColumnFilterChange('remarks', e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 font-normal"
                />
              </td>
              <td className="px-2 py-1.5 text-center bg-slate-50/20 dark:bg-slate-800/20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={12} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin" />
                    <span className="text-xs">Loading job applications...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedJobs.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                      <Filter className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      No applications found
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {hasActiveFilters
                        ? 'Try adjusting or clearing your search and filter criteria.'
                        : 'Start tracking by adding your first job application.'}
                    </p>
                    {hasActiveFilters ? (
                      <button
                        onClick={clearAllFilters}
                        className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                        Reset filters
                      </button>
                    ) : (
                      <button
                        onClick={onOpenAddModal}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-xs font-medium shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Application
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedJobs.map((job, index) => {
                const rowNum = (currentPage - 1) * pageSize + index + 1;
                const isRowDeleting = deletingId === job.id;
                const isSelectedRow = activeCell?.row === index;

                return (
                  <tr
                    key={job.id}
                    onClick={() => {
                      if (!activeCell || activeCell.row !== index) {
                        setActiveCell({ row: index, col: activeCell ? activeCell.col : 0 });
                        setIsEditingCell(false);
                      }
                    }}
                    className={`transition-colors duration-150 group relative cursor-pointer ${
                      isRowDeleting
                        ? 'opacity-40 pointer-events-none'
                        : isSelectedRow
                        ? 'bg-blue-50/50 dark:bg-blue-950/25 shadow-[inset_3px_0_0_0_#3b82f6]'
                        : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Row Index */}
                    <td
                      className={`w-10 px-2 py-1 text-center font-mono text-[11px] border-r transition-colors select-none ${
                        isSelectedRow
                          ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-100/40 dark:bg-blue-900/30 border-blue-200/50 dark:border-blue-900/40'
                          : 'text-slate-400 border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    >
                      {rowNum}
                    </td>

                    {/* 1. Job Title */}
                    <td className="p-0 border-r border-slate-100 dark:border-slate-800">
                      <EditableCell
                        value={job.job_title}
                        type="text"
                        cellCoord={{ row: index, col: 0 }}
                        isActive={activeCell?.row === index && activeCell?.col === 0}
                        isEditing={activeCell?.row === index && activeCell?.col === 0 && isEditingCell}
                        onActivate={() => {
                          setActiveCell({ row: index, col: 0 });
                          setIsEditingCell(false);
                        }}
                        onStartEdit={() => {
                          setActiveCell({ row: index, col: 0 });
                          setIsEditingCell(true);
                        }}
                        onStopEdit={() => setIsEditingCell(false)}
                        onNavigate={(dir) => navigateCell(dir)}
                        onSave={(val) => onUpdateJob(job.id, 'job_title', val)}
                        placeholder="Add title"
                        className="font-medium text-slate-800 dark:text-slate-100"
                      />
                    </td>

                    {/* 2. Company (NO LOGOS) */}
                    <td className="p-0 border-r border-slate-100 dark:border-slate-800">
                      <EditableCell
                        value={job.company}
                        type="text"
                        cellCoord={{ row: index, col: 1 }}
                        isActive={activeCell?.row === index && activeCell?.col === 1}
                        isEditing={activeCell?.row === index && activeCell?.col === 1 && isEditingCell}
                        onActivate={() => {
                          setActiveCell({ row: index, col: 1 });
                          setIsEditingCell(false);
                        }}
                        onStartEdit={() => {
                          setActiveCell({ row: index, col: 1 });
                          setIsEditingCell(true);
                        }}
                        onStopEdit={() => setIsEditingCell(false)}
                        onNavigate={(dir) => navigateCell(dir)}
                        onSave={(val) => onUpdateJob(job.id, 'company', val)}
                        placeholder="Add company"
                      />
                    </td>

                    {/* 3. Location */}
                    <td className="p-0 border-r border-slate-100 dark:border-slate-800">
                      <EditableCell
                        value={job.location}
                        type="text"
                        cellCoord={{ row: index, col: 2 }}
                        isActive={activeCell?.row === index && activeCell?.col === 2}
                        isEditing={activeCell?.row === index && activeCell?.col === 2 && isEditingCell}
                        onActivate={() => {
                          setActiveCell({ row: index, col: 2 });
                          setIsEditingCell(false);
                        }}
                        onStartEdit={() => {
                          setActiveCell({ row: index, col: 2 });
                          setIsEditingCell(true);
                        }}
                        onStopEdit={() => setIsEditingCell(false)}
                        onNavigate={(dir) => navigateCell(dir)}
                        onSave={(val) => onUpdateJob(job.id, 'location', val)}
                        placeholder="Location"
                      />
                    </td>

                    {/* 4. Applied Date */}
                    <td className="p-0 border-r border-slate-100 dark:border-slate-800 font-mono text-xs">
                      <EditableCell
                        value={job.applied_date}
                        type="date"
                        cellCoord={{ row: index, col: 3 }}
                        isActive={activeCell?.row === index && activeCell?.col === 3}
                        isEditing={activeCell?.row === index && activeCell?.col === 3 && isEditingCell}
                        onActivate={() => {
                          setActiveCell({ row: index, col: 3 });
                          setIsEditingCell(false);
                        }}
                        onStartEdit={() => {
                          setActiveCell({ row: index, col: 3 });
                          setIsEditingCell(true);
                        }}
                        onStopEdit={() => setIsEditingCell(false)}
                        onNavigate={(dir) => navigateCell(dir)}
                        onSave={(val) => onUpdateJob(job.id, 'applied_date', val)}
                        placeholder="YYYY-MM-DD"
                      />
                    </td>

                    {/* 5. Salary */}
                    <td className="p-0 border-r border-slate-100 dark:border-slate-800 font-mono text-xs">
                      <EditableCell
                        value={job.salary}
                        type="number"
                        min={0}
                        step="1000"
                        formatDisplay={formatSalary}
                        cellCoord={{ row: index, col: 4 }}
                        isActive={activeCell?.row === index && activeCell?.col === 4}
                        isEditing={activeCell?.row === index && activeCell?.col === 4 && isEditingCell}
                        onActivate={() => {
                          setActiveCell({ row: index, col: 4 });
                          setIsEditingCell(false);
                        }}
                        onStartEdit={() => {
                          setActiveCell({ row: index, col: 4 });
                          setIsEditingCell(true);
                        }}
                        onStopEdit={() => setIsEditingCell(false)}
                        onNavigate={(dir) => navigateCell(dir)}
                        onSave={(val) => onUpdateJob(job.id, 'salary', val)}
                        placeholder="Set salary"
                      />
                    </td>

                    {/* 6. Status (Dropdown) */}
                    <td className="px-2 py-1 border-r border-slate-100 dark:border-slate-800">
                      <StatusBadge
                        status={job.status}
                        cellCoord={{ row: index, col: 5 }}
                        isActive={activeCell?.row === index && activeCell?.col === 5}
                        onActivate={() => {
                          setActiveCell({ row: index, col: 5 });
                          setIsEditingCell(false);
                        }}
                        onNavigate={(dir) => navigateCell(dir)}
                        onChange={(newStatus) => onUpdateJob(job.id, 'status', newStatus)}
                      />
                    </td>

                    {/* 7. Current Round */}
                    <td className="p-0 border-r border-slate-100 dark:border-slate-800 font-mono text-xs">
                      <EditableCell
                        value={job.current_round}
                        type="number"
                        min={1}
                        max={10}
                        align="center"
                        cellCoord={{ row: index, col: 6 }}
                        isActive={activeCell?.row === index && activeCell?.col === 6}
                        isEditing={activeCell?.row === index && activeCell?.col === 6 && isEditingCell}
                        onActivate={() => {
                          setActiveCell({ row: index, col: 6 });
                          setIsEditingCell(false);
                        }}
                        onStartEdit={() => {
                          setActiveCell({ row: index, col: 6 });
                          setIsEditingCell(true);
                        }}
                        onStopEdit={() => setIsEditingCell(false)}
                        onNavigate={(dir) => navigateCell(dir)}
                        onSave={(val) => onUpdateJob(job.id, 'current_round', val)}
                        placeholder="1"
                      />
                    </td>

                    {/* 8. Interview Date */}
                    <td className="p-0 border-r border-slate-100 dark:border-slate-800 font-mono text-xs">
                      <EditableCell
                        value={job.interview_date}
                        type="datetime-local"
                        cellCoord={{ row: index, col: 7 }}
                        isActive={activeCell?.row === index && activeCell?.col === 7}
                        isEditing={activeCell?.row === index && activeCell?.col === 7 && isEditingCell}
                        onActivate={() => {
                          setActiveCell({ row: index, col: 7 });
                          setIsEditingCell(false);
                        }}
                        onStartEdit={() => {
                          setActiveCell({ row: index, col: 7 });
                          setIsEditingCell(true);
                        }}
                        onStopEdit={() => setIsEditingCell(false)}
                        onNavigate={(dir) => navigateCell(dir)}
                        onSave={(val) => onUpdateJob(job.id, 'interview_date', val)}
                        placeholder="Set interview"
                      />
                    </td>

                    {/* 9. Offer Status (Dropdown) */}
                    <td className="px-2 py-1 border-r border-slate-100 dark:border-slate-800">
                      <OfferStatusBadge
                        status={job.offer_status}
                        cellCoord={{ row: index, col: 8 }}
                        isActive={activeCell?.row === index && activeCell?.col === 8}
                        onActivate={() => {
                          setActiveCell({ row: index, col: 8 });
                          setIsEditingCell(false);
                        }}
                        onNavigate={(dir) => navigateCell(dir)}
                        onChange={(newStatus) => onUpdateJob(job.id, 'offer_status', newStatus)}
                      />
                    </td>

                    {/* 10. Remarks */}
                    <td className="p-0 border-r border-slate-100 dark:border-slate-800">
                      <EditableCell
                        value={job.remarks}
                        type="text"
                        cellCoord={{ row: index, col: 9 }}
                        isActive={activeCell?.row === index && activeCell?.col === 9}
                        isEditing={activeCell?.row === index && activeCell?.col === 9 && isEditingCell}
                        onActivate={() => {
                          setActiveCell({ row: index, col: 9 });
                          setIsEditingCell(false);
                        }}
                        onStartEdit={() => {
                          setActiveCell({ row: index, col: 9 });
                          setIsEditingCell(true);
                        }}
                        onStopEdit={() => setIsEditingCell(false)}
                        onNavigate={(dir) => navigateCell(dir)}
                        onSave={(val) => onUpdateJob(job.id, 'remarks', val)}
                        placeholder="Add remarks or notes..."
                        className="text-xs text-slate-600 dark:text-slate-400"
                      />
                    </td>

                    {/* 11. Actions */}
                    <td className="px-2 py-1 text-center">
                      <button
                        onClick={() => setJobPendingDelete(job)}
                        title="Delete application"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && sortedJobs.length > 0 && (
        <div className="p-3 sm:px-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-700 dark:text-slate-200">{startIndex}</strong> to{' '}
              <strong className="text-slate-700 dark:text-slate-200">{endIndex}</strong> of{' '}
              <strong className="text-slate-700 dark:text-slate-200">{sortedJobs.length}</strong> applications
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-0.5 text-slate-700 dark:text-slate-200 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(jobPendingDelete)}
        job={jobPendingDelete}
        isDeleting={Boolean(deletingId)}
        onCancel={() => {
          if (!deletingId) {
            setJobPendingDelete(null);
          }
        }}
        onConfirm={async () => {
          if (!jobPendingDelete) return;
          try {
            setDeletingId(jobPendingDelete.id);
            await onDeleteJob(jobPendingDelete.id);
            setJobPendingDelete(null);
          } finally {
            setDeletingId(null);
          }
        }}
      />
    </div>
  );
};
