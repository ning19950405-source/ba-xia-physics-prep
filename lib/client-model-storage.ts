/**
 * 浏览器端模型配置：按厂商预设（preset id）分别保存密钥与 Base URL，避免切换厂商时互相覆盖。
 * 请求头约定仍与 OpenMAIC 一致。
 */
import {
  getPresetById,
  inferPresetIdFromRow,
  LLM_PROVIDER_PRESETS,
  modelStringFor,
} from '@/lib/llm-provider-presets';
import type { PresetSlot, WireProviderType } from '@/lib/model-wire-types';

export type { PresetSlot, WireProviderType } from '@/lib/model-wire-types';

export type ClientModelConfig = {
  /** 当前用于备课 / 课件 API 的厂商预设 id */
  activePresetId: string;
  /** 各厂商独立槽位；未出现的 key 表示尚未为该厂商写入过 */
  byPreset: Partial<Record<string, PresetSlot>>;
};

const STORAGE_KEY = 'bxwl_model_config';

export function defaultSlotForPreset(presetId: string): PresetSlot {
  const p = getPresetById(presetId) ?? LLM_PROVIDER_PRESETS[0]!;
  const first = p.models[0]!;
  return {
    apiKey: '',
    baseUrl: p.defaultBaseUrl,
    modelString: modelStringFor(p.providerType, first.id),
    providerType: p.providerType,
  };
}

/** 读取某厂商下的已保存配置；无记录时返回该厂商默认值 */
export function getSlot(cfg: ClientModelConfig, presetId: string): PresetSlot {
  const d = defaultSlotForPreset(presetId);
  const mine = cfg.byPreset[presetId];
  if (!mine) return d;
  return {
    apiKey: mine.apiKey ?? '',
    baseUrl: mine.baseUrl?.trim() ? mine.baseUrl : d.baseUrl,
    modelString: mine.modelString?.trim() ? mine.modelString : d.modelString,
    providerType: (mine.providerType ?? d.providerType) as WireProviderType,
  };
}

/** 当前选中厂商的生效配置（用于设置表单与 API 请求头） */
export function getResolvedActiveSlot(cfg: ClientModelConfig): PresetSlot {
  const pid =
    cfg.activePresetId && getPresetById(cfg.activePresetId) ? cfg.activePresetId : 'openai';
  return getSlot(cfg, pid);
}

export function patchActiveSlot(cfg: ClientModelConfig, patch: Partial<PresetSlot>): ClientModelConfig {
  const pid = cfg.activePresetId && getPresetById(cfg.activePresetId) ? cfg.activePresetId : 'openai';
  const base = getSlot(cfg, pid);
  return {
    ...cfg,
    activePresetId: pid,
    byPreset: { ...cfg.byPreset, [pid]: { ...base, ...patch } },
  };
}

export function flushActive(cfg: ClientModelConfig): ClientModelConfig {
  const pid = cfg.activePresetId && getPresetById(cfg.activePresetId) ? cfg.activePresetId : 'openai';
  return {
    ...cfg,
    activePresetId: pid,
    byPreset: { ...cfg.byPreset, [pid]: getSlot(cfg, pid) },
  };
}

export function normalizeClientConfig(c: ClientModelConfig): ClientModelConfig {
  if (getPresetById(c.activePresetId)) return c;
  return { ...c, activePresetId: 'openai' };
}

function parseProviderType(raw: unknown): WireProviderType {
  if (raw === 'anthropic' || raw === 'google') return raw;
  return 'openai';
}

function migrateFromLegacy(o: Record<string, unknown>): ClientModelConfig {
  const pt = parseProviderType(o.providerType);
  const modelString =
    typeof o.modelString === 'string' && o.modelString.trim()
      ? o.modelString.trim()
      : 'openai:gpt-4o-mini';
  const baseUrl = typeof o.baseUrl === 'string' ? o.baseUrl : '';
  const apiKey = typeof o.apiKey === 'string' ? o.apiKey : '';
  const hint = typeof o.presetId === 'string' ? o.presetId : undefined;
  const inferred = inferPresetIdFromRow({ modelString, baseUrl, providerType: pt }, hint);
  const def = defaultSlotForPreset(inferred);
  return normalizeClientConfig({
    activePresetId: inferred,
    byPreset: {
      [inferred]: {
        apiKey,
        baseUrl: baseUrl.trim() ? baseUrl.trim() : def.baseUrl,
        modelString,
        providerType: pt,
      },
    },
  });
}

function safeParse(raw: string | null): ClientModelConfig {
  if (!raw) {
    return normalizeClientConfig({ activePresetId: 'openai', byPreset: {} });
  }
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (o && typeof o === 'object' && 'byPreset' in o && typeof o.byPreset === 'object' && o.byPreset !== null) {
      const activePresetId = typeof o.activePresetId === 'string' ? o.activePresetId : 'openai';
      const byPreset = o.byPreset as Record<string, Partial<PresetSlot>>;
      const cleaned: ClientModelConfig['byPreset'] = {};
      for (const [k, v] of Object.entries(byPreset)) {
        if (!v || typeof v !== 'object') continue;
        const pt = parseProviderType(v.providerType);
        const slot: PresetSlot = {
          apiKey: typeof v.apiKey === 'string' ? v.apiKey : '',
          baseUrl: typeof v.baseUrl === 'string' ? v.baseUrl : '',
          modelString:
            typeof v.modelString === 'string' && v.modelString.trim()
              ? v.modelString.trim()
              : defaultSlotForPreset(k).modelString,
          providerType: pt,
        };
        cleaned[k] = slot;
      }
      return normalizeClientConfig({ activePresetId, byPreset: cleaned });
    }
    return migrateFromLegacy(o);
  } catch {
    return normalizeClientConfig({ activePresetId: 'openai', byPreset: {} });
  }
}

export function loadClientModelConfig(): ClientModelConfig {
  if (typeof window === 'undefined') {
    return normalizeClientConfig({ activePresetId: 'openai', byPreset: {} });
  }
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function saveClientModelConfig(c: ClientModelConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flushActive(normalizeClientConfig(c))));
}

/** 合并进 fetch headers：使用当前选中厂商的密钥与地址 */
export function getModelHeadersInit(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const c = loadClientModelConfig();
  const s = getResolvedActiveSlot(c);
  const h: Record<string, string> = {
    'x-model': s.modelString,
    'x-provider-type': s.providerType,
  };
  if (s.apiKey.trim()) h['x-api-key'] = s.apiKey.trim();
  if (s.baseUrl.trim()) h['x-base-url'] = s.baseUrl.trim();
  return h;
}
