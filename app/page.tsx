'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { ChapterDirectory } from '@/components/chapter-directory';
import { cn } from '@/lib/utils';
import { getModelHeadersInit } from '@/lib/client-model-storage';
import { STORAGE_PLAN, STORAGE_PROMPT } from '@/lib/storage-keys';
import type { LessonPlan } from '@/lib/lesson-plan-schema';
import {
  TEXTBOOK_DIRECTORY,
  TEXTBOOK_EDITION_LABEL,
  TEXTBOOK_SUBJECT,
  TEXTBOOK_VOLUME_LABEL,
  findDirNodePath,
} from '@/lib/textbook-directory';

function buildPlanPromptFromSelection(path: string[], extra: string): string {
  const loc = path.join(' › ');
  const edition = TEXTBOOK_EDITION_LABEL.replace(/\s*\(\s*2024\s*\)\s*/i, '·2024');
  const lines = [
    `教材：义务教育教科书 ${TEXTBOOK_SUBJECT} ${TEXTBOOK_VOLUME_LABEL}（${edition}）`,
    `备课定位：${loc}`,
    '',
    '教师补充说明（学情、本班课时、希望突出的重难点等）：',
    extra.trim() || '（无补充，请按常规新课 40–45 分钟设计。）',
  ];
  return lines.join('\n');
}

export default function HomePage() {
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(['ch7']));
  const [selectedId, setSelectedId] = useState<string | null>('ch7-s1');
  const [extraNotes, setExtraNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPath = useMemo(
    () => (selectedId ? findDirNodePath(TEXTBOOK_DIRECTORY, selectedId) : null),
    [selectedId],
  );

  const toggleChapter = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onSelectLeaf = useCallback((id: string) => {
    setSelectedId(id);
    setError(null);
  }, []);

  const onSubmit = async () => {
    if (!selectedId || !selectedPath?.length) {
      setError('请先在左侧章节目录中点选一节或条目');
      return;
    }
    const fullPrompt = buildPlanPromptFromSelection(selectedPath, extraNotes);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/lesson-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getModelHeadersInit(),
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `请求失败 ${res.status}`);
      }
      const plan = data.plan as LessonPlan;
      sessionStorage.setItem(STORAGE_PROMPT, fullPrompt);
      sessionStorage.setItem(STORAGE_PLAN, JSON.stringify(plan));
      router.push('/plan');
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start md:gap-10 md:py-12">
      <aside className="w-full shrink-0 md:sticky md:top-10 md:w-[320px]">
        <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-700">
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                {TEXTBOOK_EDITION_LABEL}
              </span>
              <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
            </div>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{TEXTBOOK_VOLUME_LABEL}</p>
          </div>
          <nav className="max-h-[min(70vh,560px)] overflow-y-auto px-2 pb-2 pt-1" aria-label="章节目录">
            <ChapterDirectory
              nodes={TEXTBOOK_DIRECTORY}
              expandedIds={expandedIds}
              onToggleChapter={toggleChapter}
              selectedId={selectedId}
              onSelectLeaf={onSelectLeaf}
            />
          </nav>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="mb-6">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">八下物理备课</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            备课思路
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            在左侧按教材目录选择本节位置，可补充学情与课时要求后生成「备课思路」；确认后再进入课件幻灯片。
          </p>
        </header>

        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="font-medium text-slate-700 dark:text-slate-200">当前选中</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            {selectedPath?.length ? selectedPath.join(' › ') : '未选择'}
          </p>
        </div>

        <label className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-300">
          补充说明（可选）
        </label>
        <textarea
          value={extraNotes}
          onChange={(e) => setExtraNotes(e.target.value)}
          rows={6}
          placeholder="例：学生已掌握力的概念；本课 40 分钟；需突出实验探究与作图规范……"
          className={cn(
            'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm',
            'text-slate-900 shadow-sm outline-none ring-emerald-500/15 focus:border-emerald-500 focus:ring-4',
            'dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100',
          )}
        />

        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={loading || !selectedId}
          onClick={onSubmit}
          className={cn(
            'mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white sm:w-auto',
            'bg-emerald-600 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          生成备课思路
        </button>
      </main>
    </div>
  );
}
