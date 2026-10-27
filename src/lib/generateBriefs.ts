import { apiFetch } from "./apiBase";
import { safeParseBriefContent, type BriefContent, type BriefHeader } from "./briefs";
import type { BrandDirection } from "./firebase";

type CreateV2Brief = (content: BriefContent, header?: Partial<Omit<BriefHeader, "id" | "brandId">>) => Promise<string>;

// The one brief-generation path for every screen (Studio, Directions). The
// server writes v2 briefs from the brand guide, analytics and the approved
// directions; each one is re-checked here and saved as a Draft for review.
export async function generateBriefs(opts: {
  brandId: string;
  directions: BrandDirection[];
  count: number;
  createV2Brief: CreateV2Brief;
}): Promise<{ saved: number; failed: string[] }> {
  const response = await apiFetch("/api/generate-briefs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brandId: opts.brandId,
      approvedDirections: opts.directions.map(({ pillar, strategy, focus, checklist }) => ({ pillar, strategy, focus, checklist })),
      count: opts.count,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data.failed) && data.failed.length ? ` (${data.failed[0]})` : "";
    throw new Error((data.error || "Brief generation failed.") + detail);
  }

  const failed: string[] = Array.isArray(data.failed) ? data.failed : [];
  let saved = 0;
  for (const raw of Array.isArray(data.briefs) ? data.briefs : []) {
    const parsed = safeParseBriefContent(raw);
    if ("errors" in parsed) {
      failed.push(parsed.errors[0]);
      continue;
    }
    await opts.createV2Brief(parsed.content, { status: "Draft" });
    saved++;
  }
  return { saved, failed };
}
