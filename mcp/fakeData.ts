// Records that were created by the app's demo/seed code rather than by real
// work. The connector hides them so Claude never treats them as real data.
// (Phase 3 removes the code that creates them; this list can shrink after the
// existing records are cleaned up.)

export const DEMO_BRAND_IDS = new Set(["acme-corp", "global-ind", "horizon-tech"]);

// Doc ids written by seedDatabaseIfEmpty (FALLBACK_* in src/lib/firebase.ts).
const SEEDED_DOC_IDS = new Set([
  "q-1", "q-2", "q-3", "q-4",
  "e-1", "e-2", "e-3",
  "brief-sc-w1-d1", "brief-sc-w1-d2", "brief-sc-w1-d3", "brief-sc-w1-d4", "brief-sc-w1-d5",
  "brief-nw-w1-d1", "brief-nw-w1-d2", "brief-vi-w1-d1", "b-1", "b-2",
]);

// Titles auto-written by InsightsPage / DirectionsPage when a brand had none.
const SEEDED_INSIGHT_TITLES = new Set([
  "LinkedIn Engagement Surge",
  "Friday Deployment Friction",
  "Developer Documentation Crossover",
  "Weekly Readership Recurrence",
  "Pricing Transparency Trust",
]);
const SEEDED_DIRECTION_PILLARS = new Set(["Technical Superiority", "Capital Efficiency Advocacy"]);

export function isFakeRecord(collection: string, docId: string, data: Record<string, any>): boolean {
  if (DEMO_BRAND_IDS.has(data.brandId)) return true;
  if (SEEDED_DOC_IDS.has(docId)) return true;
  // Demo analytics rows keep their original "demo-…"/"comp-…" id as a field.
  if (collection === "rawAnalytics" && typeof data.id === "string" && /^(demo|comp)-/.test(data.id)) return true;
  if (collection === "strategicInsights" && SEEDED_INSIGHT_TITLES.has(data.title)) return true;
  if (collection === "brandDirections" && SEEDED_DIRECTION_PILLARS.has(data.pillar)) return true;
  return false;
}
