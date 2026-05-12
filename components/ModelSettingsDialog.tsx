'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Cog,
  Eye,
  EyeOff,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Mic,
  Search,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  flushActive,
  getResolvedActiveSlot,
  loadClientModelConfig,
  normalizeClientConfig,
  patchActiveSlot,
  saveClientModelConfig,
  getSlot,
  type ClientModelConfig,
} from '@/lib/client-model-storage';
import type { WireProviderType } from '@/lib/model-wire-types';
import {
  getPresetById,
  LLM_PROVIDER_PRESETS,
  modelStringFor,
  type LlmProviderPreset,
} from '@/lib/llm-provider-presets';
import { parseModelString } from '@/lib/parse-model-string';

type SettingsSection =
  | 'providers'
  | 'image'
  | 'video'
  | 'tts'
  | 'asr'
  | 'pdf'
  | 'web'
  | 'general';

const SECTIONS: ReadonlyArray<{
  id: SettingsSection;
  label: string;
  icon: typeof Bot;
  disabled?: boolean;
}> = [
  { id: 'providers', label: '语言模型', icon: Bot },
  { id: 'image', label: '图像生成', icon: ImageIcon, disabled: true },
  { id: 'video', label: '视频生成', icon: Film, disabled: true },
  { id: 'tts', label: '语音合成', icon: Volume2, disabled: true },
  { id: 'asr', label: '语音识别', icon: Mic, disabled: true },
  { id: 'pdf', label: 'PDF 解析', icon: FileText, disabled: true },
  { id: 'web', label: '网络搜索', icon: Search, disabled: true },
  { id: 'general', label: '系统设置', icon: Cog, disabled: true },
];

function endpointHint(providerType: WireProviderType, baseUrl: string): string {
  const b = baseUrl.trim() || '（默认）';
  if (providerType === 'openai') return `文本请求路径参考：${b}/chat/completions`;
  if (providerType === 'anthropic') return `Anthropic Messages API，Base：${b}`;
  return `Gemini 生成式接口，Base：${b}`;
}

