import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Firestore } from "firebase-admin/firestore";
import { DEMO_BRAND_IDS, isFakeRecord } from "./fakeData";
import { summarizeAnalytics, type AnalyticsRow } from "./analytics";
import { logToolCall } from "./audit";

type Doc = Record<string, any> & { id: string };

// ---------- shared helpers ----------

export class ToolError extends Error {}

const brandId = z.string().min(1).max(128).describe("Brand id from list_brands.");
const limit = (dflt: number, max: number) =>
  z.number().int().min(1).max(max).default(dflt).describe(`Max items to return (default ${dflt}, max ${max}).`);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const clip = (v: unknown, max: number) => {
  if (typeof v !== "string") return v ?? null;
  return v.length > max ? `${v.slice(0, max)}…` : v;
};

// Newest first, by createdAt (ISO string) when present.
const newestFirst = (a: Doc, b: Doc) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""));

// Brief dates are usually YYYY-MM-DD, but older AI-generated ones are M/D/YYYY.
export function normalizeDate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : null;
}

async function loadBrand(db: Firestore, id: string): Promise<Doc> {
  if (DEMO_BRAND_IDS.has(id)) throw new ToolError(`Brand "${id}" is demo data, not a real brand.`);
  const snap = await db.collection("brands").doc(id).get();
  if (!snap.exists) throw new ToolError(`No brand with id "${id}". Call list_brands to see valid ids.`);
  return { ...(snap.data() as Record<string, any>), id: snap.id };
}

// All real docs for one brand in a collection. Fake/seed records are dropped
// and counted so responses can say how many were hidden.
async function brandDocs(db: Firestore, collection: string, id: string) {
  const snap = await db.collection(collection).where("brandId", "==", id).get();
  const docs: Doc[] = [];
  let hidden = 0;
  snap.forEach((d) => {
    const data = d.data();
    if (isFakeRecord(collection, d.id, data)) hidden++;
    else docs.push({ ...data, id: d.id });
  });
  return { docs, hidden };
}

const withHidden = <T extends object>(body: T, hidden: number) =>
  hidden > 0 ? { ...body, hiddenDemoRecords: hidden } : body;

// Per-request flag so the HTTP layer can tell whether a tool handler ran
// (and logged). Calls the SDK rejects before the handler are logged there.
export type CallContext = { logged: boolean };

