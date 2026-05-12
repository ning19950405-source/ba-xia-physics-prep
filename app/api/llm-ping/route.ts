import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';
import { buildLanguageModelFromInput, type ProviderTypeWire } from '@/lib/model-runtime';
import { assertPingBaseUrlAllowed } from '@/lib/ping-base-url';

const bodySchema = z.object({
  modelString: z.string().min(1, '需要 modelString'),
  providerType: z.enum(['openai', 'anthropic', 'google']),
  /** 可空：回落服务端环境变量 */
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
});

const PING_FETCH_MS = 18_000;

function mapErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes('401') ||
    m.includes('unauthorized') ||
    m.includes('invalid api key') ||
    m.includes('api key') ||
    m.includes('incorrect api key')
  ) {
    return 'API Key 无效或已过期，请检查密钥与厂商是否一致';
  }
  if (m.includes('404') || m.includes('not found')) {
    return '模型不存在或接口路径错误，请检查模型名与 Base URL';
  }
  if (m.includes('429')) {
    return '请求过于频繁，请稍后再试';
  }
  if (m.includes('enotfound') || m.includes('econnrefused') || m.includes('fetch failed')) {
    return '无法连接到接口地址，请检查 Base URL 与网络';
  }
  if (m.includes('abort') || m.includes('timeout')) {
    return '连接超时，请检查网络或稍后在「测试连接」重试';
  }
  return message.length > 280 ? `${message.slice(0, 280)}…` : message;
}

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('；') || '请求体无效';
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const { modelString, providerType, apiKey, baseUrl } = parsed.data;

    try {
      assertPingBaseUrlAllowed(baseUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    let model;
    try {
      model = buildLanguageModelFromInput({
        modelString,
        providerType: providerType as ProviderTypeWire,
        clientApiKey: apiKey ?? '',
        clientBaseUrl: baseUrl ?? '',
        fetchTimeoutMs: PING_FETCH_MS,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    try {
      await generateText({
        model,
        prompt: 'Reply with a single word: OK',
        maxOutputTokens: 32,
      });
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { ok: false, error: mapErrorMessage(raw) },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, message: '连接成功' });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: mapErrorMessage(raw) },
      { status: 502 },
    );
  }
}
