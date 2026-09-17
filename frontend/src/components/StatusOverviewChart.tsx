import React, { useState } from 'react';
import { Job, JobStatus } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, CheckCircle2, Award, Clock } from 'lucide-react';

interface StatusOverviewChartProps {
  jobs: Job[];
  activeStatusFilter: JobStatus | 'All';
  onSelectStatus: (status: JobStatus | 'All') => void;
}

interface StatusConfig {
  status: JobStatus;
  label: string;
  color: string;
  fillHex: string;
  bgBadge: string;
  borderBadge: string;
  textBadge: string;
}

const STATUS_CONFIGS: StatusConfig[] = [
  {
    status: 'Applied',
    label: 'Applied',
    color: 'text-indigo-700',
    fillHex: '#6366f1',
    bgBadge: 'bg-indigo-50',
    borderBadge: 'border-indigo-200',
    textBadge: 'text-indigo-700',
  },
  {
    status: 'Interviewing',
    label: 'Interviewing',
    color: 'text-sky-700',
    fillHex: '#0284c7',
    bgBadge: 'bg-sky-50',
    borderBadge: 'border-sky-200',
    textBadge: 'text-sky-700',
  },
  {
    status: 'Offered',
    label: 'Offered',
    color: 'text-emerald-700',
    fillHex: '#10b981',
    bgBadge: 'bg-emerald-50',
    borderBadge: 'border-emerald-200',
    textBadge: 'text-emerald-700',
  },
  {
    status: 'Accepted',
    label: 'Accepted',
    color: 'text-teal-800',
    fillHex: '#0d9488',
    bgBadge: 'bg-teal-50',
    borderBadge: 'border-teal-200',
    textBadge: 'text-teal-800',
  },
  {
    status: 'Rejected',
    label: 'Rejected',
    color: 'text-rose-700',
    fillHex: '#f43f5e',
    bgBadge: 'bg-rose-50',
    borderBadge: 'border-rose-200',
    textBadge: 'text-rose-700',
  },
  {
    status: 'Withdrawn',
    label: 'Withdrawn',
    color: 'text-slate-600',
    fillHex: '#64748b',
    bgBadge: 'bg-slate-100',
    borderBadge: 'border-slate-200',
    textBadge: 'text-slate-600',
  },
];

export const StatusOverviewChart: React.FC<StatusOverviewChartProps> = ({
  jobs,
  activeStatusFilter,
  onSelectStatus,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'donut'>('bar');

  const totalApplications = jobs.length;

  const data = STATUS_CONFIGS.map((cfg) => {
    const count = jobs.filter((j) => j.status === cfg.status).length;
    const percentage = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
    return {
      status: cfg.status,
      label: cfg.label,
      count,
      percentage,
      fillHex: cfg.fillHex,
      cfg,
    };
  });

  const activeInterviews = jobs.filter((j) => j.status === 'Interviewing').length;
  const totalOffers = jobs.filter((j) => j.status === 'Offered' || j.status === 'Accepted').length;
  const offerRate = totalApplications > 0 ? Math.round((totalOffers / totalApplications) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 sm:p-6 transition-all">
      {/* Header & Chart Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Application Pipeline by Status
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              {totalApplications} total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any bar or badge to filter the table below
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100/90 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              chartType === 'bar'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Distribution</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('donut')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              chartType === 'donut'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Donut</span>
          </button>
        </div>
      </div>

      {/* Main Visual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 items-center">
        {/* Chart Column */}
        <div className="lg:col-span-8 h-56 sm:h-64 w-full">
          {totalApplications === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
              <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
              <span>No applications tracked yet</span>
            </div>
          ) : chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.1)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg py-1.5 px-2.5 shadow-lg border border-slate-800 dark:border-slate-700">
                          <div className="font-semibold">{item.label}</div>
                          <div className="text-slate-300 dark:text-slate-400">
                            {item.count} application{item.count === 1 ? '' : 's'} ({item.percentage}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                  onClick={(entry: any) => {
                    const status = entry?.status || entry?.payload?.status;
                    if (status) {
                      onSelectStatus(
                        activeStatusFilter === status ? 'All' : status
                      );
                    }
                  }}
                  className="cursor-pointer"
                >
                  {data.map((entry) => {
                    const isSelected = activeStatusFilter === entry.status;
                    const isAnySelected = activeStatusFilter !== 'All';
                    return (
                      <Cell
                        key={`bar-${entry.status}`}
                        fill={entry.fillHex}
                        opacity={isAnySelected && !isSelected ? 0.35 : 1}
                        stroke={isSelected ? '#38bdf8' : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.filter((d) => d.count > 0)}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  onClick={(entry: any) => {
                    const status = entry?.status || entry?.payload?.status;
                    if (status) {
                      onSelectStatus(
                        activeStatusFilter === status ? 'All' : status
                      );
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  {data
                    .filter((d) => d.count > 0)
                    .map((entry) => {
                      const isSelected = activeStatusFilter === entry.status;
                      const isAnySelected = activeStatusFilter !== 'All';
                      return (
                        <Cell
                          key={`pie-${entry.status}`}
                          fill={entry.fillHex}
                          opacity={isAnySelected && !isSelected ? 0.35 : 1}
                          stroke={isSelected ? '#38bdf8' : 'transparent'}
                          strokeWidth={2}
                        />
                      );
                    })}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg py-1.5 px-2.5 shadow-lg border border-slate-800 dark:border-slate-700">
                          <div className="font-semibold">{item.label}</div>
                          <div className="text-slate-300 dark:text-slate-400">
                            {item.count} application{item.count === 1 ? '' : 's'} ({item.percentage}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Metrics & Interactive Legend */}
        <div className="lg:col-span-4 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
          {/* Quick Stat Badges */}
          <div className="grid grid-cols-2 gap-2 mb-1">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">In Loops</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{activeInterviews}</div>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Offer Rate</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{offerRate}%</div>
              </div>
            </div>
          </div>

          {/* Interactive Status Items */}
          <div className="space-y-1.5">
            {data.map((item) => {
              const isSelected = activeStatusFilter === item.status;
              return (
                <button
                  key={item.status}
                  type="button"
                  onClick={() =>
                    onSelectStatus(isSelected ? 'All' : item.status)
                  }
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-blue-600 text-white font-medium shadow-2xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.fillHex }}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {item.count}
                    </span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-slate-300 dark:text-blue-100' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      ({item.percentage}%)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {activeStatusFilter !== 'All' && (
            <button
              type="button"
              onClick={() => onSelectStatus('All')}
              className="mt-1 text-center py-1 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium cursor-pointer"
            >
              Reset filter (Show all {totalApplications})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
