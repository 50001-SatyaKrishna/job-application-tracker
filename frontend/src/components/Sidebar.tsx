import React, { useState, useRef, useEffect } from 'react';
import {
  TableProperties,
  BarChart2,
  LogOut,
  X,
  User,
  ChevronUp,
  Settings,
  Trash2,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export type ActivePage = 'applications' | 'analytics';

interface SidebarProps {
  activePage: ActivePage;
  onChangePage: (page: ActivePage) => void;
  totalJobsCount: number;
  username: string | null;
  onLogout: () => void;
  onOpenEditProfile: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onChangePage,
  totalJobsCount,
  username,
  onLogout,
  onOpenEditProfile,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popup menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-56 sm:w-60 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="h-14 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                JobTracker
              </span>
            </div>
            {/* Close button on mobile */}
            <button
              onClick={onCloseMobile}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-1">
            <button
              type="button"
              onClick={() => {
                onChangePage('applications');
                if (isMobileOpen) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activePage === 'applications'
                  ? 'text-slate-900 bg-slate-100 dark:text-white dark:bg-slate-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TableProperties className={`w-4 h-4 ${activePage === 'applications' ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`} />
                <span>Applications</span>
              </div>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                {totalJobsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onChangePage('analytics');
                if (isMobileOpen) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activePage === 'analytics'
                  ? 'text-slate-900 bg-slate-100 dark:text-white dark:bg-slate-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart2 className={`w-4 h-4 ${activePage === 'analytics' ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`} />
                <span>Analytics & Charts</span>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Section with Theme Toggle & Integrated User Profile */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {/* Theme Toggle in Sidebar */}
          <div className="pb-0.5">
            <ThemeToggle variant="sidebar" />
          </div>

          {/* Interactive Profile Section with Integrated Edit, Delete & Logout */}
          {username && (
            <div ref={menuRef} className="relative">
              {/* Flyout Menu (shows when profile section is clicked) */}
              {isMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 space-y-0.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
                      Signed in as
                    </p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      @{username}
                    </p>
                  </div>

                  {/* Edit Profile Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenEditProfile();
                      if (isMobileOpen) onCloseMobile();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Edit Profile</span>
                  </button>

                  {/* Delete Profile Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenEditProfile();
                      if (isMobileOpen) onCloseMobile();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete Profile</span>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  {/* Logout Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Log out</span>
                  </button>
                </div>
              )}

              {/* Profile Card Button (incorporating the username and actions) */}
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isMenuOpen
                    ? 'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                }`}
                title="Account options: Edit, Delete, Log out"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {username}
                    </span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500">
                      Account options
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-slate-400 ml-1">
                  <ChevronUp
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isMenuOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
