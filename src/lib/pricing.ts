export const PRICING: Record<string, { input: number; output: number; cache_create: number; cache_read: number }> = {
  "claude-opus-4-6":           { input: 15.00, output: 75.00, cache_create: 18.75, cache_read: 1.50 },
  "claude-sonnet-4-6":         { input:  3.00, output: 15.00, cache_create:  3.75, cache_read: 0.30 },
  "claude-haiku-4-5-20251001": { input:  0.80, output:  4.00, cache_create:  1.00, cache_read: 0.08 },
};

export function getPricing(model: string) {
  if (model in PRICING) return PRICING[model];
  if (model.includes("opus"))   return PRICING["claude-opus-4-6"];
  if (model.includes("sonnet")) return PRICING["claude-sonnet-4-6"];
  if (model.includes("haiku"))  return PRICING["claude-haiku-4-5-20251001"];
  return { input: 3.0, output: 15.0, cache_create: 3.75, cache_read: 0.30 };
}
