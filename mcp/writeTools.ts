import crypto from "node:crypto";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import type { BrandDirection, StrategicInsight } from "../src/lib/firebase";
import { briefContentSchema, safeParseBriefContent, pickBriefContent, type CreativeBriefV1 } from "../src/lib/briefs";
import { addTool, ToolError, type CallContext } from "./readTools";
import { DEMO_BRAND_IDS } from "./fakeData";

// Write tools create DRAFTS ONLY. Every item gets status "Draft" and
// createdBy "claude"; nothing here can approve, delete, schedule or send.

// ---------- item schemas (strict: unknown fields are rejected) ----------

const text = (max: number) => z.string().trim().min(1).max(max);
const optText = (max: number) => z.string().trim().max(max).optional();

const insightItem = z.object({
  title: text(160),
  desc: text(2000).describe("The finding and the recommended action."),
  standpoint: z.enum(["analytics", "observation", "opportunity", "pattern", "lesson"])
    .describe("analytics = backed by imported numbers; observation/pattern/lesson = qualitative; opportunity = forward-looking idea."),
  metric: text(80).describe("The KPI this is about, e.g. 'Engagement rate'."),
  change: text(60).describe("The change actually seen in the data (e.g. '+4.0 pts'), or 'insufficient data'. Never a forecast."),
  type: z.enum(["positive", "warning", "neutral"]),
}).strict();

const directionItem = z.object({
  pillar: text(120),
  strategy: text(3000),
  focus: text(500).describe("Channels, formats or audience to focus on."),
  checklist: z.array(text(200)).min(1).max(8),
}).strict();

const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "TikTok", "Twitter/X", "YouTube", "Newsletter"] as const;
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

// v1 brief fields: only used to edit v1 drafts Claude made before briefs moved to v2.
const legacyBriefPatch = z.object({
  title: text(160),
  objective: text(600),
  targetAudience: text(600),
  keyMessage: text(600),
  deliverables: text(600).describe("Exact assets, e.g. '1x Instagram carousel (7 slides)'."),
  date: isoDate.optional().describe("Planned post date. Omit to leave the brief unscheduled."),
  platform: z.enum(PLATFORMS).optional(),
  postType: optText(40).describe("e.g. Carousel, Reel, Video, Artwork."),
  mainFocus: z.enum(["Reach", "Engagement", "Link Click", "Sales"]).optional(),
  contentPillar: optText(120),
  topicIdea: optText(200).describe("One-line hook for the calendar cell."),
  contentOutline: optText(8000).describe("Slide/scene/section breakdown with copy and design notes."),
  copywritingCaption: optText(3000).describe("Publish-ready caption in brand voice."),
  cta: optText(300),
  hashtags: optText(500),
  proofPoint: optText(600).describe("Real stat or example. If none exists, write 'PLACEHOLDER: needs real data' instead of inventing one."),
  formatSpec: optText(400),
  toneVisualRef: optText(600),
  visualReference: optText(400),
  successMetric: optText(200).describe("Target to review against, e.g. '>= 3% engagement rate'."),
  notes: optText(1000),
  campaignName: optText(120),
  workflowType: z.enum(["weekly", "campaign", "hybrid"]).optional(),
}).strict();

// Compile-time guard: every schema field must exist on the app's own type,
// with a compatible value type. Fails to compile if the two drift apart.
type Assert<T extends true> = T;
type Fits<S, T> = [Exclude<keyof S, keyof T>] extends [never] ? (S extends Partial<T> ? true : false) : false;
type _InsightFits = Assert<Fits<z.infer<typeof insightItem>, StrategicInsight>>;
type _DirectionFits = Assert<Fits<z.infer<typeof directionItem>, BrandDirection>>;
type _BriefFits = Assert<Fits<z.infer<typeof legacyBriefPatch>, CreativeBriefV1>>;

// v2 brief: the shared schema (same one generation and the editor use) plus an
// optional planned date.
const briefV2Item = briefContentSchema.extend({
  date: isoDate.optional().describe("Planned post date. Omit to leave the brief unscheduled."),
});


const KINDS = {
  insight: { collection: "strategicInsights", schema: insightItem },
  direction: { collection: "brandDirections", schema: directionItem },
  brief: { collection: "briefs", schema: legacyBriefPatch },
} as const;
type Kind = keyof typeof KINDS;

