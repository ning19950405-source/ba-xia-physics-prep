import { generateText } from 'ai';
import { getLanguageModelFromRequest } from '@/lib/model-runtime';

export async function generateTextFromRequest(
  req: Request,
  system: string,
  user: string,
): Promise<string> {
  const model = getLanguageModelFromRequest(req);
  try {
    const result = await generateText({
      model,
      system,
      prompt: user,
      maxOutputTokens: 8192,
    });
    return result.text;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const hint =
      '若直连官方 API 超时或被墙，请在「模型配置」填写 Base URL（兼容网关）并选对「接口类型」；也可加大 OPENAI_FETCH_TIMEOUT_MS。';
    if (/abort|timeout|fetch|connect|ECONNREFUSED|ENOTFOUND/i.test(msg)) {
      throw new Error(`${msg}\n\n${hint}`);
    }
    throw e;
  }
}
