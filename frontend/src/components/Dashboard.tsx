import React, { useState, useEffect, useCallback } from 'react';
import { Job, JobStatus } from '../types';
import { api } from '../services/api';
import { SummaryCards } from './SummaryCards';
import { JobTable } from './JobTable';
import { AddJobModal } from './AddJobModal';
import { ToastContainer, ToastMessage } from './Toast';
import { Plus, RefreshCw, AlertCircle, Menu, Download } from 'lucide-react';
import { exportJobsToCsv } from '../utils/csvExport';
import { CurrencyCode, loadTableState, saveTableState } from '../utils/tableStorage';
import { ThemeToggle } from './ThemeToggle';

interface DashboardProps {
  jobs: Job[];
  isLoading: boolean;
  backendError: string | null;
  onRefreshJobs: () => void;
  onJobsChange: (jobs: Job[]) => void;
  onToggleSidebar: () => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  onJobsCountChange: (count: number) => void;
  initialStatusFilter?: JobStatus | 'All';
}

export const Dashboard: React.FC<DashboardProps> = ({
  jobs,
  isLoading,
  backendError,
  onRefreshJobs,
  onJobsChange,
  onToggleSidebar,
  isAddModalOpen,
  setIsAddModalOpen,
  onJobsCountChange,
  initialStatusFilter = 'All',
}) => {
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'All'>(() => {
    if (initialStatusFilter && initialStatusFilter !== 'All') {
      return initialStatusFilter;
    }
    const saved = loadTableState();
    return saved.statusFilter || initialStatusFilter || 'All';
  });
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(() => {
    const saved = loadTableState();
    return saved.currencyCode || 'INR';
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  useEffect(() => {
    saveTableState({ currencyCode });
  }, [currencyCode]);

  const addToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = String(Date.now()) + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Update a single job field via PATCH /jobs/{job_id}
  const handleUpdateJob = async (jobId: string | number, field: keyof Job, value: any) => {
    const previousJobs = [...jobs];
    
    // Optimistic update in state for instant UI responsiveness
    const nextJobs = jobs.map((j) => (j.id === jobId ? { ...j, [field]: value } : j));
    onJobsChange(nextJobs);

    try {
      const updatedJob = await api.updateJob(jobId, { [field]: value });
      const finalJobs = nextJobs.map((j) => (j.id === jobId ? updatedJob : j));
      onJobsChange(finalJobs);
      addToast('success', 'Application updated.');
    } catch (err: any) {
      // Rollback on failure
      onJobsChange(previousJobs);
      addToast('error', `Failed to update: ${err.message}`);
      throw err;
    }
  };

  // Create new job via POST /jobs/
  const handleCreateJob = async (jobData: Partial<Job>) => {
    try {
      const created = await api.createJob(jobData);
      const next = [created, ...jobs];
      onJobsChange(next);
      onJobsCountChange(next.length);
      addToast('success', `Added ${created.job_title || 'job application'}.`);
    } catch (err: any) {
      addToast('error', `Failed to add job: ${err.message}`);
      throw err;
    }
  };

  // Delete job via DELETE /jobs/{job_id}
  const handleDeleteJob = async (jobId: string | number) => {
    const previousJobs = [...jobs];
    const next = jobs.filter((j) => j.id !== jobId);
    onJobsChange(next);
    onJobsCountChange(next.length);

    try {
      await api.deleteJob(jobId);
      addToast('info', 'Application deleted.');
    } catch (err: any) {
      onJobsChange(previousJobs);
      onJobsCountChange(previousJobs.length);
      addToast('error', `Failed to delete: ${err.message}`);
      throw err;
    }
  };

  // Export current applications list to CSV
  const handleExportCsv = () => {
    try {
      if (jobs.length === 0) {
        addToast('info', 'No applications to export yet.');
        return;
      }
      exportJobsToCsv(jobs, 'job_applications', currencyCode);
      addToast('success', `Exported ${jobs.length} applications to CSV.`);
    } catch (err: any) {
      addToast('error', `Export failed: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 md:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">
              Applications
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle variant="pill" />

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={jobs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download applications as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export to CSV</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              FastAPI Connected
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Job Applications Tracker
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any cell to edit directly in place. Changes sync with your backend.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshJobs}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Application</span>
            </button>
          </div>
        </div>

        {/* Backend Connection Warning / Error Banner */}
        {backendError && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Notice: </span>
                <span>{backendError}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={onRefreshJobs}
                className="px-2.5 py-1.5 bg-amber-900 dark:bg-amber-700 text-white rounded-md font-medium text-xs hover:bg-amber-800 dark:hover:bg-amber-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Status Summary Cards */}
        <SummaryCards
          jobs={jobs}
          activeStatusFilter={statusFilter}
          onSelectStatus={setStatusFilter}
        />

        {/* Large Spreadsheet-style Job Table */}
        <JobTable
          jobs={jobs}
          isLoading={isLoading}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onUpdateJob={handleUpdateJob}
          onDeleteJob={handleDeleteJob}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          currencyCode={currencyCode}
          onCurrencyChange={setCurrencyCode}
        />
      </main>

      {/* Add Job Modal */}
      <AddJobModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateJob}
        currencyCode={currencyCode}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