// Registers a tool with uniform logging, error handling and JSON output.
export function addTool<S extends z.ZodRawShape>(
  server: McpServer,
  db: Firestore,
  ctx: CallContext,
  name: string,
  config: { title: string; description: string; inputSchema: S; readOnly: boolean },
  handler: (args: z.objectOutputType<S, z.ZodTypeAny>) => Promise<{ body: unknown; itemCount?: number }>,
) {
  server.registerTool(
    name,
    {
      title: config.title,
      description: config.description,
      inputSchema: config.inputSchema,
      annotations: config.readOnly
        ? { readOnlyHint: true, openWorldHint: false }
        : { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    (async (args: any) => {
      const started = Date.now();
      ctx.logged = true;
      const brand = typeof args?.brandId === "string" ? args.brandId : undefined;
      try {
        const { body, itemCount } = await handler(args);
        logToolCall(db, { tool: name, brandId: brand, ok: true, ms: Date.now() - started, itemCount });
        return { content: [{ type: "text" as const, text: JSON.stringify(body) }] };
      } catch (err: any) {
        const message = err instanceof ToolError ? err.message : "Internal error in NOK OS. Nothing was changed; try again.";
        if (!(err instanceof ToolError)) console.error(`[mcp] ${name} failed:`, err);
        logToolCall(db, { tool: name, brandId: brand, ok: false, ms: Date.now() - started, error: message });
        return { isError: true, content: [{ type: "text" as const, text: message }] };
      }
    }) as any,
  );
}

// ---------- read tools ----------

export function registerReadTools(server: McpServer, db: Firestore, ctx: CallContext) {
  addTool(server, db, ctx, "list_brands", {
    title: "List brands",
    description: "List the client brands in NOK OS. Use the returned id as brandId in every other tool.",
    inputSchema: {},
    readOnly: true,
  }, async () => {
    const snap = await db.collection("brands").get();
    const brands = snap.docs
      .filter((d) => !DEMO_BRAND_IDS.has(d.id))
      .map((d) => {
        const b = d.data();
        return { id: d.id, name: b.name, industry: b.industry || null, domain: b.domain || null, tagline: b.tagline || null };
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return { body: { brands }, itemCount: brands.length };
  });

  addTool(server, db, ctx, "get_brand_context", {
    title: "Get brand context",
    description:
      "Brand profile and brand-guide fields: description, campaign objective, voice and tone, content pillars, " +
      "audience personas, competitor context and platform notes. Read this before writing anything for a brand. " +
      "Empty fields are null: do not fill them in with guesses.",
    inputSchema: { brandId },
    readOnly: true,
  }, async ({ brandId }) => {
    const b = await loadBrand(db, brandId);
    const pick = (k: string) => (typeof b[k] === "string" && b[k].trim() ? b[k] : null);
    return {
      body: {
        id: b.id,
        name: b.name,
        domain: pick("domain"),
        industry: pick("industry"),
        tagline: pick("tagline"),
        voiceTone: pick("voiceTone"),
        brandDescription: pick("brandDescription"),
        campaignObjective: pick("campaignObjective"),
        contentPillars: pick("contentPillars"),
        audiencePersonas: pick("audiencePersonas"),
        competitorContext: pick("competitorContext"),
        platformNotes: pick("platformNotes"),
      },
    };
  });

  addTool(server, db, ctx, "get_analytics_summary", {
    title: "Get analytics summary",
    description:
      "Performance summary computed from the brand's imported social analytics: totals, engagement rate, " +
      "breakdowns by platform / format / weekday / month, top and bottom posts, and change vs a comparison. " +
      "compare: 'datasets' = imported comparison set vs baseline set; 'previous_period' = from..to vs the same-length " +
      "period just before (needs from and to); 'none'. Default: previous_period if dates are given, else datasets if a " +
      "comparison set exists. Read dataNotes: they say what the data cannot support. Use get_analytics_rows for post detail.",
    inputSchema: {
      brandId,
      from: isoDate.optional().describe("Only posts on/after this date (YYYY-MM-DD)."),
      to: isoDate.optional().describe("Only posts on/before this date (YYYY-MM-DD)."),
      compare: z.enum(["datasets", "previous_period", "none"]).optional(),
      topN: z.number().int().min(1).max(10).default(5),
      minImpressions: z.number().int().min(0).optional()
        .describe("Leave posts below this many impressions out of top/bottom rankings. Default: 20% of the median."),
    },
    readOnly: true,
  }, async ({ brandId, from, to, compare, topN, minImpressions }) => {
    await loadBrand(db, brandId);
    const { docs, hidden } = await brandDocs(db, "rawAnalytics", brandId);
    if (docs.length === 0) {
      return { body: withHidden({ scope: { posts: 0 }, dataNotes: ["No analytics have been imported for this brand."] }, hidden), itemCount: 0 };
    }
    const summary = summarizeAnalytics(docs as AnalyticsRow[], { from, to, compare, topN, minImpressions });
    return { body: withHidden(summary, hidden), itemCount: summary.scope.posts };
  });

  addTool(server, db, ctx, "get_analytics_rows", {
    title: "Get analytics rows",
    description: "Individual imported posts with their metrics, for detail behind get_analytics_summary. Filter and sort to keep it small.",
    inputSchema: {
      brandId,
      platform: z.string().max(40).optional(),
      type: z.string().max(40).optional().describe("Post format, e.g. Reel, Carousel."),
      from: isoDate.optional(),
      to: isoDate.optional(),
      sortBy: z.enum(["engagementRate", "impressions", "engagement", "reach", "datePosted"]).default("engagementRate"),
      order: z.enum(["desc", "asc"]).default("desc"),
      limit: limit(20, 50),
    },
    readOnly: true,
  }, async ({ brandId, platform, type, from, to, sortBy, order, limit }) => {
    await loadBrand(db, brandId);
    const { docs, hidden } = await brandDocs(db, "rawAnalytics", brandId);
    const eq = (a: unknown, b?: string) => !b || String(a || "").toLowerCase() === b.toLowerCase();
    let rows = docs.filter((r) => eq(r.platform, platform) && eq(r.type, type));
    if (from || to) rows = rows.filter((r) => r.datePosted && r.datePosted >= (from || "") && r.datePosted <= (to || "9999"));
    const value = (r: Doc) =>
      sortBy === "engagementRate" ? (Number(r.impressions) > 0 ? Number(r.engagement) / Number(r.impressions) : -1)
        : sortBy === "datePosted" ? String(r.datePosted || "")
        : Number(r[sortBy]) || 0;
    rows.sort((a, b) => {
      const [x, y] = [value(a), value(b)];
      const cmp = typeof x === "string" ? x.localeCompare(String(y)) : (x as number) - (y as number);
      return order === "desc" ? -cmp : cmp;
    });
    const out = rows.slice(0, limit).map((r) => ({
      id: r.id,
      title: clip(r.title, 120),
      platform: r.platform ?? null,
      type: r.type ?? null,
      datePosted: r.datePosted ?? null,
      dayOfWeek: r.dayOfWeek ?? null,
      dataset: r.datasetType || "baseline",
      impressions: r.impressions ?? null,
      reach: r.reach ?? null,
      engagement: r.engagement ?? null,
      engagementRate: Number(r.impressions) > 0 ? Math.round((Number(r.engagement) / Number(r.impressions)) * 10000) / 100 : null,
      likes: r.likes ?? null,
      comments: r.comments ?? null,
      shares: r.shares ?? null,
      saves: r.saves ?? null,
      follows: r.follows ?? null,
      caption: clip(r.caption, 300),
    }));
    return { body: withHidden({ matched: rows.length, returned: out.length, rows: out }, hidden), itemCount: out.length };
  });

  addTool(server, db, ctx, "list_insights", {
    title: "List strategic insights",
    description: "Strategic insights for a brand, newest first. Filter by status or by who created them.",
    inputSchema: {
      brandId,
      status: z.enum(["Draft", "Pending", "Approved", "Rejected"]).optional(),
      createdBy: z.enum(["claude", "app"]).optional().describe("'claude' = drafted through this connector; 'app' = everything else."),
      limit: limit(20, 100),
    },
    readOnly: true,
  }, async ({ brandId, status, createdBy, limit }) => {
    await loadBrand(db, brandId);
    const { docs, hidden } = await brandDocs(db, "strategicInsights", brandId);
    const items = docs
      .filter((d) => (!status || d.status === status) && matchesCreator(d, createdBy))
      .sort(newestFirst)
      .slice(0, limit)
      .map((d) => ({
        id: d.id, status: d.status ?? null, title: d.title, desc: clip(d.desc, 600), standpoint: d.standpoint ?? null,
        metric: d.metric ?? null, change: d.change ?? null, type: d.type ?? null,
        createdAt: d.createdAt ?? null, createdBy: d.createdBy ?? "app",
      }));
    return { body: withHidden({ items }, hidden), itemCount: items.length };
  });

  addTool(server, db, ctx, "list_directions", {
    title: "List brand directions",
    description: "Content directions (pillars with strategy, focus and checklist) for a brand, newest first.",
    inputSchema: {
      brandId,
      status: z.enum(["Draft", "Pending", "Approved", "Rejected"]).optional(),
      createdBy: z.enum(["claude", "app"]).optional(),
      limit: limit(20, 100),
    },
    readOnly: true,
  }, async ({ brandId, status, createdBy, limit }) => {
    await loadBrand(db, brandId);
    const { docs, hidden } = await brandDocs(db, "brandDirections", brandId);
    const items = docs
      .filter((d) => (!status || (d.status || "Pending") === status) && matchesCreator(d, createdBy))
      .sort(newestFirst)
      .slice(0, limit)
      .map((d) => ({
        id: d.id, status: d.status || "Pending", pillar: d.pillar, strategy: clip(d.strategy, 600), focus: d.focus ?? null,
        checklist: Array.isArray(d.checklist) ? d.checklist : [], createdAt: d.createdAt ?? null, createdBy: d.createdBy ?? "app",
      }));
    return { body: withHidden({ items }, hidden), itemCount: items.length };
  });

  addTool(server, db, ctx, "list_briefs", {
    title: "List creative briefs",
    description:
      "Creative briefs for a brand (short fields only). Filter by status, creator or date range. " +
      "Use get_brief for one brief's full content.",
    inputSchema: {
      brandId,
      status: z.enum(["Draft", "Proposed", "Approved", "Changes Requested", "In Progress"]).optional(),
      createdBy: z.enum(["claude", "app"]).optional(),
      from: isoDate.optional(),
      to: isoDate.optional(),
      limit: limit(20, 100),
    },
    readOnly: true,
  }, async ({ brandId, status, createdBy, from, to, limit }) => {
    await loadBrand(db, brandId);
    const { docs, hidden } = await brandDocs(db, "briefs", brandId);
    const items = docs
      .map((d) => ({ d, date: normalizeDate(d.date) }))
      .filter(({ d, date }) =>
        (!status || d.status === status) && matchesCreator(d, createdBy) &&
        (!from || (date && date >= from)) && (!to || (date && date <= to)))
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || newestFirst(a.d, b.d))
      .slice(0, limit)
      .map(({ d, date }) => ({
        id: d.id, title: d.title, status: d.status ?? null, date, platform: d.platform ?? null, postType: d.postType ?? null,
        contentPillar: d.contentPillar ?? null, topicIdea: clip(d.topicIdea, 160), progressTracking: d.progressTracking ?? null,
        revisionNotes: clip(d.revisionNotes, 300), createdBy: d.createdBy ?? "app",
      }));
    return { body: withHidden({ items }, hidden), itemCount: items.length };
  });

  addTool(server, db, ctx, "get_brief", {
    title: "Get one brief",
    description: "Full content of one creative brief.",
    inputSchema: { brandId, briefId: z.string().min(1).max(128) },
    readOnly: true,
  }, async ({ brandId, briefId }) => {
    await loadBrand(db, brandId);
    const snap = await db.collection("briefs").doc(briefId).get();
    const data = snap.data();
    if (!snap.exists || !data || data.brandId !== brandId || isFakeRecord("briefs", snap.id, data)) {
      throw new ToolError(`No brief "${briefId}" for this brand.`);
    }
    return { body: { ...data, id: snap.id, date: normalizeDate(data.date) ?? data.date ?? null, createdBy: data.createdBy ?? "app" } };
  });

  addTool(server, db, ctx, "get_calendar", {
    title: "Get content calendar",
    description: "Calendar events and dated briefs for one month.",
    inputSchema: {
      brandId,
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
    },
    readOnly: true,
  }, async ({ brandId, year, month }) => {
    await loadBrand(db, brandId);
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const [events, briefs] = await Promise.all([
      brandDocs(db, "calendarEvents", brandId),
      brandDocs(db, "briefs", brandId),
    ]);
    const eventItems = events.docs
      .filter((e) => normalizeDate(e.date)?.startsWith(prefix))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((e) => ({ id: e.id, date: normalizeDate(e.date), title: e.title, type: e.type ?? null, status: e.status ?? null, notes: clip(e.notes, 200) }));
    const briefItems = briefs.docs
      .map((b) => ({ b, date: normalizeDate(b.date) }))
      .filter(({ date }) => date?.startsWith(prefix))
      .sort((x, y) => x.date!.localeCompare(y.date!))
      .map(({ b, date }) => ({ id: b.id, date, title: b.title, status: b.status ?? null, platform: b.platform ?? null, postType: b.postType ?? null, contentPillar: b.contentPillar ?? null }));
    const unscheduledBriefs = briefs.docs.filter((b) => !normalizeDate(b.date)).length;
    return {
      body: withHidden({ month: prefix, events: eventItems, briefs: briefItems, unscheduledBriefs }, events.hidden + briefs.hidden),
      itemCount: eventItems.length + briefItems.length,
    };
  });

  addTool(server, db, ctx, "list_recent_feedback", {
    title: "List review feedback",
    description:
      "Review decisions on this brand's insights, directions and briefs: approvals, rejections and change requests " +
      "with any notes. NOK OS does not yet record when a decision was made or why an insight/direction was rejected, " +
      "so results are not time-ordered and only brief change requests carry a reason.",
    inputSchema: { brandId, limit: limit(30, 100) },
    readOnly: true,
  }, async ({ brandId, limit }) => {
    await loadBrand(db, brandId);
    const [insights, directions, briefs] = await Promise.all([
      brandDocs(db, "strategicInsights", brandId),
      brandDocs(db, "brandDirections", brandId),
      brandDocs(db, "briefs", brandId),
    ]);
    const decided = (s: unknown) => s === "Approved" || s === "Rejected" || s === "Changes Requested";
    const items = [
      ...briefs.docs.filter((d) => decided(d.status)).map((d) => ({ kind: "brief", id: d.id, title: d.title, decision: d.status, reason: d.revisionNotes ?? null, approver: d.approver ?? null, createdBy: d.createdBy ?? "app" })),
      ...insights.docs.filter((d) => decided(d.status)).map((d) => ({ kind: "insight", id: d.id, title: d.title, decision: d.status, reason: null, createdBy: d.createdBy ?? "app" })),
      ...directions.docs.filter((d) => decided(d.status)).map((d) => ({ kind: "direction", id: d.id, title: d.pillar, decision: d.status, reason: null, createdBy: d.createdBy ?? "app" })),
    ].slice(0, limit);
    return {
      body: withHidden({ items, note: "Decision dates and insight/direction reasons are not stored yet." }, insights.hidden + directions.hidden + briefs.hidden),
      itemCount: items.length,
    };
  });

  addTool(server, db, ctx, "list_leads", {
    title: "List resource leads",
    description: "People who downloaded a resource from the public site (agency-wide, not tied to a brand). Newest first. Read-only.",
    inputSchema: { limit: limit(20, 100) },
    readOnly: true,
  }, async ({ limit }) => {
    const snap = await db.collection("leads").orderBy("timestamp", "desc").limit(limit).get();
    const items = snap.docs.map((d) => {
      const l = d.data();
      const ts = l.timestamp?.toDate ? l.timestamp.toDate().toISOString() : l.timestamp ?? null;
      return { id: d.id, name: l.name, email: l.email, businessName: l.businessName ?? null, resource: l.resourceTitle ?? null, source: l.source ?? null, at: ts };
    });
    return { body: { items }, itemCount: items.length };
  });

  addTool(server, db, ctx, "list_discovery_requests", {
    title: "List discovery call requests",
    description: "Discovery call bookings and manually added prospects (agency-wide). Newest first. Read-only.",
    inputSchema: {
      status: z.enum(["New", "Contacted", "Scheduled", "Converted", "Closed"]).optional(),
      limit: limit(20, 100),
    },
    readOnly: true,
  }, async ({ status, limit }) => {
    // Status is filtered in memory: combining where + orderBy would need a composite index.
    const snap = await db.collection("discoveryRequests").orderBy("createdAt", "desc").limit(status ? 500 : limit).get();
    const docs = snap.docs.filter((d) => !status || d.data().status === status).slice(0, limit);
    const items = docs.map((d) => {
      const r = d.data();
      return {
        id: d.id, name: r.name, email: r.email, businessName: r.businessName ?? null, serviceTier: r.serviceTier ?? null,
        status: r.status ?? null, notes: clip(r.notes, 400), slotStart: r.slotReleased ? null : r.slotStart ?? null,
        source: r.source || "booking", createdAt: r.createdAt ?? null,
      };
    });
    return { body: { items }, itemCount: items.length };
  });
}

function matchesCreator(d: Doc, createdBy?: "claude" | "app") {
  if (!createdBy) return true;
  return createdBy === "claude" ? d.createdBy === "claude" : d.createdBy !== "claude";
}
