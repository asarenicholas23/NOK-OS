// Evidence and confidence on strategic insights. Shared by the app, the API
// server (Gemini) and the Claude connector. No Firebase imports.

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export const CONFIDENCE_HELP: Record<Confidence, string> = {
  high: "Clear pattern across enough posts and time",
  medium: "Some support, but limited data or a single period",
  low: "Weak or no data: treat as a hypothesis to test",
};

const RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };

// Data limits cap how sure an insight can claim to be: no data -> low,
// under 10 posts -> at most medium.
export function capConfidence(c: unknown, opts: { hasData: boolean; posts?: number }): Confidence {
  const given: Confidence = (CONFIDENCE_LEVELS as readonly string[]).includes(c as string) ? (c as Confidence) : "low";
  const cap: Confidence = !opts.hasData ? "low" : (opts.posts ?? 0) < 10 ? "medium" : "high";
  return RANK[given] <= RANK[cap] ? given : cap;
}
