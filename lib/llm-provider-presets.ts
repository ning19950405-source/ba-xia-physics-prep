import type { WireProviderType } from '@/lib/model-wire-types';

/** 单条模型（可选展示上下文/输出规模，与 OpenMAIC 设置页一致） */
export type LlmPresetModel = {
  id: string;
  label: string;
  /** 如 1.0M */
  contextHint?: string;
  /** 如 384K */
  outputHint?: string;
};

/** 语言模型预设（与 OpenMAIC 厂商/Base URL 对齐思路；本应用仅文本生成） */
export type LlmProviderPreset = {
  id: string;
  name: string;
  /** 右侧副标题，如「OpenAI 协议」 */
  protocolLabel: string;
  providerType: WireProviderType;
  defaultBaseUrl: string;
  models: ReadonlyArray<LlmPresetModel>;
};

export const LLM_PROVIDER_PRESETS: readonly LlmProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    protocolLabel: 'OpenAI 协议',
    providerType: 'openai',
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-5.2', label: 'GPT-5.2' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Claude',
    protocolLabel: 'Anthropic 协议',
    providerType: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    ],
  },
  {
    id: 'google',
    name: 'Gemini',
    protocolLabel: 'Google Gemini',
    providerType: 'google',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    ],
  },
  {
    id: 'glm',
    name: 'GLM',
    protocolLabel: 'OpenAI 兼容',
    providerType: 'openai',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4.7-flash', label: 'GLM-4.7 Flash' },
      { id: 'glm-4.7', label: 'GLM-4.7' },
      { id: 'glm-4.6', label: 'GLM-4.6' },
    ],
  },
  {
    id: 'qwen',
    name: '通义千问',
    protocolLabel: 'OpenAI 兼容',
    providerType: 'openai',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen3.6-flash', label: 'Qwen3.6 Flash' },
      { id: 'qwen3.6-plus', label: 'Qwen3.6 Plus' },
      { id: 'qwen3.5-flash', label: 'Qwen3.5 Flash' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    protocolLabel: 'OpenAI 协议',
    providerType: 'openai',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    models: [
      {
        id: 'deepseek-v4-pro',
        label: 'DeepSeek V4 Pro',
        contextHint: '1.0M',
        outputHint: '384K',
      },
      {
        id: 'deepseek-v4-flash',
        label: 'DeepSeek V4 Flash',
        contextHint: '1.0M',
        outputHint: '384K',
      },
      // 仍兼容旧版对话模型（官方 id）
      { id: 'deepseek-chat', label: 'DeepSeek Chat（V3）' },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner（V3）' },
    ],
  },
  {
    id: 'kimi',
    name: 'Kimi',
    protocolLabel: 'OpenAI 兼容',
    providerType: 'openai',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'kimi-k2.5', label: 'Kimi K2.5' },
      { id: 'moonshot-v1-8k', label: 'Moonshot v1 8K' },
    ],
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    protocolLabel: 'Anthropic 兼容',
    providerType: 'anthropic',
    defaultBaseUrl: 'https://api.minimaxi.com/anthropic/v1',
    models: [{ id: 'MiniMax-M2.7', label: 'MiniMax M2.7' }],
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    protocolLabel: 'OpenAI 兼容',
    providerType: 'openai',
    defaultBaseUrl: 'https://api.siliconflow.cn/v1',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3.2', label: 'DeepSeek-V3.2' },
      { id: 'Qwen/Qwen3-32B', label: 'Qwen3-32B' },
    ],
  },
  {
    id: 'doubao',
    name: '豆包',
    protocolLabel: 'OpenAI 兼容',
    providerType: 'openai',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      { id: 'doubao-seed-2-0-lite-260215', label: 'Doubao Seed 2.0 Lite' },
      { id: 'doubao-seed-2-0-pro-260215', label: 'Doubao Seed 2.0 Pro' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    protocolLabel: 'OpenAI 兼容',
    providerType: 'openai',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'openai/gpt-4o-mini', label: 'openai/gpt-4o-mini' },
      { id: 'anthropic/claude-sonnet-4', label: 'anthropic/claude-sonnet-4' },
    ],
  },
  {
    id: 'grok',
    name: 'Grok',
    protocolLabel: 'OpenAI 兼容',
    providerType: 'openai',
    defaultBaseUrl: 'https://api.x.ai/v1',
    models: [{ id: 'grok-3-mini', label: 'Grok 3 Mini' }],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    protocolLabel: 'OpenAI 兼容（本地）',
    providerType: 'openai',
    defaultBaseUrl: 'http://localhost:11434/v1',
    models: [{ id: 'llama3.2', label: 'llama3.2' }],
  },
] as const;

export function getPresetById(id: string): LlmProviderPreset | undefined {
  return LLM_PROVIDER_PRESETS.find((p) => p.id === id);
}

function modelIdFromString(modelString: string): string {
  const i = modelString.indexOf(':');
  return i > 0 ? modelString.slice(i + 1) : modelString;
}

/**
 * 根据一条「扁平」凭据行猜测厂商预设 id（用于迁移与修正 activePresetId）。
 */
export function inferPresetIdFromRow(
  row: { modelString: string; baseUrl: string; providerType: WireProviderType },
  hintPresetId?: string,
): string {
  if (hintPresetId && getPresetById(hintPresetId)) return hintPresetId;
  const base = row.baseUrl.trim();
  const mid = modelIdFromString(row.modelString);
  for (const p of LLM_PROVIDER_PRESETS) {
    if (p.providerType !== row.providerType) continue;
    if (base && p.defaultBaseUrl === base) {
      if (p.models.some((m) => m.id === mid)) return p.id;
      return p.id;
    }
  }
  for (const p of LLM_PROVIDER_PRESETS) {
    if (p.providerType !== row.providerType) continue;
    if (p.models.some((m) => m.id === mid)) return p.id;
  }
  return row.providerType === 'anthropic'
    ? 'anthropic'
    : row.providerType === 'google'
      ? 'google'
      : 'openai';
}

export function modelStringFor(providerType: WireProviderType, modelId: string): string {
  return `${providerType}:${modelId}`;
}
