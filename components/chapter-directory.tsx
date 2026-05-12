'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TextbookDirNode } from '@/lib/textbook-directory';
import { isChapterNode } from '@/lib/textbook-directory';

type Props = {
  nodes: TextbookDirNode[];
  expandedIds: ReadonlySet<string>;
  onToggleChapter: (id: string) => void;
  selectedId: string | null;
  onSelectLeaf: (id: string) => void;
  depth?: number;
};

export function ChapterDirectory({
  nodes,
  expandedIds,
  onToggleChapter,
  selectedId,
  onSelectLeaf,
  depth = 0,
}: Props) {
  return (
    <ul className={cn('list-none', depth === 0 ? 'py-1' : 'pb-0')}>
      {nodes.map((node) => {
        const chapter = isChapterNode(node);
        const open = chapter && expandedIds.has(node.id);

        if (!chapter) {
          const active = selectedId === node.id;
          return (
            <li key={node.id}>
              <button
                type="button"
                onClick={() => onSelectLeaf(node.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md py-2.5 pr-3 text-left text-[15px] leading-snug transition-colors',
                  depth > 0 && 'pl-[2.15rem]',
                  active
                    ? 'bg-emerald-100 font-medium text-emerald-950'
                    : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                <span className="inline-block w-4 shrink-0" aria-hidden />
                <span>{node.label}</span>
              </button>
            </li>
          );
        }

        return (
          <li key={node.id} className="select-none">
            <button
              type="button"
              onClick={() => onToggleChapter(node.id)}
              className="flex w-full items-center gap-1.5 rounded-md py-2.5 pr-3 text-left text-[15px] font-normal text-slate-700 hover:bg-slate-50"
            >
              <span className="inline-flex w-6 shrink-0 items-center justify-center text-slate-400">
                {open ? <ChevronDown className="size-4" strokeWidth={2} /> : <ChevronRight className="size-4" strokeWidth={2} />}
              </span>
              <span>{node.label}</span>
            </button>
            {open && node.children && (
              <ChapterDirectory
                nodes={node.children}
                expandedIds={expandedIds}
                onToggleChapter={onToggleChapter}
                selectedId={selectedId}
                onSelectLeaf={onSelectLeaf}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
