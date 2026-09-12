import React, { useState } from 'react';
import { Job, JobStatus } from '../types';
import { StatusOverviewChart } from './StatusOverviewChart';
import { ThemeToggle } from './ThemeToggle';
import {
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  Award,
  Clock,
  Briefcase,
  ArrowRight,
  Menu,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

interface AnalyticsPageProps {
  jobs: Job[];
  isLoading: boolean;
  onToggleSidebar: () => void;
  onNavigateToApplications: (filterStatus?: JobStatus) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  jobs,
  isLoading,
  onToggleSidebar,
  onNavigateToApplications,
}) => {
  const [activeStatusFilter, setActiveStatusFilter] = useState<JobStatus | 'All'>('All');

  const total = jobs.length;
  const applied = jobs.filter((j) => j.status === 'Applied').length;
  const interviewing = jobs.filter((j) => j.status === 'Interviewing').length;
  const offered = jobs.filter((j) => j.status === 'Offered').length;
  const accepted = jobs.filter((j) => j.status === 'Accepted').length;
  const rejected = jobs.filter((j) => j.status === 'Rejected').length;
  const withdrawn = jobs.filter((j) => j.status === 'Withdrawn').length;

  const totalOffers = offered + accepted;
  const offerRate = total > 0 ? Math.round((totalOffers / total) * 100) : 0;
  const interviewRate = total > 0 ? Math.round(((interviewing + totalOffers) / total) * 100) : 0;

  // Round progression distribution
  const roundCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  jobs.forEach((j) => {
    const r = j.current_round || 1;
    if (r >= 5) roundCounts[5] = (roundCounts[5] || 0) + 1;
    else roundCounts[r] = (roundCounts[r] || 0) + 1;
  });

  const roundData = [
    { round: 'Round 1', count: roundCounts[1] || 0, label: 'Screening / Initial' },
    { round: 'Round 2', count: roundCounts[2] || 0, label: 'Technical / Case' },
    { round: 'Round 3', count: roundCounts[3] || 0, label: 'System / Team' },
    { round: 'Round 4', count: roundCounts[4] || 0, label: 'Final / Exec' },
    { round: 'Round 5+', count: roundCounts[5] || 0, label: 'Offer / Extended' },
  ];

  return (
    <div className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 md:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <h1 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
              Pipeline Analytics & Visualization
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle variant="pill" />
          <button
            type="button"
            onClick={() => onNavigateToApplications()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <span>View Applications Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Applications</span>
              <Briefcase className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {total}
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">All submitted applications</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-sky-700 dark:text-sky-400">In Interview Loops</span>
              <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-sky-950 dark:text-sky-200 tracking-tight">
              {interviewing}
            </div>
            <p className="mt-1 text-[11px] text-sky-600 dark:text-sky-400 font-medium">
              {interviewRate}% progression rate
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Offers Received</span>
              <Award className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-950 dark:text-emerald-200 tracking-tight">
              {totalOffers}
            </div>
            <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {offerRate}% conversion rate
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-teal-700 dark:text-teal-400">Accepted Offers</span>
              <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-teal-950 dark:text-teal-200 tracking-tight">
              {accepted}
            </div>
            <p className="mt-1 text-[11px] text-teal-600 dark:text-teal-400 font-medium">Final decisions</p>
          </div>
        </div>

        {/* Primary Status Overview Chart Component */}
        <StatusOverviewChart
          jobs={jobs}
          activeStatusFilter={activeStatusFilter}
          onSelectStatus={(st) => {
            setActiveStatusFilter(st);
            if (st !== 'All') {
              onNavigateToApplications(st);
            }
          }}
        />

        {/* Secondary Rounds Breakdown Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 sm:p-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                Interview Round Progression
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Number of applications currently in each interview stage
              </p>
            </div>
          </div>

          <div className="pt-5 h-56 sm:h-64 w-full">
            {total === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                No application data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={roundData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="round"
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
                            <div className="font-semibold">{item.round}</div>
                            <div className="text-slate-300 dark:text-slate-400">{item.label}</div>
                            <div className="mt-1 font-mono text-emerald-400">
                              {item.count} application{item.count === 1 ? '' : 's'}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
