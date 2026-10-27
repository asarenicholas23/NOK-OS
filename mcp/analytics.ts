// Analytics summary computed in code from imported rawAnalytics rows.
// Everything here is arithmetic on real rows; when the data can't support a
// figure, the figure is null and a note says why. Nothing is estimated.

export interface AnalyticsRow {
  id: string;
  title?: string;
  platform?: string;
  type?: string;
  impressions?: number;
  engagement?: number;
  engagementRate?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  follows?: number;
  dayOfWeek?: string;
  datePosted?: string; // YYYY-MM-DD, set by the importer when the file had a date
  datasetType?: "baseline" | "comparison";
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);
const round = (v: number, dp = 2) => Math.round(v * 10 ** dp) / 10 ** dp;
const pct = (part: number, whole: number) => (whole > 0 ? round((part / whole) * 100) : null);

// Metrics that only some exports include. A total is null (not 0) when no
// row in the group has the field, so "not tracked" never reads as "zero".
const OPTIONAL_METRICS = ["reach", "saves", "shares", "comments", "follows"] as const;
type OptionalMetric = (typeof OPTIONAL_METRICS)[number];

type Totals = {
  posts: number;
  impressions: number;
  engagement: number;
  // Total engagement / total impressions, as a percentage.
  engagementRate: number | null;
} & Record<OptionalMetric, number | null>;

function totals(rows: AnalyticsRow[]): Totals {
  let impressions = 0;
  let engagement = 0;
  for (const r of rows) {
    impressions += num(r.impressions);
    engagement += num(r.engagement);
  }
  const optional = Object.fromEntries(
    OPTIONAL_METRICS.map((m) => {
      const present = rows.filter((r) => r[m] !== undefined && r[m] !== null && r[m] !== "" as any);
      return [m, present.length ? present.reduce((acc, r) => acc + num(r[m]), 0) : null];
    }),
  ) as Record<OptionalMetric, number | null>;
  return { posts: rows.length, impressions, engagement, engagementRate: pct(engagement, impressions), ...optional };
}

