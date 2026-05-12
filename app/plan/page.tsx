'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookMarked,
  Clock,
  Lightbulb,
  ListOrdered,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getModelHeadersInit } from '@/lib/client-model-storage';
import { STORAGE_PLAN, STORAGE_DECK } from '@/lib/storage-keys';
import type { LessonPlan, LessonSegment } from '@/lib/lesson-plan-schema';

const fieldClass = cn(
  'w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-[15px] leading-relaxed text-slate-900',
  'shadow-sm shadow-slate-100/80 transition-[border-color,box-shadow]',
  'placeholder:text-slate-400',
  'focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15',
  'dark:border-slate-600 dark:bg-slate-950/80 dark:text-slate-100 dark:shadow-none',
  'dark:focus:border-indigo-500 dark:focus:ring-indigo-400/20',
);

const labelClass =
  'text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100';

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur-sm',
        'dark:border-slate-700/80 dark:bg-slate-900/60',
        className,
      )}
    >
      {children}
    </section>
  );
}

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loadingDeck, setLoadingDeck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_PLAN);
    if (!raw) {
      setPlan(null);
      return;
    }
    try {
      setPlan(JSON.parse(raw) as LessonPlan);
    } catch {
      setPlan(null);
    }
  }, []);

  const updateSegment = (i: number, patch: Partial<LessonSegment>) => {
    setPlan((p) => {
      if (!p) return p;
      const segments = [...p.segments];
      segments[i] = { ...segments[i], ...patch };
      return { ...p, segments };
    });
  };

  const onConfirmDeck = async () => {
    if (!plan?.lessonTitle.trim()) {
      setError('请填写课题标题');
      return;
    }
    setError(null);
    setLoadingDeck(true);
    try {
      sessionStorage.setItem(STORAGE_PLAN, JSON.stringify(plan));
      const res = await fetch('/api/lesson-deck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getModelHeadersInit(),
        },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `生成课件失败 ${res.status}`);
      }
      sessionStorage.setItem(STORAGE_DECK, JSON.stringify(data.deck));
      router.push('/deck');
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setLoadingDeck(false);
    }
  };

  if (plan === null) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-slate-600 dark:text-slate-400">未找到备课思路，请从首页开始。</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 pb-28 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-5 sm:py-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm transition-colors hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:text-indigo-300"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          上一步 · 修改提示词
        </Link>

        <header className="mt-8 text-balance">
          <p className="inline-flex items-center gap-2 rounded-full bg-indigo-100/90 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-200">
            <span className="font-mono text-[11px] tabular-nums text-indigo-600 dark:text-indigo-300">步骤 2</span>
            备课思路
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            第二步：备课思路
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
            可直接编辑下列内容；确认后将按此思路生成本节课课件幻灯片。
          </p>
        </header>

        <div className="mt-8 flex flex-col gap-5 sm:gap-6">
          <SectionCard>
            <div className="mb-4 flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <BookMarked className="size-5 shrink-0 opacity-90" aria-hidden />
              <h2 className="text-base font-bold">基础信息</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="lesson-title" className={labelClass}>
                  课题
                </label>
                <input
                  id="lesson-title"
                  value={plan.lessonTitle}
                  onChange={(e) => setPlan({ ...plan, lessonTitle: e.target.value })}
                  className={cn(fieldClass, 'mt-2')}
                />
              </div>
              <div>
                <label htmlFor="grade-scope" className={labelClass}>
                  范围
                </label>
                <input
                  id="grade-scope"
                  value={plan.gradeScope}
                  onChange={(e) => setPlan({ ...plan, gradeScope: e.target.value })}
                  className={cn(fieldClass, 'mt-2')}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard className="border-l-[3px] border-l-amber-400 dark:border-l-amber-500">
            <div className="mb-1 flex items-start gap-2">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">教学重点</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  本节课学生需要掌握的核心知识；条数由生成结果决定，可在各框内直接修改。
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {plan.keyPoints.map((k, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-800 tabular-nums dark:bg-amber-950/50 dark:text-amber-200"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <input
                    aria-label={`重点 ${i + 1}`}
                    value={k}
                    onChange={(e) => {
                      const keyPoints = [...plan.keyPoints];
                      keyPoints[i] = e.target.value;
                      setPlan({ ...plan, keyPoints });
                    }}
                    className={cn(fieldClass, 'min-w-0 flex-1')}
                  />
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard className="border-l-[3px] border-l-violet-500 dark:border-l-violet-400">
            <div className="mb-1 flex items-start gap-2">
              <ListOrdered className="mt-0.5 size-5 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">教学要点</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  展开教学时的关键细节与逻辑线索，与「重点」配合使用
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {plan.essentials.map((k, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-800 tabular-nums dark:bg-violet-950/50 dark:text-violet-200"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <input
                    aria-label={`要点 ${i + 1}`}
                    value={k}
                    onChange={(e) => {
                      const essentials = [...plan.essentials];
                      essentials[i] = e.target.value;
                      setPlan({ ...plan, essentials });
                    }}
                    className={cn(fieldClass, 'min-w-0 flex-1')}
                  />
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard>
            <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <Clock className="size-5 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden />
              <h2 className="text-base font-bold">环节与时长</h2>
            </div>
            <div className="space-y-4">
              {plan.segments.map((seg, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-600 dark:bg-slate-950/40"
                >
                  <div className="flex flex-wrap items-center gap-2 gap-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      环节 {i + 1}
                    </span>
                    <input
                      placeholder="环节名称"
                      value={seg.title}
                      onChange={(e) => updateSegment(i, { title: e.target.value })}
                      className={cn(fieldClass, 'min-w-[140px] flex-1 py-2 text-sm')}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        className={cn(fieldClass, 'w-20 py-2 text-center text-sm tabular-nums')}
                        value={seg.durationMinutes}
                        onChange={(e) =>
                          updateSegment(i, { durationMinutes: Math.max(1, Number(e.target.value) || 1) })
                        }
                        aria-label={`环节 ${i + 1} 时长（分钟）`}
                      />
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">分钟</span>
                    </div>
                  </div>
                  <label className="mt-3 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    活动说明（每行一条）
                  </label>
                  <textarea
                    placeholder={'例如：复习提问\n小组探究…'}
                    value={seg.activities.join('\n')}
                    onChange={(e) =>
                      updateSegment(i, {
                        activities: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    rows={3}
                    className={cn(fieldClass, 'mt-1.5 resize-y text-sm')}
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-200"
          >
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="order-2 text-center text-sm font-medium text-slate-500 underline-offset-4 hover:text-indigo-600 hover:underline sm:order-1 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            返回首页重新填写
          </Link>
          <button
            type="button"
            disabled={loadingDeck}
            onClick={onConfirmDeck}
            className={cn(
              'order-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 hover:shadow-indigo-500/30',
              'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
              'sm:order-2 sm:w-auto sm:min-w-[240px]',
            )}
          >
            {loadingDeck ? (
              <>
                <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
                正在生成课件…
              </>
            ) : (
              <>
                <Sparkles className="size-4 shrink-0 opacity-90" aria-hidden />
                确认并生成本节课课件
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
