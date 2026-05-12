import type { DeckMindMap } from '@/lib/lesson-plan-schema';

export type MindMapBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  items: string[];
};

export type MindMapLayout = {
  viewW: number;
  viewH: number;
  root: MindMapBox;
  branches: MindMapBox[];
  connectors: Array<{ x1: number; y1: number; x2: number; y2: number }>;
};

const MAX_LABEL = 40;
const MAX_ITEM = 30;

export function truncateMindMapText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** 布局坐标系：viewBox 宽 viewW、高 viewH（与 SVG 一致） */
export function layoutMindMap(mm: DeckMindMap, viewW = 1000, viewH = 360): MindMapLayout {
  const pad = 36;
  const rootW = Math.min(200, viewW * 0.22);
  const rootH = 58;
  const rootX = pad;
  const rootY = viewH / 2 - rootH / 2;

  const branchesIn = mm.branches.map((b) => ({
    label: truncateMindMapText(b.label, MAX_LABEL),
    items: (b.items ?? []).map((it) => truncateMindMapText(it, MAX_ITEM)).filter(Boolean).slice(0, 4),
  }));

  const branchW = viewW - rootX - rootW - pad - 28;
  const heights = branchesIn.map((b) => {
    const itemH = Math.min(b.items.length, 4) * 17;
    return 30 + itemH + 8;
  });
  const totalBranchH = heights.reduce((a, b) => a + b, 0);
  const n = branchesIn.length;
  const gap = Math.max(14, (viewH - 2 * pad - totalBranchH) / Math.max(1, n + 1));

  let y = pad + gap;
  const branches: MindMapBox[] = branchesIn.map((b, i) => {
    const h = heights[i];
    const box: MindMapBox = {
      x: rootX + rootW + 32,
      y,
      w: branchW,
      h,
      text: b.label,
      items: b.items,
    };
    y += h + gap;
    return box;
  });

  const hubX = rootX + rootW;
  const hubY = rootY + rootH / 2;
  const connectors = branches.map((bb) => ({
    x1: hubX,
    y1: hubY,
    x2: bb.x,
    y2: bb.y + bb.h / 2,
  }));

  return {
    viewW,
    viewH,
    root: {
      x: rootX,
      y: rootY,
      w: rootW,
      h: rootH,
      text: truncateMindMapText(mm.center, 28),
      items: [],
    },
    branches,
    connectors,
  };
}

export function scaleLayoutToPptx(L: MindMapLayout, originX: number, originY: number, areaW: number, areaH: number) {
  const sx = areaW / L.viewW;
  const sy = areaH / L.viewH;
  const map = (x: number, y: number) => ({
    x: originX + x * sx,
    y: originY + y * sy,
  });
  const mapBox = (b: MindMapBox) => {
    const p = map(b.x, b.y);
    return { ...p, w: b.w * sx, h: b.h * sy, text: b.text, items: b.items };
  };
  return {
    root: mapBox(L.root),
    branches: L.branches.map(mapBox),
    connectors: L.connectors.map((c) => {
      const a = map(c.x1, c.y1);
      const b = map(c.x2, c.y2);
      return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
    }),
  };
}
