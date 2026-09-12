import React from 'react';
import { Job, JobStatus } from '../types';

interface SummaryCardsProps {
  jobs: Job[];
  activeStatusFilter: JobStatus | 'All';
  onSelectStatus: (status: JobStatus | 'All') => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  jobs,
  activeStatusFilter,
  onSelectStatus,
}) => {
  const total = jobs.length;
  const interviewing = jobs.filter((j) => j.status === 'Interviewing').length;
  const offered = jobs.filter((j) => j.status === 'Offered').length;
  const accepted = jobs.filter((j) => j.status === 'Accepted').length;
  const rejected = jobs.filter((j) => j.status === 'Rejected').length;

  const cards = [
    {
      id: 'All' as const,
      label: 'Total Applications',
      count: total,
      sublabel: 'All tracked roles',
      badgeClass: 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:border-slate-700',
      activeBorder: 'ring-2 ring-slate-400 border-slate-400 dark:ring-slate-500 dark:border-slate-500',
    },
    {
      id: 'Interviewing' as const,
      label: 'Interviewing',
      count: interviewing,
      sublabel: 'Active interview loops',
      badgeClass: 'text-sky-800 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/60 dark:border-sky-800',
      activeBorder: 'ring-2 ring-sky-400 border-sky-400 dark:ring-sky-500 dark:border-sky-500',
    },
    {
      id: 'Offered' as const,
      label: 'Offered',
      count: offered,
      sublabel: 'Pending decision',
      badgeClass: 'text-emerald-800 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800',
      activeBorder: 'ring-2 ring-emerald-400 border-emerald-400 dark:ring-emerald-500 dark:border-emerald-500',
    },
    {
      id: 'Accepted' as const,
      label: 'Accepted',
      count: accepted,
      sublabel: 'Offers accepted',
      badgeClass: 'text-emerald-900 bg-emerald-100 border-emerald-300 dark:text-emerald-200 dark:bg-emerald-900/60 dark:border-emerald-700 font-medium',
      activeBorder: 'ring-2 ring-emerald-500 border-emerald-500 dark:ring-emerald-400 dark:border-emerald-400',
    },
    {
      id: 'Rejected' as const,
      label: 'Rejected',
      count: rejected,
      sublabel: 'Closed applications',
      badgeClass: 'text-rose-800 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-800',
      activeBorder: 'ring-2 ring-rose-400 border-rose-400 dark:ring-rose-500 dark:border-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const isSelected = activeStatusFilter === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              if (isSelected && card.id !== 'All') {
                onSelectStatus('All');
              } else {
                onSelectStatus(card.id);
              }
            }}
            className={`text-left bg-white dark:bg-slate-900 p-3.5 rounded-xl border transition-all shadow-xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 ${
              isSelected
                ? card.activeBorder
                : 'border-slate-200/80 dark:border-slate-800 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                {card.label}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-slate-800 dark:text-white tracking-tight">
                {card.count}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 truncate">
              {card.sublabel}
            </p>
          </button>
        );
      })}
    </div>
  );
};
