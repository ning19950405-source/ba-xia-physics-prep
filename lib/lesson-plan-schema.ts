import { z } from 'zod';

export const segmentSchema = z.object({
  title: z.string(),
  durationMinutes: z.number().positive(),
  activities: z.array(z.string()),
  notes: z.string().optional(),
});

export const lessonPlanSchema = z.object({
  lessonTitle: z.string(),
  gradeScope: z.string(),
  keyPoints: z.array(z.string()).min(1),
  essentials: z.array(z.string()).min(1),
  segments: z.array(segmentSchema).min(1),
  reflectionQuestions: z.array(z.string()).optional(),
});

export type LessonPlan = z.infer<typeof lessonPlanSchema>;
export type LessonSegment = z.infer<typeof segmentSchema>;

export const deckSlideLayoutSchema = z.enum(['cover', 'split', 'layers', 'summary', 'standard']);

export const deckSectionSchema = z.object({
  heading: z.string(),
  lines: z.array(z.string()),
});

/** 小结页「知识网络」思维导图：中心主题 + 若干一级分支，分支下可选子要点 */
export const deckMindMapBranchSchema = z.object({
  label: z.string(),
  items: z.array(z.string()).max(5).optional(),
});

export const deckMindMapSchema = z.object({
  center: z.string(),
  branches: z.array(deckMindMapBranchSchema).min(2).max(10),
});

/** 单页：支持板块 sections + 配图说明；bullets 与 sections 至少其一有内容 */
export const deckSlideSchema = z
  .object({
    title: z.string(),
    subtitle: z.string().optional(),
    layout: deckSlideLayoutSchema.optional(),
    bullets: z.array(z.string()),
    sections: z.array(deckSectionSchema).optional(),
    /** 配图下说明文字（配图为占位图，与课题绑定） */
    imageCaption: z.string().optional(),
    /** 最后一页 summary 建议填写：知识网络思维导图（与 sections 的「课堂练习」等互补） */
    mindMap: deckMindMapSchema.optional(),
  })
  .refine(
    (s) => {
      const hasBullets = s.bullets.some((b) => b.trim().length > 0);
      const hasSectionLines = Boolean(s.sections?.some((sec) => sec.lines.some((l) => l.trim().length > 0)));
      const hasMind =
        Boolean(s.mindMap?.center?.trim()) &&
        (s.mindMap?.branches?.length ?? 0) >= 2 &&
        (s.mindMap?.branches ?? []).every((b) => b.label.trim().length > 0);
      return hasBullets || hasSectionLines || hasMind;
    },
    { message: '每页需包含非空 bullets、sections[].lines 或有效 mindMap（center + 至少 2 条分支）' },
  );

export const deckSchema = z.object({
  slides: z.array(deckSlideSchema).min(1),
});

export type DeckSlide = z.infer<typeof deckSlideSchema>;
export type DeckSlideLayout = z.infer<typeof deckSlideLayoutSchema>;
export type LessonDeck = z.infer<typeof deckSchema>;
export type DeckSection = z.infer<typeof deckSectionSchema>;
export type DeckMindMap = z.infer<typeof deckMindMapSchema>;
export type DeckMindMapBranch = z.infer<typeof deckMindMapBranchSchema>;
