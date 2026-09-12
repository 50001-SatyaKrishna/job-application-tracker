import React, { useRef, useEffect } from 'react';
import { JobStatus } from '../types';
import { ChevronDown } from 'lucide-react';
import { NavigationDirection } from './EditableCell';

interface StatusBadgeProps {
  status: JobStatus;
  onChange?: (newStatus: JobStatus) => void;
  disabled?: boolean;
  isActive?: boolean;
  onActivate?: () => void;
  onNavigate?: (direction: NavigationDirection) => void;
  cellCoord?: { row: number; col: number };
}

const statusConfig: Record<JobStatus, { bg: string; text: string; border: string }> = {
  Applied: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  Interviewing: {
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    text: 'text-sky-800 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
  },
  Offered: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  Accepted: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/60',
    text: 'text-emerald-900 dark:text-emerald-200 font-medium',
    border: 'border-emerald-300 dark:border-emerald-700',
  },
  Rejected: {
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
  Withdrawn: {
    bg: 'bg-stone-100 dark:bg-slate-800',
    text: 'text-stone-600 dark:text-slate-300',
    border: 'border-stone-200 dark:border-slate-700',
  },
};

export const STATUS_OPTIONS: JobStatus[] = [
  'Applied',
  'Interviewing',
  'Offered',
  'Accepted',
  'Rejected',
  'Withdrawn',
];

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  onChange,
  disabled = false,
  isActive = false,
  onActivate,
  onNavigate,
  cellCoord,
}) => {
  const current = statusConfig[status] || statusConfig.Applied;
  const containerRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isActive && containerRef.current && document.activeElement !== selectRef.current) {
      containerRef.current.focus({ preventScroll: true });
    }
  }, [isActive]);

  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onNavigate?.('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onNavigate?.('down');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onNavigate?.('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onNavigate?.('right');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onNavigate?.(e.shiftKey ? 'prev' : 'next');
    } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'F2') {
      e.preventDefault();
      selectRef.current?.focus();
    } else {
      // Quick jump with initial letter
      const key = e.key.toLowerCase();
      if (onChange) {
        if (key === 'a') {
          onChange(status === 'Applied' ? 'Accepted' : 'Applied');
        } else if (key === 'i') {
          onChange('Interviewing');
        } else if (key === 'o') {
          onChange('Offered');
        } else if (key === 'r') {
          onChange('Rejected');
        } else if (key === 'w') {
          onChange('Withdrawn');
        }
      }
    }
  };

  const handleSelectKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      onNavigate?.(e.shiftKey ? 'prev' : 'next');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      containerRef.current?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      containerRef.current?.focus();
      onNavigate?.(e.shiftKey ? 'up' : 'down');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      containerRef.current?.focus();
      onNavigate?.('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      containerRef.current?.focus();
      onNavigate?.('right');
    }
  };

  const cellId = cellCoord ? `cell-${cellCoord.row}-${cellCoord.col}` : undefined;
  const dataCell = cellCoord ? `${cellCoord.row}-${cellCoord.col}` : undefined;

  if (!onChange || disabled) {
    return (
      <span
        id={cellId}
        data-cell={dataCell}
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs border ${current.bg} ${current.text} ${current.border} select-none whitespace-nowrap`}
      >
        {status}
      </span>
    );
  }

  return (
    <div
      ref={containerRef}
      id={cellId}
      data-cell={dataCell}
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        onActivate?.();
      }}
      onKeyDown={handleContainerKeyDown}
      className={`relative inline-flex items-center rounded-md outline-none transition-colors ${
        isActive
          ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-inset bg-blue-50/70 dark:bg-blue-950/50 z-10 p-0.5'
          : 'p-0.5'
      }`}
    >
      <select
        ref={selectRef}
        value={status}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value as JobStatus);
          containerRef.current?.focus();
        }}
        onKeyDown={handleSelectKeyDown}
        className={`appearance-none cursor-pointer pl-2.5 pr-6 py-1 rounded-md text-xs border transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 ${current.bg} ${current.text} ${current.border} font-medium`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 py-1">
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className={`w-3 h-3 absolute right-2 pointer-events-none ${current.text} opacity-60`} />
    </div>
  );
};
