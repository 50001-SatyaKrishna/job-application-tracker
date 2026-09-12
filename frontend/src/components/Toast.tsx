import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg border text-sm shadow-md transition-all duration-200 bg-white dark:bg-slate-800 ${
            toast.type === 'success'
              ? 'border-emerald-200 dark:border-emerald-800/80 text-slate-800 dark:text-slate-100'
              : toast.type === 'error'
              ? 'border-rose-200 dark:border-rose-800/80 text-slate-800 dark:text-slate-100'
              : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
          }`}
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          )}
          {toast.type === 'info' && (
            <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-snug break-words">
            {toast.text}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