function groupBy(rows: AnalyticsRow[], key: (r: AnalyticsRow) => string | undefined) {
  const groups = new Map<string, AnalyticsRow[]>();
  for (const r of rows) {
    const k = (key(r) || "").trim() || "Unknown";
    groups.set(k, [...(groups.get(k) || []), r]);
  }
  return [...groups.entries()]
    .map(([k, rs]) => ({ key: k, ...totals(rs) }))
    .sort((a, b) => b.posts - a.posts);
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function postSummary(r: AnalyticsRow) {
  return {
    id: r.id,
    title: (r.title || "").slice(0, 90),
    platform: r.platform || null,
    type: r.type || null,
    datePosted: r.datePosted || null,
    impressions: num(r.impressions),
    engagement: num(r.engagement),
    engagementRate: pct(num(r.engagement), num(r.impressions)),
  };
}

function change(curr: Totals, prev: Totals) {
  const rel = (c: number | null, p: number | null) => (c !== null && p !== null && p > 0 ? round(((c - p) / p) * 100, 1) : null);
  return {
    postsPct: rel(curr.posts, prev.posts),
    impressionsPct: rel(curr.impressions, prev.impressions),
    reachPct: rel(curr.reach, prev.reach),
    engagementPct: rel(curr.engagement, prev.engagement),
    // Percentage-point difference, not a relative change.
    engagementRatePoints:
      curr.engagementRate !== null && prev.engagementRate !== null ? round(curr.engagementRate - prev.engagementRate) : null,
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function shiftDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface SummaryOptions {
  from?: string;
  to?: string;
  compare?: "datasets" | "previous_period" | "none";
  topN?: number;
}

export function summarizeAnalytics(allRows: AnalyticsRow[], opts: SummaryOptions = {}) {
  const notes: string[] = [];
  const topN = Math.min(Math.max(opts.topN ?? 5, 1), 10);
  const dated = allRows.filter((r) => r.datePosted && ISO_DATE.test(r.datePosted));
  const undatedCount = allRows.length - dated.length;

  // Pick the rows being described ("current") and what they're compared with.
  let current = allRows;
  let previous: AnalyticsRow[] | null = null;
  let basis: string | null = null;
  const hasComparisonSet = allRows.some((r) => r.datasetType === "comparison");
  const compare = opts.compare ?? (opts.from || opts.to ? "previous_period" : hasComparisonSet ? "datasets" : "none");

  if (opts.from || opts.to) {
    const from = opts.from || "0000-01-01";
    const to = opts.to || "9999-12-31";
    current = dated.filter((r) => r.datePosted! >= from && r.datePosted! <= to);
    if (undatedCount > 0) notes.push(`${undatedCount} rows have no post date and are left out of date-filtered figures.`);
  }

  if (compare === "datasets") {
    if (hasComparisonSet) {
      const base = current.filter((r) => r.datasetType !== "comparison");
      const comp = current.filter((r) => r.datasetType === "comparison");
      current = comp;
      previous = base;
      basis = "comparison dataset vs baseline dataset (as imported)";
    } else {
      notes.push("No comparison dataset has been imported, so there is no dataset comparison.");
    }
  } else if (compare === "previous_period") {
    if (opts.from && opts.to) {
      const lengthDays = Math.round((Date.parse(opts.to) - Date.parse(opts.from)) / 86_400_000) + 1;
      const prevTo = shiftDays(opts.from, -1);
      const prevFrom = shiftDays(opts.from, -lengthDays);
      previous = dated.filter((r) => r.datePosted! >= prevFrom && r.datePosted! <= prevTo);
      basis = `${opts.from}..${opts.to} vs ${prevFrom}..${prevTo}`;
    } else {
      notes.push("Period comparison needs both from and to dates.");
    }
  }

  const ranked = current.filter((r) => num(r.impressions) > 0);
  const byRate = [...ranked].sort(
    (a, b) => num(b.engagement) / num(b.impressions) - num(a.engagement) / num(a.impressions),
  );
  const zeroImpressions = current.length - ranked.length;
  if (zeroImpressions > 0) notes.push(`${zeroImpressions} rows have 0 impressions and are left out of top/bottom rankings.`);
  if (current.length < 10) notes.push(`Only ${current.length} posts in scope; treat patterns as weak signals.`);

  for (const m of OPTIONAL_METRICS) {
    const have = current.filter((r) => r[m] !== undefined && r[m] !== null).length;
    if (have > 0 && have < current.length) notes.push(`${m} is only recorded for ${have} of ${current.length} posts; its totals cover those posts only.`);
  }

  const datesInScope = current.map((r) => r.datePosted).filter((d): d is string => !!d && ISO_DATE.test(d)).sort();
  const curTotals = totals(current);
  const prevTotals = previous && previous.length > 0 ? totals(previous) : null;
  if (previous && previous.length === 0) notes.push("The comparison period has no posts, so there is no change figure.");

  return {
    scope: {
      posts: current.length,
      dateRange: datesInScope.length ? { first: datesInScope[0], last: datesInScope[datesInScope.length - 1] } : null,
      platforms: [...new Set(current.map((r) => r.platform || "Unknown"))],
    },
    definitions: {
      engagementRate: "total engagement / total impressions x 100, computed from the rows (not averaged per post)",
    },
    totals: curTotals,
    byPlatform: groupBy(current, (r) => r.platform),
    byFormat: groupBy(current, (r) => r.type),
    byWeekday: groupBy(current, (r) => r.dayOfWeek).sort(
      (a, b) => (WEEKDAYS.indexOf(a.key) + 8) % 8 - (WEEKDAYS.indexOf(b.key) + 8) % 8,
    ),
    byMonth: datesInScope.length ? groupBy(current.filter((r) => r.datePosted), (r) => r.datePosted!.slice(0, 7)).sort((a, b) => a.key.localeCompare(b.key)) : [],
    topPosts: byRate.slice(0, topN).map(postSummary),
    // Never repeat a top post in the bottom list when there are few posts.
    bottomPosts: byRate.slice(Math.max(topN, byRate.length - topN)).reverse().map(postSummary),
    periodChange: prevTotals ? { basis, previous: prevTotals, change: change(curTotals, prevTotals) } : null,
    dataNotes: notes,
  };
}
