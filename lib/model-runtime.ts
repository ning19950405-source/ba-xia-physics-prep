import type { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { parseModelString } from '@/lib/parse-model-string';
import { createFetchWithTimeout, getFetchTimeoutMs } from '@/lib/model-fetch';

export type ProviderTypeWire = 'openai' | 'anthropic' | 'google';

export type BuildLanguageModelInput = {
  modelString: string;
  providerType: ProviderTypeWire;
  /** 客户端传入的 API Key，可空则回落环境变量 */
  clientApiKey: string;
  /** 客户端传入的 Base URL，可空则回落环境变量 */
  clientBaseUrl: string;
  /** 不传则使用 OPENAI_FETCH_TIMEOUT_MS 等全局配置 */
  fetchTimeoutMs?: number;
};

/**
 * 由模型字符串与凭据构造 LanguageModel（供 API 路由与「测试连接」复用）。
 */
export function buildLanguageModelFromInput(input: BuildLanguageModelInput): LanguageModel {
  const { modelString, providerType, clientApiKey, clientBaseUrl, fetchTimeoutMs } = input;
  if (!['openai', 'anthropic', 'google'].includes(providerType)) {
    throw new Error(`不支持的 providerType: ${providerType}，请使用 openai | anthropic | google`);
  }

  const headerKey = clientApiKey.trim();
  const headerBase = clientBaseUrl.trim();

  const envKeyFor = () => {
    if (providerType === 'anthropic') return process.env.ANTHROPIC_API_KEY?.trim() || '';
    if (providerType === 'google') return process.env.GOOGLE_API_KEY?.trim() || '';
    return process.env.OPENAI_API_KEY?.trim() || '';
  };

  const apiKey = headerKey || envKeyFor();
  if (!apiKey) {
    throw new Error(
      '未配置 API Key：请在设置中填写，或在 .env.local 设置 OPENAI_API_KEY / ANTHROPIC_API_KEY / GOOGLE_API_KEY',
    );
  }

  const envBaseFor = () => {
    if (providerType === 'anthropic') return process.env.ANTHROPIC_BASE_URL?.trim() || undefined;
    if (providerType === 'google') return process.env.GOOGLE_BASE_URL?.trim() || undefined;
    return process.env.OPENAI_BASE_URL?.trim() || undefined;
  };

  const baseURL = headerBase || envBaseFor() || undefined;
  const { modelId } = parseModelString(modelString);
  const timeout = fetchTimeoutMs ?? getFetchTimeoutMs();
  const fetchImpl = createFetchWithTimeout(timeout);

  switch (providerType) {
    case 'openai': {
      const openai = createOpenAI({
        apiKey,
        baseURL,
        fetch: fetchImpl,
      });
      return openai.chat(modelId);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({
        apiKey,
        baseURL,
        fetch: fetchImpl,
      });
      return anthropic.chat(modelId);
    }
    case 'google': {
      const google = createGoogleGenerativeAI({
        apiKey,
        baseURL,
        fetch: fetchImpl,
      });
      return google.chat(modelId);
    }
  }
}

/**
 * 从请求头解析语言模型（约定与 OpenMAIC 前端一致）：
 * - x-model: 如 openai:gpt-4o-mini、anthropic:claude-sonnet-4-20250514、google:gemini-2.0-flash
 * - x-api-key: 客户端配置的密钥（可空则回落 env）
 * - x-base-url: 可选，兼容网关
 * - x-provider-type: openai | anthropic | google（决定 SDK 分支；OpenAI 兼容中转一般为 openai）
 */
export function getLanguageModelFromRequest(req: Request): LanguageModel {
  const modelString =
    req.headers.get('x-model')?.trim() || process.env.DEFAULT_MODEL || 'gpt-4o-mini';
  const providerType = (req.headers.get('x-provider-type')?.trim() || 'openai') as ProviderTypeWire;

  return buildLanguageModelFromInput({
    modelString,
    providerType,
    clientApiKey: req.headers.get('x-api-key')?.trim() || '',
    clientBaseUrl: req.headers.get('x-base-url')?.trim() || '',
  });
}
