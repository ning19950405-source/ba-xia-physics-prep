import pptxgen from 'pptxgenjs';
import type { LessonDeck } from '@/lib/lesson-plan-schema';
import { deckPlaceholderImageUrl, getSlideSections, getSummaryMindMap, getSummarySectionsAfterMindMap, inferDeckSlideLayout } from '@/lib/deck-slide-content';
import { layoutMindMap, scaleLayoutToPptx } from '@/lib/mind-map-layout';

type PptxSlide = ReturnType<InstanceType<typeof pptxgen>['addSlide']>;

export type DeckSlideTone = {
  header: string;
  accent: string;
  tag: string;
  variant: 'opening' | 'closing' | 'body';
};

export function getDeckSlideTone(index: number, total: number): DeckSlideTone {
  if (total <= 1) {
    return { header: '3730A3', accent: 'F59E0B', tag: '课件', variant: 'opening' };
  }
  if (index === 0) {
    return { header: '312E81', accent: 'FBBF24', tag: '开篇', variant: 'opening' };
  }
  if (index === total - 1) {
    return { header: '134E4A', accent: '5EEAD4', tag: '小结', variant: 'closing' };
  }
  const palette: Omit<DeckSlideTone, 'variant'>[] = [
    { header: '4338CA', accent: 'FB923C', tag: '教学' },
    { header: '5B21B6', accent: 'F472B6', tag: '教学' },
    { header: '1E40AF', accent: '38BDF8', tag: '教学' },
    { header: '0F766E', accent: 'A7F3D0', tag: '教学' },
  ];
  const p = palette[(index - 1) % palette.length];
  return { ...p, variant: 'body' };
}

async function fetchImageAsData(path: string): Promise<string | undefined> {
  try {
    const res = await fetch(path);
    if (!res.ok) return undefined;
    const buf = await res.arrayBuffer();
    const u8 = new Uint8Array(buf);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < u8.length; i += chunk) {
      binary += String.fromCharCode.apply(null, u8.subarray(i, i + chunk) as unknown as number[]);
    }
    const ct = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
    return `${ct};base64,${btoa(binary)}`;
  } catch {
    return undefined;
  }
}

function drawHeader(
  sl: PptxSlide,
  pptx: InstanceType<typeof pptxgen>,
  tone: DeckSlideTone,
  title: string,
  subtitle: string | undefined,
  titleSize: number,
  yTitle: number,
) {
  sl.background = { color: 'F1F5F9' };
  sl.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 1.12,
    fill: { color: tone.header },
    line: { color: tone.header, width: 0 },
  });
  sl.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 1.1,
    w: '100%',
    h: 0.06,
    fill: { color: tone.accent },
    line: { color: tone.accent, width: 0 },
  });
  sl.addShape(pptx.ShapeType.roundRect, {
    x: 0.45,
    y: 0.18,
    w: 0.95,
    h: 0.34,
    fill: { color: 'FFFFFF', transparency: 88 },
    line: { color: 'C7D2FE', width: 0.5 },
  });
  sl.addText(tone.tag, {
    x: 0.52,
    y: 0.22,
    w: 0.9,
    h: 0.28,
    fontSize: 10,
    bold: true,
    color: 'EEF2FF',
  });
  sl.addText(title, {
    x: 0.45,
    y: yTitle,
    w: 9,
    h: subtitle ? 0.52 : 0.62,
    fontSize: titleSize,
    bold: true,
    color: 'FFFFFF',
    valign: 'top',
  });
  if (subtitle?.trim()) {
    sl.addText(subtitle.trim(), {
      x: 0.45,
      y: yTitle + 0.48,
      w: 9,
      h: 0.45,
      fontSize: 13,
      color: 'E0E7FF',
      valign: 'top',
    });
  }
}

/**
 * 导出 PPTX：含板块文案、分隔、占位配图（能拉取 picsum 时嵌入）。
 */
