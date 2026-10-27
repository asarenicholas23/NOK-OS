// Shared context for every Gemini feature: the brand guide and analytics
// computed in code (the same summary the Claude connector returns), plus the
// honesty rules all prompts include.
import type { Firestore } from "firebase-admin/firestore";
import { summarizeAnalytics, type AnalyticsRow } from "../mcp/analytics";
import { DEMO_BRAND_IDS, isFakeRecord } from "../mcp/fakeData";

export class ContextError extends Error {}

export type AnalyticsSummary = ReturnType<typeof summarizeAnalytics>;

export const field = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "Not specified");

export const HONESTY_RULES = `
HONESTY RULES (strict)
- Never invent statistics, percentages, growth forecasts, ROI, client results, testimonials, quotes, prices,
  competitor facts, partner names or dates. Do not estimate or predict numbers.
- Only cite numbers that appear in the ANALYTICS SUMMARY, exactly as given. If the data can't support a claim,
  say "insufficient data" instead of guessing.
- If a brand field says "Not specified", don't fill it in with assumptions presented as fact; say what is unknown.`;

// Rows the browser sends (e.g. a file being imported, not yet saved) are reduced
// to the numeric fields the summary needs.
function cleanRows(rows: unknown[]): AnalyticsRow[] {
  return rows.slice(0, 5000).map((r: any, i) => ({
    id: String(r?.id ?? `row-${i}`),
    title: typeof r?.title === "string" ? r.title.slice(0, 200) : undefined,
    platform: typeof r?.platform === "string" ? r.platform : undefined,
    type: typeof r?.type === "string" ? r.type : undefined,
    impressions: Number(r?.impressions) || 0,
    engagement: Number(r?.engagement) || 0,
    reach: r?.reach == null ? undefined : Number(r.reach) || 0,
    likes: r?.likes == null ? undefined : Number(r.likes) || 0,
    comments: r?.comments == null ? undefined : Number(r.comments) || 0,
    shares: r?.shares == null ? undefined : Number(r.shares) || 0,
    saves: r?.saves == null ? undefined : Number(r.saves) || 0,
    follows: r?.follows == null ? undefined : Number(r.follows) || 0,
    dayOfWeek: typeof r?.dayOfWeek === "string" ? r.dayOfWeek : undefined,
    datePosted: typeof r?.datePosted === "string" ? r.datePosted : undefined,
    datasetType: r?.datasetType === "comparison" ? "comparison" : "baseline",
  }));
}

export async function loadBrandContext(db: Firestore, brandId: string, rowsOverride?: unknown[]) {
  if (typeof brandId !== "string" || !brandId) throw new ContextError("brandId is required.");
  if (DEMO_BRAND_IDS.has(brandId)) throw new ContextError("This is a demo brand.");
  const brandSnap = await db.collection("brands").doc(brandId).get();
  if (!brandSnap.exists) throw new ContextError("Brand not found.");
  const brand = brandSnap.data() as Record<string, any>;

  let rows: AnalyticsRow[];
  if (Array.isArray(rowsOverride) && rowsOverride.length) {
    rows = cleanRows(rowsOverride);
  } else {
    const snap = await db.collection("rawAnalytics").where("brandId", "==", brandId).get();
    rows = snap.docs.filter((d) => !isFakeRecord("rawAnalytics", d.id, d.data())).map((d) => ({ ...d.data(), id: d.id }) as AnalyticsRow);
  }
  const summary = rows.length ? summarizeAnalytics(rows) : null;
  return { brand, summary };
}

export function compactAnalytics(summary: AnalyticsSummary | null) {
  if (!summary) return "No analytics have been imported for this brand.";
  return JSON.stringify({
    scope: summary.scope,
    totals: summary.totals,
    byPlatform: summary.byPlatform.slice(0, 6).map(({ key, posts, impressions, engagementRate }) => ({ key, posts, impressions, engagementRate })),
    byFormat: summary.byFormat.slice(0, 6).map(({ key, posts, impressions, engagementRate }) => ({ key, posts, impressions, engagementRate })),
    byWeekday: summary.byWeekday.map(({ key, posts, engagementRate }) => ({ key, posts, engagementRate })),
    topPosts: summary.topPosts.slice(0, 3),
    bottomPosts: summary.bottomPosts.slice(0, 3),
    periodChange: summary.periodChange ? { basis: summary.periodChange.basis, change: summary.periodChange.change } : null,
    dataNotes: summary.dataNotes,
  });
}

export function brandBlock(brand: Record<string, any>) {
  return `BRAND CONTEXT
- Name: ${field(brand.name)}
- Description: ${field(brand.brandDescription)}
- Industry: ${field(brand.industry)}
- Tagline: ${field(brand.tagline)}
- Voice & tone: ${field(brand.voiceTone)}
- Campaign objective: ${field(brand.campaignObjective)}
- Content pillars: ${field(brand.contentPillars)}
- Audience personas: ${field(brand.audiencePersonas)}
- Competitor context: ${field(brand.competitorContext)}
- Platform notes: ${field(brand.platformNotes)}`;
}

const STANDPOINTS = ["analytics", "observation", "opportunity", "pattern", "lesson"];

// Enforces the honesty rules on model output for insights: without data there
// are no "analytics" claims and no numbers; with data, a change that isn't an
// observed number becomes "insufficient data". Also fixes enum values.
export function sanitizeInsights(raw: unknown, fromData: boolean, max: number) {
  return (Array.isArray(raw) ? raw : []).slice(0, max).map((i: any) => {
    let standpoint = STANDPOINTS.includes(i?.standpoint) ? i.standpoint : "observation";
    let change = typeof i?.change === "string" && i.change.trim() ? i.change.trim() : "insufficient data";
    if (!fromData) {
      if (standpoint === "analytics") standpoint = "opportunity";
      change = "insufficient data";
    } else if (!/\d/.test(change)) {
      change = "insufficient data";
    }
    return {
      title: String(i?.title || "").slice(0, 160),
      desc: String(i?.desc || "").slice(0, 2000),
      standpoint,
      metric: String(i?.metric || "").slice(0, 80),
      change: change.slice(0, 60),
      type: ["positive", "warning", "neutral"].includes(i?.type) ? i.type : "neutral",
    };
  }).filter((i) => i.title && i.desc);
}
