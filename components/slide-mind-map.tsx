'use client';

import type { DeckMindMap } from '@/lib/lesson-plan-schema';
import type { DeckSlideTone } from '@/lib/export-lesson-pptx';
import { layoutMindMap } from '@/lib/mind-map-layout';

type Props = {
  mindMap: DeckMindMap;
  tone: DeckSlideTone;
  /** 页内唯一，避免多页 SVG 渐变 id 冲突 */
  gradId: string;
};

export function SlideMindMap({ mindMap, tone, gradId }: Props) {
  const L = layoutMindMap(mindMap, 1000, 340);
  const accent = `#${tone.accent}`;
  const header = `#${tone.header}`;
  const lineCol = `${header}55`;

  return (
    <svg
      viewBox={`0 0 ${L.viewW} ${L.viewH}`}
      className="w-full max-w-full select-none"
      role="img"
      aria-label="知识网络思维导图"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={header} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>

      {L.connectors.map((e, i) => (
        <line
          key={i}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke={lineCol}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}

      <rect
        x={L.root.x}
        y={L.root.y}
        width={L.root.w}
        height={L.root.h}
        rx={14}
        fill={`url(#${gradId})`}
      />
      <text
        x={L.root.x + L.root.w / 2}
        y={L.root.y + L.root.h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize={L.root.text.length > 14 ? 12 : 14}
        fontWeight={700}
        style={{ fontFamily: 'inherit' }}
      >
        {L.root.text}
      </text>

      {L.branches.map((b, i) => (
        <g key={i}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={10}
            fill="#ffffff"
            stroke={accent}
            strokeWidth={2}
            opacity={0.98}
          />
          <text
            x={b.x + 12}
            y={b.y + 22}
            fill={header}
            fontSize={13}
            fontWeight={700}
            style={{ fontFamily: 'inherit' }}
          >
            {b.text}
          </text>
          {b.items.map((it, j) => (
            <text
              key={j}
              x={b.x + 14}
              y={b.y + 44 + j * 17}
              fill="#134e4a"
              fontSize={11.5}
              fontWeight={500}
              style={{ fontFamily: 'inherit' }}
            >
              {`◆ ${it}`}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}
