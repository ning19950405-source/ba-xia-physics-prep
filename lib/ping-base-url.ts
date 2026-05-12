/**
 * 服务端「测试连接」时对用户填写的 Base URL 做粗粒度限制，降低 SSRF 风险。
 * 开发环境仍允许 localhost（如 Ollama）。
 */
export function assertPingBaseUrlAllowed(raw: string | undefined): void {
  const s = raw?.trim();
  if (!s) return;

  let url: URL;
  try {
    url = new URL(s);
  } catch {
    throw new Error('Base URL 格式无效');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Base URL 仅支持 http 或 https');
  }

  if (process.env.NODE_ENV !== 'production') return;

  const h = url.hostname.toLowerCase();
  const blocked =
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '0.0.0.0' ||
    h === '[::1]' ||
    h === 'metadata.google.internal' ||
    h.endsWith('.local');

  if (blocked) {
    throw new Error('生产环境不允许将 Base URL 指向本机或链路本地地址（请在本地开发环境测试）');
  }
}
