import type { DeckMindMap, DeckSlide, DeckSlideLayout } from '@/lib/lesson-plan-schema';

export type { DeckSlideLayout };

/** 占位配图（与课题/页码绑定，便于稳定加载） */
export function deckPlaceholderImageUrl(slideIndex: number, title: string): string {
  const seed = `${slideIndex}-${title}`.replace(/\s+/g, '-').slice(0, 64);
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/960/540`;
}

export function getSlideSections(slide: DeckSlide): { heading: string; lines: string[] }[] {
  if (slide.sections && slide.sections.length > 0) {
    return slide.sections.map((s) => ({
      heading: s.heading,
      lines: s.lines.filter((l) => l.trim().length > 0),
    }));
  }
  const lines = slide.bullets.filter((b) => b.trim().length > 0);
  if (lines.length === 0) return [{ heading: '要点', lines: ['（暂无内容）'] }];
  return [{ heading: '主要内容', lines }];
}

export function inferDeckSlideLayout(slide: DeckSlide, index: number, total: number): DeckSlideLayout {
  if (slide.layout === 'standard') return 'standard';
  if (slide.layout) return slide.layout;
  if (index === 0) return 'cover';
  if (index === total - 1) return 'summary';
  const n = slide.sections?.length ?? 0;
  if (n >= 3) return 'layers';
  return 'split';
}

/** 小结页用于绘制的思维导图数据：优先模型 mindMap，否则由 sections/bullets 合成 */
export function getSummaryMindMap(slide: DeckSlide): DeckMindMap | null {
  const raw = slide.mindMap;
  if (raw?.center?.trim() && (raw.branches?.length ?? 0) >= 2) {
    const branches = (raw.branches ?? [])
      .map((b) => ({
        label: b.label.trim(),
        items: b.items?.map((t) => t.trim()).filter((t) => t.length > 0),
      }))
      .filter((b) => b.label.length > 0);
    if (branches.length < 2) return null;
    return { center: raw.center.trim(), branches };
  }

  const sections = getSlideSections(slide);
  const lines = sections.flatMap((s) => s.lines).map((l) => l.trim()).filter((l) => l.length > 0);
  const bullets = slide.bullets.map((b) => b.trim()).filter(Boolean);
  const merged = [...lines, ...bullets.filter((b) => !lines.includes(b))];
  if (merged.length < 2) return null;

  const center =
    (slide.title?.trim() && slide.title.trim().slice(0, 40)) ||
    sections[0]?.heading?.trim()?.slice(0, 40) ||
    '本课知识结构';

  return {
    center,
    branches: merged.slice(0, 7).map((label) => ({ label: label.slice(0, 80) })),
  };
}

/** 小结页在已展示 mindMap 时，避免与「知识网络」板块文案重复 */
export function getSummarySectionsAfterMindMap(slide: DeckSlide, hasModelMindMap: boolean): ReturnType<
  typeof getSlideSections
> {
  const sections = getSlideSections(slide);
  if (!hasModelMindMap) return sections;
  if (sections.length === 0) return sections;
  const first = sections[0];
  if (first?.heading?.includes('知识网络')) {
    return sections.slice(1);
  }
  return sections;
}
