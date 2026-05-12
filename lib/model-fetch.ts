/** 与八下物理备课 lib/llm 中原逻辑一致：可配置超时 + 合并上游 abort */

export function createFetchWithTimeout(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const upstream = init?.signal;
    if (upstream) {
      if (upstream.aborted) {
        clearTimeout(timer);
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      upstream.addEventListener('abort', () => controller.abort(), { once: true });
    }
    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  };
}

export function getFetchTimeoutMs(): number {
  return Math.max(
    15_000,
    Math.min(300_000, Number(process.env.OPENAI_FETCH_TIMEOUT_MS) || 120_000),
  );
}