export async function writeLessonDeckPptx(deck: LessonDeck, presentationTitle: string): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = '八下物理备课';
  pptx.title = presentationTitle;
  const total = deck.slides.length;

  for (let i = 0; i < deck.slides.length; i++) {
    const s = deck.slides[i];
    const tone = getDeckSlideTone(i, total);
    const layout = inferDeckSlideLayout(s, i, total);
    const sections = getSlideSections(s);
    const imgUrl = deckPlaceholderImageUrl(i, s.title);
    const imgData = layout === 'cover' || layout === 'split' ? await fetchImageAsData(imgUrl) : undefined;

    const sl = pptx.addSlide();
    const titleSize = layout === 'cover' ? 30 : 24;
    const yTitle = layout === 'cover' ? 0.44 : 0.42;
    drawHeader(sl, pptx, tone, s.title, s.subtitle, titleSize, yTitle);

    const footer = () =>
      sl.addText(`第 ${i + 1} / ${total} 页`, {
        x: 7.35,
        y: 5.12,
        w: 2.4,
        h: 0.35,
        fontSize: 10,
        color: '64748B',
        align: 'right',
      });

    if (layout === 'cover') {
      if (imgData) {
        sl.addImage({ data: imgData, x: 0.35, y: 1.28, w: 9.3, h: 3.55 });
      } else {
        sl.addShape(pptx.ShapeType.rect, {
          x: 0.35,
          y: 1.28,
          w: 9.3,
          h: 3.55,
          fill: { color: tone.accent, transparency: 40 },
          line: { color: tone.header, width: 1 },
        });
        sl.addText('（配图占位：导出时若网络可用将自动嵌入图片）', {
          x: 1,
          y: 2.85,
          w: 8,
          h: 0.5,
          fontSize: 12,
          color: '475569',
          align: 'center',
        });
      }
      sl.addShape(pptx.ShapeType.rect, {
        x: 0.35,
        y: 4.55,
        w: 9.3,
        h: 0.85,
        fill: { color: '0F172A', transparency: 35 },
        line: { width: 0 },
      });
      const tagline = s.bullets.filter((b) => b.trim()).slice(0, 3).join('　·　');
      if (tagline) {
        sl.addText(tagline, {
          x: 0.5,
          y: 4.62,
          w: 9,
          h: 0.7,
          fontSize: 12,
          color: 'FFFFFF',
          valign: 'middle',
        });
      }
      if (s.imageCaption?.trim()) {
        sl.addText(s.imageCaption.trim(), {
          x: 0.45,
          y: 5.0,
          w: 9.2,
          h: 0.4,
          fontSize: 10,
          color: '94A3B8',
          align: 'center',
        });
      }
      footer();
      continue;
    }

    if (layout === 'split') {
      if (!imgData) {
        let y = 1.38;
        for (const sec of sections) {
          sl.addText(sec.heading, {
            x: 0.45,
            y,
            w: 9,
            h: 0.32,
            fontSize: 13,
            bold: true,
            color: tone.header,
          });
          y += 0.32;
          sl.addText(sec.lines.join('\n'), {
            x: 0.45,
            y,
            w: 9,
            h: Math.min(2.2, 0.3 + sec.lines.length * 0.28),
            fontSize: 14,
            color: '334155',
            valign: 'top',
            bullet: { type: 'bullet', indent: 18 },
          });
          y += Math.min(2.3, 0.35 + sec.lines.length * 0.28) + 0.15;
          if (y > 4.9) break;
        }
        footer();
        continue;
      }
      let y = 1.38;
      for (const sec of sections) {
        sl.addText(sec.heading, {
          x: 0.45,
          y,
          w: 4.95,
          h: 0.32,
          fontSize: 13,
          bold: true,
          color: tone.header,
        });
        y += 0.3;
        sl.addText(sec.lines.join('\n'), {
          x: 0.45,
          y,
          w: 4.95,
          h: Math.min(1.35, 0.28 + sec.lines.length * 0.28),
          fontSize: 14,
          color: '334155',
          valign: 'top',
          bullet: { type: 'bullet', indent: 18 },
        });
        y += Math.min(1.45, 0.35 + sec.lines.length * 0.3) + 0.12;
        if (y > 4.5) break;
      }
      sl.addShape(pptx.ShapeType.rect, {
        x: 5.52,
        y: 1.32,
        w: 0.04,
        h: 3.65,
        fill: { color: 'CBD5E1' },
        line: { width: 0 },
      });
      sl.addImage({ data: imgData, x: 5.68, y: 1.35, w: 3.85, h: 2.85, rounding: true });
      const cap = s.imageCaption?.trim() || '情境与现象（占位图，可按实际替换）';
      sl.addText(cap, {
        x: 5.68,
        y: 4.28,
        w: 3.85,
        h: 0.55,
        fontSize: 10,
        color: '64748B',
        align: 'center',
      });
      footer();
      continue;
    }

    if (layout === 'layers') {
      let y = 1.32;
      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si];
        const h = 0.38 + Math.min(sec.lines.length, 5) * 0.26 + 0.35;
        sl.addShape(pptx.ShapeType.roundRect, {
          x: 0.42,
          y,
          w: 9.15,
          h: Math.min(h, 1.55),
          fill: { color: 'FFFFFF', transparency: 8 },
          line: { color: 'E2E8F0', width: 1 },
        });
        sl.addText(sec.heading, {
          x: 0.58,
          y: y + 0.08,
          w: 8.8,
          h: 0.3,
          fontSize: 12,
          bold: true,
          color: tone.header,
        });
        sl.addText(sec.lines.join('\n'), {
          x: 0.58,
          y: y + 0.36,
          w: 8.8,
          h: Math.min(h - 0.45, 1.05),
          fontSize: 13,
          color: '334155',
          valign: 'top',
          bullet: { type: 'bullet', indent: 16 },
        });
        y += Math.min(h, 1.55) + 0.14;
        if (y > 4.85) break;
      }
      footer();
      continue;
    }

    if (layout === 'summary') {
      const hasModelMindMap =
        Boolean(s.mindMap?.center?.trim()) && (s.mindMap?.branches?.length ?? 0) >= 2;
      const mm = getSummaryMindMap(s);
      const secsAfter = getSummarySectionsAfterMindMap(s, hasModelMindMap);

      if (mm) {
        const hasExtra = secsAfter.some((sec) => sec.lines.some((l) => l.trim().length > 0));
        const originX = 0.48;
        const originY = 1.32;
        const areaW = 9.04;
        const areaH = hasExtra ? 2.42 : 3.52;
        const vh = hasExtra ? 280 : 340;

        const L = layoutMindMap(mm, 1000, vh);
        const P = scaleLayoutToPptx(L, originX, originY, areaW, areaH);

        for (const c of P.connectors) {
          sl.addShape(pptx.ShapeType.line, {
            x: c.x1,
            y: c.y1,
            w: Math.max(0.02, c.x2 - c.x1),
            h: c.y2 - c.y1,
            line: { color: tone.accent, width: 2 },
          });
        }

        sl.addShape(pptx.ShapeType.roundRect, {
          x: P.root.x,
          y: P.root.y,
          w: P.root.w,
          h: P.root.h,
          fill: { color: tone.header },
          line: { color: tone.accent, width: 1 },
        });
        sl.addText(P.root.text, {
          x: P.root.x + 0.04,
          y: P.root.y + 0.04,
          w: P.root.w - 0.08,
          h: P.root.h - 0.08,
          fontSize: P.root.text.length > 14 ? 11 : 13,
          bold: true,
          color: 'FFFFFF',
          align: 'center',
          valign: 'middle',
        });

        for (const b of P.branches) {
          sl.addShape(pptx.ShapeType.roundRect, {
            x: b.x,
            y: b.y,
            w: b.w,
            h: b.h,
            fill: { color: 'FFFFFF', transparency: 10 },
            line: { color: tone.accent, width: 1 },
          });
          const body =
            b.items.length > 0 ? `${b.text}\n${b.items.map((it) => `◆ ${it}`).join('\n')}` : b.text;
          sl.addText(body, {
            x: b.x + 0.06,
            y: b.y + 0.05,
            w: b.w - 0.12,
            h: b.h - 0.08,
            fontSize: 11,
            color: '134E4A',
            valign: 'top',
          });
        }

        let yText = originY + areaH + 0.1;
        for (const sec of secsAfter) {
          const lines = sec.lines.filter((l) => l.trim().length > 0);
          if (lines.length === 0) continue;
          const block = `${sec.heading}\n${lines.map((l) => `• ${l}`).join('\n')}`;
          const hBlock = Math.min(1.2, 0.32 + lines.length * 0.2);
          sl.addText(block, {
            x: 0.52,
            y: yText,
            w: 8.9,
            h: hBlock,
            fontSize: 12,
            color: '134E4A',
            valign: 'top',
          });
          yText += hBlock + 0.06;
          if (yText > 4.95) break;
        }
      } else {
        sl.addShape(pptx.ShapeType.roundRect, {
          x: 0.45,
          y: 1.32,
          w: 9.1,
          h: 3.75,
          fill: { color: 'ECFDF5', transparency: 15 },
          line: { color: tone.accent, width: 1.5 },
        });
        const body = sections
          .map((sec) => `${sec.heading}\n${sec.lines.map((l) => `• ${l}`).join('\n')}`)
          .join('\n\n');
        sl.addText(body, {
          x: 0.65,
          y: 1.48,
          w: 8.7,
          h: 3.45,
          fontSize: 15,
          color: '134E4A',
          valign: 'top',
        });
      }
      footer();
      continue;
    }

    /* standard / cover 无图 / split 无图 */
    const body = sections
      .map((sec) => `${sec.heading}\n${sec.lines.map((l) => `• ${l}`).join('\n')}`)
      .join('\n\n');
    sl.addText(body, {
      x: 0.5,
      y: 1.38,
      w: 9,
      h: 3.85,
      fontSize: 15,
      color: '1E293B',
      valign: 'top',
    });
    footer();
  }

  const safe = presentationTitle.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80) || '课件';
  await pptx.writeFile({ fileName: `${safe}.pptx` });
}
