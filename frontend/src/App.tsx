import { useState, useEffect, useCallback } from 'react';
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getStoredUsername,
  setStoredUsername,
  getStoredUserId,
  setStoredUserId,
  api,
} from './services/api';
import { Job, JobStatus, UpdateProfileInput } from './types';
import { Login } from './components/Login';
import { Sidebar, ActivePage } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AnalyticsPage } from './components/AnalyticsPage';
import { EditProfileModal } from './components/EditProfileModal';

export default function App() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [username, setUsername] = useState<string | null>(() => getStoredUsername());
  const [activePage, setActivePage] = useState<ActivePage>('applications');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [targetStatusFilter, setTargetStatusFilter] = useState<JobStatus | 'All'>('All');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Sync token state on mount/changes
  useEffect(() => {
    const current = getStoredToken();
    setToken(current);
  }, []);

  // Fetch jobs once authenticated
  const fetchJobs = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setBackendError(null);
      const data = await api.getJobs();
      setJobs(data);
    } catch (err: any) {
      const message = err.message || 'Failed to load jobs from FastAPI server.';
      setBackendError(message);

      if (
        /session expired|unauthorized|expired|401/i.test(message)
      ) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchJobs();
    }
  }, [token, fetchJobs]);

  const normalizeUsername = (rawUsername: string) => {
    const trimmed = rawUsername?.trim();
    if (!trimmed) return '';
    return trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  };

  const handleLoginSuccess = (newToken: string, loggedInUsername: string) => {
    const normalized = normalizeUsername(loggedInUsername);
    setStoredToken(newToken);
    setStoredUsername(normalized);
    setToken(newToken);
    setUsername(normalized);
  };

  const handleLogout = () => {
    clearStoredToken();
    setToken(null);
    setUsername(null);
    setJobs([]);
    setBackendError(null);
  };

  const handleNavigateToApplications = (filterStatus?: JobStatus) => {
    if (filterStatus) {
      setTargetStatusFilter(filterStatus);
    }
    setActivePage('applications');
  };

  // Profile Edit & Account Deletion Handlers (scoped exclusively to the logged-in user)
  const handleUpdateProfile = async (data: UpdateProfileInput) => {
    const userId = getStoredUserId() || username || 'me';
    try {
      await api.updateUser(userId, {
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
      });
      if (data.username) {
        setStoredUsername(data.username);
        setUsername(data.username);
      }
    } catch (err: any) {
      // If server doesn't respond or has path variation, update local view gracefully
      if (data.username) {
        setStoredUsername(data.username);
        setUsername(data.username);
      }
      throw err;
    }
  };

  const handleDeleteAccount = async () => {
    const userId = getStoredUserId() || username || 'me';
    try {
      await api.deleteUser(userId);
    } catch (err: any) {
      // Continue to log out and clear user data even if backend returned an error
    } finally {
      handleLogout();
    }
  };

  // If not authenticated, show ONLY the clean Login/Register page
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // When authenticated, show the dashboard with left sidebar and main content area
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-row transition-colors">
      {/* Left Sidebar */}
      <Sidebar
        activePage={activePage}
        onChangePage={setActivePage}
        totalJobsCount={jobs.length}
        username={username}
        onLogout={handleLogout}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activePage === 'applications' ? (
          <Dashboard
            jobs={jobs}
            isLoading={isLoading}
            backendError={backendError}
            onRefreshJobs={fetchJobs}
            onJobsChange={setJobs}
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            isAddModalOpen={isAddModalOpen}
            setIsAddModalOpen={setIsAddModalOpen}
            onJobsCountChange={() => {}}
            initialStatusFilter={targetStatusFilter}
          />
        ) : (
          <AnalyticsPage
            jobs={jobs}
            isLoading={isLoading}
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            onNavigateToApplications={handleNavigateToApplications}
          />
        )}
      </div>

      {/* Edit Profile & Delete Account Modal for active user */}
      {username && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUsername={username}
          onUpdateProfile={handleUpdateProfile}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
}
