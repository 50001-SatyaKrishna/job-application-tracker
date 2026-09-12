import React, { useRef, useEffect } from 'react';
import { OfferStatus } from '../types';
import { ChevronDown } from 'lucide-react';
import { NavigationDirection } from './EditableCell';

interface OfferStatusBadgeProps {
  status: OfferStatus;
  onChange?: (newStatus: OfferStatus) => void;
  disabled?: boolean;
  isActive?: boolean;
  onActivate?: () => void;
  onNavigate?: (direction: NavigationDirection) => void;
  cellCoord?: { row: number; col: number };
}

const offerStatusConfig: Record<OfferStatus, { bg: string; text: string; border: string }> = {
  None: {
    bg: 'bg-slate-50 dark:bg-slate-800/80',
    text: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
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
};

export const OFFER_STATUS_OPTIONS: OfferStatus[] = ['None', 'Offered', 'Accepted', 'Rejected'];

export const OfferStatusBadge: React.FC<OfferStatusBadgeProps> = ({
  status,
  onChange,
  disabled = false,
  isActive = false,
  onActivate,
  onNavigate,
  cellCoord,
}) => {
  const current = offerStatusConfig[status] || offerStatusConfig.None;
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
      const key = e.key.toLowerCase();
      if (onChange) {
        if (key === 'n') {
          onChange('None');
        } else if (key === 'o') {
          onChange('Offered');
        } else if (key === 'a') {
          onChange('Accepted');
        } else if (key === 'r') {
          onChange('Rejected');
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
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${current.bg} ${current.text} ${current.border} select-none whitespace-nowrap`}
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
          onChange(e.target.value as OfferStatus);
          containerRef.current?.focus();
        }}
        onKeyDown={handleSelectKeyDown}
        className={`appearance-none cursor-pointer pl-2 pr-5 py-0.5 rounded-md text-xs border transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 ${current.bg} ${current.text} ${current.border}`}
      >
        {OFFER_STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 py-1">
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className={`w-3 h-3 absolute right-1.5 pointer-events-none ${current.text} opacity-60`} />
    </div>
  );
};
