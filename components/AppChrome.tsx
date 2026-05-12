'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { ModelSettingsDialog } from '@/components/ModelSettingsDialog';

export function AppChrome({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 bg-[var(--card)]/95 px-4 backdrop-blur-md dark:border-slate-700/90">
        <Link
          href="/"
          className="truncate text-sm font-semibold tracking-tight text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
        >
          八下物理备课
        </Link>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 p-2 text-slate-600 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:text-indigo-300"
          aria-label="打开设置"
        >
          <Settings className="size-[18px]" />
        </button>
      </header>
      <ModelSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      {children}
    </>
  );
}
