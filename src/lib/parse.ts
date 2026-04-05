import { getPricing } from "./pricing";

export interface ParsedCall {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreateTokens: number;
  cacheReadTokens: number;
  cost: number;
  timestamp: string;
}

export function parseJsonlContent(text: string): ParsedCall[] {
  const calls: ParsedCall[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let d: Record<string, unknown>;
    try {
      d = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (d.type !== "assistant") continue;
    const msg = d.message as Record<string, unknown> | undefined;
    if (!msg) continue;
    const usage = msg.usage as Record<string, number> | undefined;
    const model = msg.model as string | undefined;
    const ts = d.timestamp as string | undefined;
    if (!usage || !model || model === "<synthetic>") continue;

    const inp = usage.input_tokens || 0;
    const out = usage.output_tokens || 0;
    const cc = usage.cache_creation_input_tokens || 0;
    const cr = usage.cache_read_input_tokens || 0;
    const p = getPricing(model);
    const cost =
      (inp / 1e6) * p.input +
      (out / 1e6) * p.output +
      (cc / 1e6) * p.cache_create +
      (cr / 1e6) * p.cache_read;

    calls.push({
      model,
      inputTokens: inp,
      outputTokens: out,
      cacheCreateTokens: cc,
      cacheReadTokens: cr,
      cost,
      timestamp: ts || "",
    });
  }
  return calls;
}
