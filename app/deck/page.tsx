'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STORAGE_DECK, STORAGE_PLAN } from '@/lib/storage-keys';
import type { DeckSlide, LessonDeck } from '@/lib/lesson-plan-schema';
import { getDeckSlideTone, writeLessonDeckPptx, type DeckSlideTone } from '@/lib/export-lesson-pptx';
import { SlideMindMap } from '@/components/slide-mind-map';
import {
  deckPlaceholderImageUrl,
  getSlideSections,
  getSummaryMindMap,
  getSummarySectionsAfterMindMap,
  inferDeckSlideLayout,
} from '@/lib/deck-slide-content';

const bulletAccents = [
  'border-l-4 border-l-indigo-500 dark:border-l-indigo-400',
  'border-l-4 border-l-violet-500 dark:border-l-violet-400',
  'border-l-4 border-l-sky-500 dark:border-l-sky-400',
  'border-l-4 border-l-amber-500 dark:border-l-amber-400',
  'border-l-4 border-l-teal-500 dark:border-l-teal-400',
];

function SlideBody({
  slide,
  slideIndex,
  total,
  tone,
}: {
  slide: DeckSlide;
  slideIndex: number;
  total: number;
  tone: DeckSlideTone;
}) {
  const layout = inferDeckSlideLayout(slide, slideIndex, total);
  const sections = getSlideSections(slide);
  const imgUrl = deckPlaceholderImageUrl(slideIndex, slide.title);

  if (layout === 'cover') {
    return (
      <div className="relative">
        <div className="relative overflow-hidden rounded-b-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- 占位图外链，导出逻辑同源 */}
          <img src={imgUrl} alt="" className="aspect-[16/10] w-full object-cover sm:aspect-[16/9]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/25 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            <div className="flex flex-wrap gap-2">
              {slide.bullets
                .filter((b) => b.trim())
                .slice(0, 8)
                .map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/30 backdrop-blur-sm"
                  >
                    {b}
                  </span>
                ))}
            </div>
            {slide.imageCaption?.trim() && (
              <p className="mt-4 text-center text-xs text-white/75">{slide.imageCaption.trim()}</p>
            )}
          </div>
        </div>
        {sections.length > 0 && (
          <div className="grid gap-4 border-t border-slate-200/80 bg-white/95 p-5 sm:grid-cols-2 sm:p-6 dark:border-slate-700 dark:bg-slate-900/90">
            {sections.map((sec, i) => (
              <div
                key={`${sec.heading}-${i}`}
                className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm dark:border-slate-600 dark:from-slate-900 dark:to-slate-950"
              >
                <h4 className="text-xs font-bold tracking-wide text-indigo-700 dark:text-indigo-300">
                  {sec.heading}
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {sec.lines.map((l, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-indigo-500" aria-hidden />
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (layout === 'split') {
    return (
      <div className="relative grid gap-8 lg:grid-cols-2 lg:gap-10 lg:items-start">
        <div className="relative space-y-6 lg:pr-2">
          <div
            className="pointer-events-none absolute right-0 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent lg:block dark:via-slate-600"
            aria-hidden
          />
          {sections.map((sec, i) => (
            <section key={`${sec.heading}-${i}`} className={cn(i > 0 && 'border-t border-slate-200/90 pt-6 dark:border-slate-700')}>
              <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-200">
                <span className="h-1.5 w-7 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                {sec.heading}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {sec.lines.map((l, j) => (
                  <li
                    key={j}
                    className={cn(
                      'flex gap-3 rounded-r-xl bg-white/85 py-2.5 pl-3 pr-2 shadow-sm dark:bg-slate-900/60',
                      bulletAccents[j % bulletAccents.length],
                    )}
                  >
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white shadow"
                      style={{
                        background: `linear-gradient(135deg, #${tone.header}, #${tone.accent})`,
                      }}
                    >
                      {j + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">{l}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <div
            className="overflow-hidden rounded-2xl ring-2 ring-white shadow-2xl dark:ring-slate-700"
            style={{ boxShadow: `0 24px 48px -16px #${tone.header}66` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl} alt="" className="aspect-video w-full object-cover" />
          </div>
          {slide.imageCaption?.trim() && (
            <p className="text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {slide.imageCaption.trim()}
            </p>
          )}
          <div className="rounded-xl border border-dashed border-indigo-200/80 bg-indigo-50/60 px-4 py-3 text-xs text-indigo-950 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-100">
            <p className="font-semibold text-indigo-800 dark:text-indigo-200">关键词速览</p>
            <p className="mt-1.5 leading-relaxed opacity-90">
              {slide.bullets.filter(Boolean).join(' · ') || '（可与左侧板块对照）'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'layers') {
    return (
      <div className="space-y-5">
        {sections.map((sec, i) => (
          <article
            key={`${sec.heading}-${i}`}
            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900/90"
          >
            <div
              className="border-b border-white/20 px-4 py-2.5 text-sm font-bold text-white"
              style={{
                background: `linear-gradient(90deg, #${tone.header}, #${tone.accent})`,
              }}
            >
              {sec.heading}
            </div>
            <ul className="space-y-2.5 px-4 py-4 sm:px-5">
              {sec.lines.map((l, j) => (
                <li key={j} className="flex gap-3 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden />
                  {l}
                </li>
              ))}
            </ul>
          </article>
        ))}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
          <span className="font-semibold">课堂提要：</span>
          {slide.bullets.filter(Boolean).join(' · ')}
        </div>
      </div>
    );
  }

  if (layout === 'summary') {
    const mm = getSummaryMindMap(slide);
    const hasModelMindMap = Boolean(
      slide.mindMap?.center?.trim() && (slide.mindMap.branches?.length ?? 0) >= 2,
    );
    const sectionsBelow = getSummarySectionsAfterMindMap(slide, hasModelMindMap);
    const gradId = `mm-${tone.header}-${tone.accent}-${slideIndex}`;

    if (!mm) {
      return (
        <div className="mx-auto max-w-3xl rounded-2xl border-2 border-teal-400/70 bg-gradient-to-br from-teal-50 via-emerald-50/90 to-cyan-50 p-6 shadow-inner sm:p-8 dark:border-teal-700 dark:from-teal-950/40 dark:via-slate-900 dark:to-emerald-950/30">
          {sections.map((sec, i) => (
            <div
              key={`${sec.heading}-${i}`}
              className={cn(i > 0 && 'mt-6 border-t border-teal-200/70 pt-6 dark:border-teal-800')}
            >
              <h3 className="text-base font-bold text-teal-900 dark:text-teal-200">{sec.heading}</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-teal-950 dark:text-teal-50">
                {sec.lines.map((l, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="font-bold text-teal-500">◆</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border-2 border-teal-400/70 bg-gradient-to-br from-teal-50 via-emerald-50/90 to-cyan-50 p-6 shadow-inner sm:p-8 dark:border-teal-700 dark:from-teal-950/40 dark:via-slate-900 dark:to-emerald-950/30">
        <div className="overflow-hidden rounded-xl border border-teal-300/60 bg-white/95 p-3 shadow-sm dark:border-teal-700 dark:bg-slate-900/85">
          <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-teal-800 dark:text-teal-200">知识网络</p>
          <SlideMindMap mindMap={mm} tone={tone} gradId={gradId} />
        </div>
        {sectionsBelow.map((sec, i) => (
          <div
            key={`${sec.heading}-${i}`}
            className={cn(i > 0 && 'border-t border-teal-200/70 pt-6 dark:border-teal-800')}
          >
            <h3 className="text-base font-bold text-teal-900 dark:text-teal-200">{sec.heading}</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-teal-950 dark:text-teal-50">
              {sec.lines.map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span className="font-bold text-teal-500">◆</span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  /* standard */
  return (
    <ul className="relative space-y-4">
      {slide.bullets.map((b, i) => (
        <li
          key={i}
          className={cn(
            'flex gap-4 rounded-r-xl bg-white/70 py-3 pl-4 pr-3 shadow-sm backdrop-blur-sm dark:bg-slate-900/50',
            bulletAccents[i % bulletAccents.length],
          )}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, #${tone.header}, #${tone.accent})`,
            }}
          >
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">{b}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DeckPage() {
  const [deck, setDeck] = useState<LessonDeck | null>(null);
  const [title, setTitle] = useState('课件');
  const [idx, setIdx] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_DECK);
    const planRaw = sessionStorage.getItem(STORAGE_PLAN);
    if (planRaw) {
      try {
        const p = JSON.parse(planRaw) as { lessonTitle?: string };
        if (p.lessonTitle) setTitle(p.lessonTitle);
      } catch {
        /* ignore */
      }
    }
    if (!raw) {
      setDeck(null);
      return;
    }
    try {
      setDeck(JSON.parse(raw) as LessonDeck);
    } catch {
      setDeck(null);
    }
  }, []);

  const total = deck?.slides.length ?? 0;
  const slide = deck?.slides[idx];
  const tone = useMemo(() => getDeckSlideTone(idx, total), [idx, total]);

  const exportPptx = async () => {
    if (!deck?.slides.length) return;
    setExporting(true);
    try {
      await writeLessonDeckPptx(deck, title);
    } finally {
      setExporting(false);
    }
  };

  if (!deck) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-slate-600 dark:text-slate-400">未找到课件数据。请先在备课思路页确认生成。</p>
          <Link
            href="/plan"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            返回备课思路
          </Link>
        </div>
      </div>
    );
  }

  if (!slide) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-slate-100 via-indigo-50/40 to-violet-100/50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-800 shadow-sm ring-1 ring-indigo-200/60 dark:bg-slate-900/80 dark:text-indigo-200 dark:ring-indigo-800/50">
              <Sparkles className="size-3.5" aria-hidden />
              第三步 · 课件预览
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              共 {total} 页 · 分栏、板块与配图区与导出 PPTX 一致（配图为占位图）
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/plan"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              返回编辑思路
            </Link>
            <button
              type="button"
              disabled={exporting}
              onClick={() => void exportPptx()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
            >
              {exporting ? <Loader2 className="size-4 animate-spin shrink-0" /> : <Download className="size-4 shrink-0" />}
              {exporting ? '导出中…' : '下载 PPTX'}
            </button>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-indigo-950/10 ring-1 ring-slate-200/40 dark:border-slate-700 dark:bg-slate-950 dark:ring-slate-700/60">
          <div
            className="relative px-6 pb-5 pt-6 text-white sm:px-8 sm:pb-6 sm:pt-7"
            style={{ backgroundColor: `#${tone.header}` }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 20%, #fff 0, transparent 45%), radial-gradient(circle at 80% 0%, #fff 0, transparent 35%)`,
              }}
            />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide text-white ring-1 ring-white/40 backdrop-blur-sm">
                {tone.tag}
              </span>
              <p className="text-xs font-medium text-white/80 tabular-nums">
                第 {idx + 1} / {total} 页
              </p>
            </div>
            <h2 className="relative mt-4 text-balance text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
              {slide.title}
            </h2>
            {slide.subtitle?.trim() && (
              <p className="relative mt-2 max-w-2xl text-sm leading-relaxed text-indigo-100/95">{slide.subtitle.trim()}</p>
            )}
            <div
              className="relative mt-5 h-1 w-full max-w-xs rounded-full sm:max-w-sm"
              style={{ backgroundColor: `#${tone.accent}` }}
              aria-hidden
            />
          </div>

          <div
            className="relative border-t border-white/10 px-4 py-6 sm:px-8 sm:py-9"
            style={{
              background: `linear-gradient(165deg, #f8fafc 0%, #eef2ff 38%, #faf5ff 100%)`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative">
              <SlideBody slide={slide} slideIndex={idx} total={total} tone={tone} />
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex justify-center gap-1.5 sm:justify-start">
              {deck.slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`转到第 ${i + 1} 页`}
                  onClick={() => setIdx(i)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    i === idx ? 'w-8 bg-indigo-600 dark:bg-indigo-400' : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600',
                  )}
                />
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <button
                type="button"
                disabled={idx <= 0}
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium sm:flex-initial',
                  idx <= 0
                    ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
                )}
              >
                <ChevronLeft className="size-4 shrink-0" />
                上一页
              </button>
              <button
                type="button"
                disabled={idx >= total - 1}
                onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium sm:flex-initial',
                  idx >= total - 1
                    ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400',
                )}
              >
                下一页
                <ChevronRight className="size-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