// ---------- helpers ----------

const brandId = z.string().min(1).max(128).describe("Brand id from list_brands.");
const requestId = z.string().regex(/^[A-Za-z0-9_-]{8,100}$/, "8-100 letters, digits, - or _")
  .describe("A unique id you choose for this batch (e.g. a UUID). Reuse the same id when retrying so no duplicates are created.");

async function assertRealBrand(db: Firestore, id: string) {
  if (DEMO_BRAND_IDS.has(id)) throw new ToolError(`Brand "${id}" is demo data, not a real brand.`);
  const snap = await db.collection("brands").doc(id).get();
  if (!snap.exists) throw new ToolError(`No brand with id "${id}". Call list_brands to see valid ids.`);
}

// Same brand + requestId + position always maps to the same document id.
function draftDocId(kind: Kind, brand: string, req: string, index: number) {
  const hash = crypto.createHash("sha256").update(`${kind}|${brand}|${req}|${index}`).digest("hex");
  return `claude_${hash.slice(0, 24)}`;
}

// v1 briefs: older screens read visualCopyDetail; keep it in step with contentOutline.
function briefExtras(item: Record<string, unknown>) {
  return typeof item.contentOutline === "string" ? { visualCopyDetail: item.contentOutline } : {};
}

async function createDrafts(db: Firestore, kind: Kind, brand: string, req: string, items: Record<string, unknown>[]) {
  await assertRealBrand(db, brand);
  const col = db.collection(KINDS[kind].collection);
  const refs: DocumentReference[] = items.map((_, i) => col.doc(draftDocId(kind, brand, req, i)));
  const snaps = await db.getAll(...refs);

  const created: string[] = [];
  const existing: string[] = [];
  const batch = db.batch();
  const now = new Date().toISOString();
  snaps.forEach((snap, i) => {
    if (snap.exists) {
      // A retry of the same request: report the draft instead of duplicating it.
      if (snap.get("brandId") !== brand) throw new ToolError("requestId was already used for another brand. Use a new requestId.");
      existing.push(snap.id);
      return;
    }
    batch.create(refs[i], {
      // JSON round trip drops undefined optional fields (Firestore rejects them).
      ...JSON.parse(JSON.stringify(items[i])),
      ...(kind === "brief" ? { schemaVersion: 2, progressTracking: "Create" } : {}),
      brandId: brand,
      status: "Draft",
      createdBy: "claude",
      requestId: req,
      createdAt: now,
    });
    created.push(snap.id);
  });
  if (created.length) await batch.commit();
  return {
    body: {
      created,
      alreadyExisted: existing,
      status: "Draft",
      note: "Drafts appear in NOK OS with a 'Drafted by Claude' badge for staff to review. They are not visible to clients.",
    },
    itemCount: created.length,
  };
}

// ---------- tools ----------

