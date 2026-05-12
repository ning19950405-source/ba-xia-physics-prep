import { NextResponse } from 'next/server';
import { generateTextFromRequest } from '@/lib/generate-text';
import { deckSchema, type LessonPlan } from '@/lib/lesson-plan-schema';
import { parseJsonFromModel } from '@/lib/json-parse';

const SYSTEM = `你是初中物理课件编写助手。只输出一个 JSON 对象（不要 markdown 围栏），使用简体中文。

slides 为数组，每一页除 title、bullets 外，请尽量丰富版式字段：
- subtitle：副标题（封面页必填一句，如年级·单元；其它页可选一句承上启下）。
- layout：字符串，取值仅限 cover | split | layers | summary | standard。
  · 第一页（封面）用 cover。
  · 最后一页（小结与当堂练习）用 summary。
  · 中间「概念讲解、探究活动」等页优先用 split（左文右图结构）或 layers（多板块竖排）。
  · 若内容不适合分栏可用 standard。
- sections：数组，每项 { "heading": "板块小标题", "lines": ["要点1","要点2"] }。教学页至少 2 个板块、每板块 2–4 条 lines；与 bullets 语义一致（可互相补充）。
- bullets：字符串数组，每页 3–6 条短句，可与 sections 要点对应；用于目录式概览或封面下的关键词。
- imageCaption：一句配图说明（split/cover 页建议填写，说明右栏/大图情境；无需真实 URL）。
- mindMap：仅用于最后一页 layout 为 summary 时，表示「知识网络」思维导图（中心主题 + 一级分支 + 可选子要点）。结构：
  { "center": "本课核心概念（短句）", "branches": [ { "label": "一级分支标题", "items": ["子要点1","子要点2"] }, … ] }
  branches 至少 2 条、至多 10 条；每条 label 必填；items 每条最多 5 个字符串，可省略。
  小结页请同时用 sections 表达「课堂练习」等板块（heading 如「课堂练习」），勿在 sections 中重复罗列 mindMap 已展示的知识网络要点；可保留 heading 为「知识网络」且 lines 为空数组，但推荐省略该块、只保留 mindMap + 课堂练习。

要求：sections 与 bullets 至少一种里要有实质内容（非空字符串），或 summary 页提供有效 mindMap（center + 至少 2 条分支）且另有 sections/bullets 承载课堂练习等文案。`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { plan?: LessonPlan; extraNotes?: string };
    if (!body.plan) {
      return NextResponse.json({ success: false, error: 'plan 不能为空' }, { status: 400 });
    }

    const planJson = JSON.stringify(body.plan, null, 2);
    const extra = body.extraNotes?.trim() ? `\n教师补充说明：\n${body.extraNotes.trim()}` : '';

    const user = `以下备课思路已确认，请生成整节课的幻灯片列表（约 ${Math.max(8, body.plan.segments.length + 2)} 页：含封面 cover、与 segments 对应的若干教学页（split 或 layers）、小结 summary）。

${planJson}${extra}

输出 JSON 示例结构（字段需按页填充，勿照抄字面）：
{
  "slides": [
    {
      "title": "课题名",
      "subtitle": "八年级下册 · 第八章 …",
      "layout": "cover",
      "bullets": ["关键词1","关键词2"],
      "sections": [{ "heading": "本课定位", "lines": ["一条","两条"] }],
      "imageCaption": "课堂引入情境说明"
    },
    {
      "title": "环节标题",
      "layout": "split",
      "bullets": ["要点A","要点B"],
      "sections": [
        { "heading": "核心概念", "lines": ["…","…"] },
        { "heading": "生活现象", "lines": ["…"] }
      ],
      "imageCaption": "与物理现象相关的示意情境"
    },
    {
      "title": "小结与当堂练习",
      "subtitle": "回顾与巩固",
      "layout": "summary",
      "mindMap": {
        "center": "力",
        "branches": [
          { "label": "定义与单位", "items": ["牛顿（N）"] },
          { "label": "作用效果", "items": ["形变", "运动状态改变"] },
          { "label": "三要素与示意图", "items": [] },
          { "label": "力的相互作用", "items": ["等大、反向、共线、异体"] }
        ]
      },
      "sections": [
        {
          "heading": "课堂练习",
          "lines": ["画出绳对水平地面物体的拉力示意图", "判断哪些现象属于力的相互作用", "讨论相互作用力的特点"]
        }
      ],
      "bullets": ["巩固", "应用", "讨论"]
    }
  ]
}`;
    const raw = await generateTextFromRequest(req, SYSTEM, user);
    const parsed = parseJsonFromModel(raw);
    const result = deckSchema.safeParse(parsed);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: '课件 JSON 校验失败',
          details: result.error.flatten(),
          raw: raw.slice(0, 2000),
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ success: true, deck: result.data });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
