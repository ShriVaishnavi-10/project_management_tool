'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label = 'Loading workspace data...' }: LoadingSpinnerProps) {
  return (
    <div className="py-12 px-6 flex flex-col items-center justify-center space-y-3 text-center w-full col-span-full">
      <div className="skeuo-badge p-3.5 rounded-2xl bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700 shadow-sm">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 animate-pulse">
        {label}
      </p>
    </div>
  );
}
