/** 与上游请求头 x-provider-type 一致 */
export type WireProviderType = 'openai' | 'anthropic' | 'google';

/** 单个厂商预设下保存的一条配置 */
export type PresetSlot = {
  apiKey: string;
  baseUrl: string;
  modelString: string;
  providerType: WireProviderType;
};
