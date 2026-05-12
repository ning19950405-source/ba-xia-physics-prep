/** Strip ```json fences and parse JSON */
export function parseJsonFromModel(text: string): unknown {
  let s = text.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  }
  return JSON.parse(s.trim()) as unknown;
}