export function ModelSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const titleId = useId();
  const [activeSection, setActiveSection] = useState<SettingsSection>('providers');
  const [cfg, setCfg] = useState<ClientModelConfig>(() => normalizeClientConfig(loadClientModelConfig()));
  const [showKey, setShowKey] = useState(false);
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [pingMessage, setPingMessage] = useState('');
  const [soonToast, setSoonToast] = useState<string | null>(null);
  const soonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showComingSoon = useCallback((label: string) => {
    setSoonToast(`${label} 功能即将推出`);
    if (soonTimerRef.current) clearTimeout(soonTimerRef.current);
    soonTimerRef.current = setTimeout(() => {
      setSoonToast(null);
      soonTimerRef.current = null;
    }, 2800);
  }, []);

  const syncFromStorage = useCallback(() => {
    setCfg(normalizeClientConfig(loadClientModelConfig()));
  }, []);

  useEffect(() => {
    if (!open) {
      setSoonToast(null);
      if (soonTimerRef.current) {
        clearTimeout(soonTimerRef.current);
        soonTimerRef.current = null;
      }
      return;
    }
    syncFromStorage();
    setActiveSection('providers');
    setSoonToast(null);
    setPingStatus('idle');
    setPingMessage('');
  }, [open, syncFromStorage]);

  useEffect(
    () => () => {
      if (soonTimerRef.current) clearTimeout(soonTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const slot = getResolvedActiveSlot(cfg);
  const preset = getPresetById(cfg.activePresetId) ?? LLM_PROVIDER_PRESETS[0];
  const { modelId: currentModelId } = parseModelString(slot.modelString);

  const applyPreset = (p: LlmProviderPreset) => {
    setCfg((c) => {
      const cur = c.activePresetId && getPresetById(c.activePresetId) ? c.activePresetId : 'openai';
      return {
        activePresetId: p.id,
        byPreset: { ...c.byPreset, [cur]: getSlot(c, cur) },
      };
    });
  };

  const handleSave = () => {
    saveClientModelConfig(flushActive(normalizeClientConfig(cfg)));
    onOpenChange(false);
  };

  const handleTestConnection = async () => {
    setPingStatus('testing');
    setPingMessage('');
    const s = getResolvedActiveSlot(cfg);
    try {
      const res = await fetch('/api/llm-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelString: s.modelString,
          providerType: s.providerType,
          apiKey: s.apiKey.trim() || undefined,
          baseUrl: s.baseUrl.trim() || undefined,
        }),
      });
      const raw = await res.text();
      let data: { ok?: boolean; message?: string; error?: string };
      try {
        data = JSON.parse(raw) as { ok?: boolean; message?: string; error?: string };
      } catch {
        data = { ok: false, error: raw.trim().slice(0, 400) || `HTTP ${res.status}` };
      }
      if (data.ok === true) {
        setPingStatus('success');
        setPingMessage(data.message || '连接成功');
        return;
      }
      setPingStatus('error');
      setPingMessage(data.error || `连接失败（HTTP ${res.status}）`);
    } catch (e) {
      setPingStatus('error');
      setPingMessage(e instanceof Error ? e.message : '请求失败');
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(640px,88vh)] w-full max-w-[920px] flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-[var(--card)] shadow-2xl dark:border-slate-700/80"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-slate-100">
            设置
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="关闭"
          >
            <X className="size-5" />
          </button>
        </div>

        {soonToast && (
          <div
            role="status"
            className="border-b border-amber-200/90 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100"
          >
            {soonToast}
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          {/* 左：功能分类 */}
          <nav
            className="hidden w-[168px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/80 py-2 dark:border-slate-700 dark:bg-slate-900/40 sm:flex"
            aria-label="设置分类"
          >
            {SECTIONS.map(({ id, label, icon: Icon, disabled }) => (
              <button
                key={id}
                type="button"
                aria-disabled={disabled}
                title={disabled ? `${label} 即将推出` : undefined}
                onClick={() => {
                  if (disabled) {
                    showComingSoon(label);
                    return;
                  }
                  setSoonToast(null);
                  if (soonTimerRef.current) {
                    clearTimeout(soonTimerRef.current);
                    soonTimerRef.current = null;
                  }
                  setActiveSection(id);
                }}
                className={cn(
                  'mx-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  disabled && 'cursor-not-allowed opacity-45',
                  !disabled && activeSection === id
                    ? 'border border-indigo-300/60 bg-indigo-50 font-medium text-indigo-900 dark:border-indigo-700/50 dark:bg-indigo-950/40 dark:text-indigo-100'
                    : !disabled && 'border border-transparent text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800/80',
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </nav>

          {/* 中：厂商 */}
          <div className="hidden w-[168px] shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 sm:flex">
            <div className="flex-1 overflow-y-auto p-2">
              {LLM_PROVIDER_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={cn(
                    'mb-1 flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors',
                    cfg.activePresetId === p.id
                      ? 'border-indigo-400/50 bg-indigo-50/90 font-medium text-indigo-950 shadow-sm dark:border-indigo-600/40 dark:bg-indigo-950/35 dark:text-indigo-50'
                      : 'border-transparent text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70',
                  )}
                >
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 右：表单 */}
          <div className="min-w-0 flex-1 overflow-y-auto">
            {activeSection === 'providers' && (
              <div className="space-y-4 p-4 sm:p-5">
                <div className="sm:hidden">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">厂商</label>
                  <select
                    value={cfg.activePresetId}
                    onChange={(e) => {
                      const p = getPresetById(e.target.value);
                      if (p) applyPreset(p);
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                  >
                    {LLM_PROVIDER_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">{preset.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{preset.protocolLabel}</div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">API 密钥</label>
                  <div className="mt-1 flex flex-wrap items-stretch gap-2">
                    <input
                      type={showKey ? 'text' : 'password'}
                      autoComplete="off"
                      value={slot.apiKey}
                      onChange={(e) => setCfg((c) => patchActiveSlot(c, { apiKey: e.target.value }))}
                      className="min-w-0 flex-1 basis-[min(100%,12rem)] rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                      placeholder="可选；留空则使用服务端环境变量"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="shrink-0 rounded-lg border border-slate-200 px-2.5 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      aria-label={showKey ? '隐藏密钥' : '显示密钥'}
                    >
                      {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                    <button
                      type="button"
                      disabled={pingStatus === 'testing'}
                      onClick={handleTestConnection}
                      className={cn(
                        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                        'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                        'dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-100 dark:hover:bg-indigo-900/60',
                      )}
                    >
                      {pingStatus === 'testing' ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Zap className="size-3.5" aria-hidden />
                      )}
                      测试连接
                    </button>
                  </div>
                  {pingStatus === 'success' && pingMessage && (
                    <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">{pingMessage}</p>
                  )}
                  {pingStatus === 'error' && pingMessage && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">{pingMessage}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    可不填：未填时由服务端 <code className="text-indigo-700 dark:text-indigo-300">.env</code> 回落。
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Base URL</label>
                  <input
                    value={slot.baseUrl}
                    onChange={(e) => setCfg((c) => patchActiveSlot(c, { baseUrl: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                    placeholder={preset.defaultBaseUrl}
                  />
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {endpointHint(slot.providerType, slot.baseUrl.trim() || preset.defaultBaseUrl)}
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">模型</span>
                    <button
                      type="button"
                      className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                      onClick={() => {
                        const p = getPresetById(cfg.activePresetId);
                        if (!p) return;
                        const first = p.models[0]!;
                        setCfg((c) =>
                          patchActiveSlot(c, {
                            modelString: modelStringFor(p.providerType, first.id),
                            baseUrl: p.defaultBaseUrl,
                            providerType: p.providerType,
                          }),
                        );
                      }}
                    >
                      重置为默认
                    </button>
                  </div>
                  <ul className="max-h-[280px] space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-1 dark:border-slate-600">
                    {preset.models.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setCfg((c) =>
                              patchActiveSlot(c, {
                                modelString: modelStringFor(preset.providerType, m.id),
                                providerType: preset.providerType,
                              }),
                            )
                          }
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm',
                            currentModelId === m.id
                              ? 'bg-indigo-100 text-indigo-950 dark:bg-indigo-900/50 dark:text-indigo-50'
                              : 'text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80',
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium leading-snug">{m.label}</span>
                            {(m.contextHint || m.outputHint) && (
                              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                                {m.contextHint != null && m.contextHint !== '' && (
                                  <span className="inline-flex items-center gap-0.5 tabular-nums">
                                    <span className="opacity-70">上下文</span>
                                    {m.contextHint}
                                  </span>
                                )}
                                {m.outputHint != null && m.outputHint !== '' && (
                                  <span className="inline-flex items-center gap-0.5 tabular-nums">
                                    <span className="opacity-70">输出</span>
                                    {m.outputHint}
                                  </span>
                                )}
                              </span>
                            )}
                          </span>
                          {currentModelId === m.id && <Check className="size-4 shrink-0 text-indigo-600 dark:text-indigo-300" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">自定义 x-model（完整字符串）</label>
                    <input
                      value={slot.modelString}
                      onChange={(e) =>
                        setCfg((c) =>
                          patchActiveSlot(c, {
                            modelString: e.target.value.trim() || getResolvedActiveSlot(c).modelString,
                          }),
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs dark:border-slate-600 dark:bg-slate-950"
                    />
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  请求头与 OpenMAIC 一致：<code className="text-indigo-700 dark:text-indigo-300">x-model</code>、
                  <code className="text-indigo-700 dark:text-indigo-300">x-provider-type</code>、
                  <code className="text-indigo-700 dark:text-indigo-300">x-api-key</code>、
                  <code className="text-indigo-700 dark:text-indigo-300">x-base-url</code>。
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            关闭
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
