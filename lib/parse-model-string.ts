/**
 * 与 OpenMAIC 一致：`providerId:modelId`，无冒号则视为 OpenAI 的 modelId
 */
export function parseModelString(modelString: string): { providerId: string; modelId: string } {
  const colonIndex = modelString.indexOf(':');
  if (colonIndex > 0) {
    return {
      providerId: modelString.slice(0, colonIndex),
      modelId: modelString.slice(colonIndex + 1),
    };
  }
  return { providerId: 'openai', modelId: modelString };
}
