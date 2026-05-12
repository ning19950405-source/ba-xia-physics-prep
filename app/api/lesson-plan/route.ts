import { NextResponse } from 'next/server';
import { generateTextFromRequest } from '@/lib/generate-text';
import { lessonPlanSchema } from '@/lib/lesson-plan-schema';
import { parseJsonFromModel } from '@/lib/json-parse';

const SYSTEM = `你是资深初中物理教研员，专注「义务教育教科书 物理 八年级下册」备课。
你必须只输出一个 JSON 对象（不要 markdown 代码围栏），且键名与结构必须严格符合用户消息中的 schema 说明。
内容使用简体中文。环节时长用正整数分钟，与课标容量相符。`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { prompt?: string };
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'prompt 不能为空' }, { status: 400 });
    }

    const user = `用户备课需求（可包含课题、学情、重难点等）：\n${prompt}\n\n请输出 JSON，结构为：
{
  "lessonTitle": "本节课题目",
  "gradeScope": "八年级下册物理（或更具体单元）",
  "keyPoints": ["重点1","重点2", ...],
  "essentials": ["要点1","要点2", ...],
  "segments": [
    {
      "title": "环节名称",
      "durationMinutes": 10,
      "activities": ["活动或师生活动描述1", "..."],
      "notes": "可选备注"
    }
  ],
  "reflectionQuestions": ["可选课后反思问题"]
}
要求：keyPoints、essentials 各至少 3 条；segments 至少 3 个环节；总时长约 40–45 分钟。`;

    const raw = await generateTextFromRequest(req, SYSTEM, user);
    const parsed = parseJsonFromModel(raw);
    const result = lessonPlanSchema.safeParse(parsed);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: '模型返回的 JSON 不符合结构',
          details: result.error.flatten(),
          raw: raw.slice(0, 2000),
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ success: true, plan: result.data });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
