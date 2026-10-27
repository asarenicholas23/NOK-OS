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
  ...Array.from({ length: 12 }, (_, i) => `m-${i + 1}`),
  "idea-acme-1", "idea-acme-2", "idea-acme-3", "idea-global-1", "idea-global-2",
  "idea-horizon-1", "idea-horizon-2", "idea-horizon-3",
]);

// Why a record counts as fake, for the cleanup report.
export function fakeReason(collection: string, docId: string, data: Record<string, any>): string | null {
  if (collection === "brands" && DEMO_BRAND_IDS.has(docId)) return "demo brand";
  if (DEMO_BRAND_IDS.has(data.brandId)) return `belongs to demo brand ${data.brandId}`;
  if (SEEDED_DOC_IDS.has(docId)) return "created by the old seed function";
  if (collection === "rawAnalytics" && typeof data.id === "string" && /^(demo|comp)-/.test(data.id)) return "sample analytics row (Performance Intelligence sandbox)";
  if (collection === "strategicInsights" && SEEDED_INSIGHT_TITLES.has(data.title)) return "auto-seeded sample insight";
  if (collection === "brandDirections" && SEEDED_DIRECTION_PILLARS.has(data.pillar)) return "auto-seeded sample direction";
  return null;
}

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
  return fakeReason(collection, docId, data) !== null;
}