export function registerWriteTools(server: McpServer, db: Firestore, ctx: CallContext) {
  const write = { readOnly: false } as const;

  addTool(server, db, ctx, "create_insights", {
    ...write,
    title: "Draft strategic insights",
    description:
      "Save 1-10 strategic insights for a brand as drafts for staff review. Base each one on data you read through this " +
      "connector (e.g. get_analytics_summary). Use standpoint 'analytics' only when the numbers back it, and put the " +
      "change actually observed in 'change' (or 'insufficient data'), never a forecast.",
    inputSchema: { brandId, requestId, items: z.array(insightItem).min(1).max(10) },
  }, ({ brandId, requestId, items }) => createDrafts(db, "insight", brandId, requestId, items));

  addTool(server, db, ctx, "create_directions", {
    ...write,
    title: "Draft brand directions",
    description:
      "Save 1-10 content directions (pillar, strategy, focus, checklist) for a brand as drafts for staff review. " +
      "Ground them in the brand context and approved insights.",
    inputSchema: { brandId, requestId, items: z.array(directionItem).min(1).max(10) },
  }, ({ brandId, requestId, items }) => createDrafts(db, "direction", brandId, requestId, items));

  addTool(server, db, ctx, "create_briefs", {
    ...write,
    title: "Draft creative briefs",
    description:
      "Save 1-10 creative briefs as drafts for staff review. One brief = one topic developed into 1-3 finished assets " +
      "(carousel slides, reel/video scenes, blog article, static, text post) with the actual copy, not a description of it, " +
      "plus a publish-ready caption per platform. Write in the brand's voice (get_brand_context) and base the rationale " +
      "on real data (get_analytics_summary). Never invent stats, results or quotes: put a bracketed placeholder in the copy " +
      "and an 'unconfirmed' item with its path (e.g. assets[0].slides[2].body). Unconfirmed items block approval until " +
      "staff confirm them. Drafts never appear on the client approval link.",
    inputSchema: { brandId, requestId, items: z.array(briefV2Item).min(1).max(10) },
  }, ({ brandId, requestId, items }) => createDrafts(db, "brief", brandId, requestId, items));

  addTool(server, db, ctx, "update_draft", {
    ...write,
    title: "Edit a Claude draft",
    description:
      "Change fields on an insight, direction or brief that Claude drafted and that is still in Draft status. " +
      "Only the fields you pass change. Status, brand and ownership can't be changed; items staff created or have " +
      "already reviewed can't be edited.",
    inputSchema: {
      brandId,
      kind: z.enum(["insight", "direction", "brief"]),
      id: z.string().min(1).max(128),
      patch: z.record(z.unknown()).describe("Fields to change, using the same names as the matching create_* tool."),
    },
  }, async ({ brandId, kind, id, patch }) => {
    if (kind === "brief") return updateBriefDraft(db, brandId, id, patch);
    const parsed = KINDS[kind].schema.partial().strict().safeParse(patch);
    if (!parsed.success) {
      throw new ToolError(`Invalid patch: ${parsed.error.issues.map((i) => `${i.path.join(".") || "patch"}: ${i.message}`).join("; ")}`);
    }
    const changes: Record<string, unknown> = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
    if (Object.keys(changes).length === 0) throw new ToolError("patch has no fields to change.");
    const ref = db.collection(KINDS[kind].collection).doc(id);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data();
      if (!snap.exists || !data || data.brandId !== brandId) throw new ToolError(`No ${kind} "${id}" for this brand.`);
      if (data.createdBy !== "claude") throw new ToolError(`This ${kind} was not drafted by Claude, so it can't be edited here.`);
      if (data.status !== "Draft") throw new ToolError(`This ${kind} is "${data.status}", not Draft. Only unreviewed drafts can be edited.`);
      tx.update(ref, { ...changes, updatedAt: new Date().toISOString() });
    });
    return { body: { updated: id, fields: Object.keys(changes) }, itemCount: 1 };
  });
}

const issues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".") || "patch"}: ${i.message}`).join("; ");

// Briefs: v2 drafts take v2 fields (whole arrays like assets are replaced) and
// the full brief must still be valid afterwards; v1 drafts take v1 fields.
async function updateBriefDraft(db: Firestore, brandId: string, id: string, patch: Record<string, unknown>) {
  const ref = db.collection("briefs").doc(id);
  let fields: string[] = [];
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    if (!snap.exists || !data || data.brandId !== brandId) throw new ToolError(`No brief "${id}" for this brand.`);
    if (data.createdBy !== "claude") throw new ToolError("This brief was not drafted by Claude, so it can't be edited here.");
    if (data.status !== "Draft") throw new ToolError(`This brief is "${data.status}", not Draft. Only unreviewed drafts can be edited.`);

    let changes: Record<string, unknown>;
    if (data.schemaVersion === 2) {
      const parsed = briefV2Item.partial().strict().safeParse(patch);
      if (!parsed.success) throw new ToolError(`Invalid patch: ${issues(parsed.error)}`);
      changes = JSON.parse(JSON.stringify(parsed.data));
      const merged = { ...data, ...changes };
      const check = safeParseBriefContent(pickBriefContent(merged));
      if ("errors" in check) throw new ToolError(`The brief would be invalid after this change: ${check.errors.slice(0, 5).join("; ")}`);
    } else {
      const parsed = legacyBriefPatch.partial().strict().safeParse(patch);
      if (!parsed.success) throw new ToolError(`Invalid patch (this is a v1 brief): ${issues(parsed.error)}`);
      changes = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
      Object.assign(changes, briefExtras(changes));
    }
    if (Object.keys(changes).length === 0) throw new ToolError("patch has no fields to change.");
    fields = Object.keys(changes);
    tx.update(ref, { ...changes, updatedAt: new Date().toISOString() });
  });
  return { body: { updated: id, fields }, itemCount: 1 };
}
