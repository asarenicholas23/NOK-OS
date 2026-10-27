// Creative brief types, schema and helpers, shared by the app, the API server
// (Gemini generation) and the Claude connector (mcp/). No Firebase imports here,
// so every side can use it.
//
// Two versions live side by side in the `briefs` collection:
// - v1 (no schemaVersion): the original "post about this" brief. Never migrated.
// - v2 (schemaVersion: 2): one topic developed into finished assets, each with
//   production-ready content (slide copy, scene scripts, captions).

import { z } from "zod";

// ---------- shared header (both versions) ----------

export type BriefStatus = "Draft" | "Proposed" | "Approved" | "Changes Requested" | "In Progress";

export interface BriefHeader {
  id: string;
  brandId: string;
  title: string;
  status: BriefStatus;
  date?: string; // YYYY-MM-DD
  dayOfWeek?: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | string;
  weekNumber?: number;
  campaignId?: string;
  campaignName?: string;
  workflowType?: "weekly" | "campaign" | "hybrid";
  approver?: string;
  revisionNotes?: string; // owner feedback from "Request Changes"
  progressTracking?: "Create" | "Edit" | "Film" | "Review" | "Schedule" | "Done" | string;
  // Set to "claude" on drafts written through the Claude connector (mcp/).
  createdBy?: "claude";
  // Client-supplied id that makes connector writes safe to retry.
  requestId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---------- v1 (legacy) ----------

export interface CreativeBriefV1 extends BriefHeader {
  schemaVersion?: 1;
  objective: string;
  targetAudience: string;
  keyMessage: string;
  deliverables: string;
  sequencePosition?: string;
  proofPoint?: string;
  formatSpec?: string;
  contentOutline?: string;
  cta?: string;
  toneVisualRef?: string;
  successMetric?: string;
  // Content planner spreadsheet attributes
  platform?: string; // e.g. "Instagram, Facebook"
  platforms?: string[];
  mainFocus?: string; // e.g. "Reach", "Engagement", "Link Click", "Sales"
  topicIdea?: string;
  contentPillar?: string;
  postType?: string; // e.g. "Artwork", "Carousel", "Video", "Reel"
  visualReference?: string;
  visualCopyDetail?: string; // duplicate of contentOutline in older briefs
  copywritingCaption?: string;
  hashtags?: string;
  notes?: string;
  campaignDropNumber?: number;
  totalCampaignDrops?: number;
}

// ---------- v2 schema ----------

export const PLATFORMS = [
  "Instagram", "Facebook", "LinkedIn", "TikTok", "Twitter/X", "YouTube", "Threads", "Newsletter", "Blog",
] as const;
export type Platform = (typeof PLATFORMS)[number];
export const platformSchema = z.enum(PLATFORMS);

export const ASSET_TYPES = ["carousel", "reel", "video", "blog", "static", "text"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

const req = (max: number) => z.string().trim().min(1).max(max);
const opt = (max: number) => z.string().trim().max(max);

export const captionSchema = z.object({
  platform: platformSchema,
  text: req(3000),
  hashtags: z.array(req(80)).max(30).default([]),
  firstComment: opt(1000).optional(),
}).strict();

const assetBase = {
  id: req(64),
  title: req(200),
  platforms: z.array(platformSchema).min(1).max(PLATFORMS.length),
  spec: req(300).describe('Dimensions and length, e.g. "1080x1350, 7 slides" or "9:16, 30s"'),
  slot: opt(100).optional().describe('When it goes out, e.g. "Tue 6pm"'),
  captions: z.array(captionSchema).max(PLATFORMS.length).default([]),
  cta: opt(300).default(""),
};

export const slideSchema = z.object({
  n: z.number().int().min(1).max(50),
  background: opt(400),
  headline: opt(300),
  body: opt(1500),
  visualNote: opt(800),
}).strict();

export const sceneSchema = z.object({
  start: z.number().min(0).max(7200),
  end: z.number().min(0).max(7200),
  visual: req(800),
  onScreenText: opt(400),
  voiceover: opt(1500),
}).strict();

const videoBody = {
  coverText: opt(200),
  durationSec: z.number().int().min(1).max(7200),
  audioNote: opt(400).optional(),
  scenes: z.array(sceneSchema).min(1).max(80),
};

const carouselSchema = z.object({ ...assetBase, type: z.literal("carousel"), slides: z.array(slideSchema).min(1).max(20) }).strict();
const reelSchema = z.object({ ...assetBase, type: z.literal("reel"), ...videoBody }).strict();
const videoSchema = z.object({ ...assetBase, type: z.literal("video"), ...videoBody }).strict();
const blogSchema = z.object({
  ...assetBase,
  type: z.literal("blog"),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase-words-with-dashes").max(120),
  metaDescription: opt(320),
  body: req(40000).describe("Markdown"),
}).strict();
const staticSchema = z.object({ ...assetBase, type: z.literal("static"), headline: opt(300), body: opt(1500), visualNote: opt(800) }).strict();
const textSchema = z.object({ ...assetBase, type: z.literal("text"), body: req(5000) }).strict();

export const assetSchema = z.discriminatedUnion("type", [carouselSchema, reelSchema, videoSchema, blogSchema, staticSchema, textSchema]);

// Types are written out by hand: this project doesn't compile in TypeScript
// strict mode, where z.infer would make every field optional. The KeysMatch
// checks at the bottom of this section keep them in step with the schemas.
export interface Caption { platform: Platform; text: string; hashtags: string[]; firstComment?: string }
export interface Slide { n: number; background: string; headline: string; body: string; visualNote: string }
export interface Scene { start: number; end: number; visual: string; onScreenText: string; voiceover: string }
interface AssetBase {
  id: string;
  title: string;
  platforms: Platform[];
  spec: string;
  slot?: string;
  captions: Caption[];
  cta: string;
}
export type CarouselAsset = AssetBase & { type: "carousel"; slides: Slide[] };
export type VideoAsset = AssetBase & { type: "reel" | "video"; coverText: string; durationSec: number; audioNote?: string; scenes: Scene[] };
export type BlogAsset = AssetBase & { type: "blog"; slug: string; metaDescription: string; body: string }; // title = blog title
export type StaticAsset = AssetBase & { type: "static"; headline: string; body: string; visualNote: string };
export type TextAsset = AssetBase & { type: "text"; body: string };
export type BriefAsset = CarouselAsset | VideoAsset | BlogAsset | StaticAsset | TextAsset;

export const unconfirmedSchema = z.object({
  field: req(200).describe('Where the unconfirmed content is, e.g. "assets[0].slides[2].body"'),
  note: req(600).describe("What needs confirming and by whom."),
}).strict();
export interface UnconfirmedItem { field: string; note: string }

export const successMeasureSchema = z.object({
  metric: req(120),
  target: req(120),
  source: req(200).describe('Where it will be read, e.g. "Instagram Insights, 7 days after posting"'),
}).strict();
export interface SuccessMeasure { metric: string; target: string; source: string }

// The content of a v2 brief: what generation, the editor and the connector
// produce. Header fields (status, dates, approval) are set by the app.
export const briefContentSchema = z.object({
  title: req(200),
  pillar: req(160),
  personas: z.array(req(200)).max(10).default([]),
  platforms: z.array(platformSchema).min(1).max(PLATFORMS.length),
  keyMessage: req(400).describe("The one thing, in a single sentence."),
  rationale: req(2000).describe("Why this, why now."),
  assets: z.array(assetSchema).min(1).max(10),
  productionNotes: z.array(req(600)).max(30).default([]),
  unconfirmed: z.array(unconfirmedSchema).max(50).default([]),
  successMeasures: z.array(successMeasureSchema).max(10).default([]),
}).strict();
export interface BriefContent {
  title: string;
  pillar: string;
  personas: string[];
  platforms: Platform[];
  keyMessage: string;
  rationale: string;
  assets: BriefAsset[];
  productionNotes: string[];
  unconfirmed: UnconfirmedItem[];
  successMeasures: SuccessMeasure[];
}

// Compile-time guard: each hand-written type has exactly the schema's fields.
type Assert<T extends true> = T;
type KeysMatch<A, B> = [Exclude<keyof A, keyof B> | Exclude<keyof B, keyof A>] extends [never] ? true : false;
type _Checks = [
  Assert<KeysMatch<Caption, z.infer<typeof captionSchema>>>,
  Assert<KeysMatch<Slide, z.infer<typeof slideSchema>>>,
  Assert<KeysMatch<Scene, z.infer<typeof sceneSchema>>>,
  Assert<KeysMatch<CarouselAsset, z.infer<typeof carouselSchema>>>,
  Assert<KeysMatch<VideoAsset, z.infer<typeof reelSchema>>>,
  Assert<KeysMatch<VideoAsset, z.infer<typeof videoSchema>>>,
  Assert<KeysMatch<BlogAsset, z.infer<typeof blogSchema>>>,
  Assert<KeysMatch<StaticAsset, z.infer<typeof staticSchema>>>,
  Assert<KeysMatch<TextAsset, z.infer<typeof textSchema>>>,
  Assert<KeysMatch<UnconfirmedItem, z.infer<typeof unconfirmedSchema>>>,
  Assert<KeysMatch<SuccessMeasure, z.infer<typeof successMeasureSchema>>>,
  Assert<KeysMatch<BriefContent, z.infer<typeof briefContentSchema>>>,
];

// Validate unknown input (Gemini output, connector calls, editor saves) as v2
// brief content. Returns the typed content or a readable list of problems.
export function safeParseBriefContent(input: unknown): { ok: true; content: BriefContent } | { ok: false; errors: string[] } {
  const r = briefContentSchema.safeParse(input);
  if (r.success) return { ok: true, content: r.data as BriefContent };
  return { ok: false, errors: r.error.issues.map((i) => `${i.path.join(".") || "brief"}: ${i.message}`) };
}

export function parseBriefContent(input: unknown): BriefContent {
  const r = safeParseBriefContent(input);
  // "in" checks narrow even without TypeScript strict mode.
  if ("errors" in r) throw new Error(`Invalid brief: ${r.errors.join("; ")}`);
  return r.content;
}

// Just the content fields of a v2 brief (drops header fields like id, status, date).
export const BRIEF_CONTENT_KEYS = Object.keys(briefContentSchema.shape) as (keyof BriefContent)[];
export function pickBriefContent(b: Partial<BriefContent> & Record<string, unknown>): BriefContent {
  return Object.fromEntries(BRIEF_CONTENT_KEYS.map((k) => [k, b[k]])) as unknown as BriefContent;
}

export interface CreativeBriefV2 extends BriefHeader, BriefContent {
  schemaVersion: 2;
}

// Every brief in Firestore is one of these. Docs without schemaVersion are v1.
export type CreativeBrief = CreativeBriefV1 | CreativeBriefV2;

// A brief before it's saved (Firestore assigns the id; the app sets brandId).
// Written out per version because Omit<> on a union keeps only shared fields.
export type NewCreativeBrief = Omit<CreativeBriefV1, "id" | "brandId"> | Omit<CreativeBriefV2, "id" | "brandId">;

// ---------- helpers (work for both versions) ----------

export const isV2 = (b: Partial<CreativeBrief> | null | undefined): b is CreativeBriefV2 =>
  !!b && (b as { schemaVersion?: number }).schemaVersion === 2;

const ASSET_LABELS: Record<AssetType, string> = {
  carousel: "Carousel", reel: "Reel", video: "Video", blog: "Blog", static: "Static", text: "Text post",
};
export const assetTypeLabel = (t: AssetType) => ASSET_LABELS[t];

export function briefPlatforms(b: CreativeBrief): string[] {
  if (isV2(b)) return b.platforms;
  // v1: the comma-separated platform string is what the app has always shown.
  const fromString = (b.platform || "").split(",").map((p) => p.trim()).filter(Boolean);
  return fromString.length ? fromString : b.platforms || [];
}

export const briefPrimaryPlatform = (b: CreativeBrief): string | undefined => briefPlatforms(b)[0];

export const briefPillar = (b: CreativeBrief): string | undefined => (isV2(b) ? b.pillar : b.contentPillar);

// Short format label for calendar cells, e.g. "Carousel + Reel".
export function briefFormatLabel(b: CreativeBrief): string | undefined {
  if (!isV2(b)) return b.postType;
  const labels = [...new Set(b.assets.map((a) => assetTypeLabel(a.type)))];
  return labels.length ? labels.join(" + ") : undefined;
}

// One-line hook shown on calendar cards.
export const briefHook = (b: CreativeBrief): string => (isV2(b) ? b.title : b.topicIdea || b.title);

// Short supporting line under a title in lists.
export const briefSummaryLine = (b: CreativeBrief): string | undefined =>
  isV2(b) ? b.keyMessage : b.topicIdea || b.keyMessage;

// Caption to publish on a platform: the matching asset caption for v2, the
// single caption for v1.
export function captionFor(b: CreativeBrief, platform?: string): string | undefined {
  if (!isV2(b)) return b.copywritingCaption;
  const captions = b.assets.flatMap((a) => a.captions);
  const match = platform ? captions.find((c) => c.platform === platform) : undefined;
  return (match || captions[0])?.text;
}

// Reasons this brief can't be approved yet. Only v2 briefs block: their
// unconfirmed items are explicit. (v1 briefs get text-scan warnings instead.)
export const approvalBlockers = (b: Partial<CreativeBrief>): UnconfirmedItem[] =>
  isV2(b) ? b.unconfirmed || [] : [];

export const canApprove = (b: Partial<CreativeBrief>) => approvalBlockers(b).length === 0;

// v2 content flattened into the v1 field names, so screens and exports not yet
// updated for v2 still show something sensible. Read-only: never write it back.
export function toLegacyView(b: CreativeBrief): CreativeBriefV1 {
  if (!isV2(b)) return b;
  const { schemaVersion: _v, pillar, personas, platforms, keyMessage, rationale, assets, productionNotes, unconfirmed, successMeasures, ...header } = b;
  void _v;
  const outline = assets.map((a, i) => `## Asset ${i + 1}: ${assetTypeLabel(a.type)} — ${a.title}\n${assetToMarkdown(a)}`).join("\n\n");
  const firstCaption = assets.flatMap((a) => a.captions)[0];
  return {
    ...header,
    objective: rationale,
    targetAudience: personas.join("; "),
    keyMessage,
    deliverables: assets.map((a) => `1x ${a.platforms.join("/")} ${assetTypeLabel(a.type).toLowerCase()} (${a.spec})`).join("; "),
    formatSpec: assets.map((a) => `${assetTypeLabel(a.type)}: ${a.spec}`).join("; "),
    contentOutline: outline,
    cta: assets.map((a) => a.cta).filter(Boolean).join(" / "),
    successMetric: successMeasures.map((m) => `${m.metric}: ${m.target}`).join("; "),
    proofPoint: unconfirmed.length ? `UNCONFIRMED: ${unconfirmed.map((u) => u.note).join("; ")}` : undefined,
    notes: productionNotes.join("\n"),
    platform: platforms.join(", "),
    platforms,
    contentPillar: pillar,
    postType: briefFormatLabel(b),
    topicIdea: b.title,
    copywritingCaption: firstCaption?.text,
    hashtags: firstCaption?.hashtags.join(" "),
  };
}

// Plain markdown for one asset (legacy view, emails, plain-text exports).
export function assetToMarkdown(a: BriefAsset): string {
  const lines: string[] = [`**Spec:** ${a.spec}${a.slot ? ` · **Slot:** ${a.slot}` : ""}`];
  switch (a.type) {
    case "carousel":
      for (const s of a.slides) {
        lines.push(`### Slide ${s.n}${s.headline ? ` — ${s.headline}` : ""}`);
        if (s.body) lines.push(`**Copy:** ${s.body}`);
        if (s.background) lines.push(`**Background:** ${s.background}`);
        if (s.visualNote) lines.push(`**Design:** ${s.visualNote}`);
      }
      break;
    case "reel":
    case "video":
      lines.push(`**Cover:** ${a.coverText || "—"} · **Length:** ${a.durationSec}s${a.audioNote ? ` · **Audio:** ${a.audioNote}` : ""}`);
      for (const s of a.scenes) {
        lines.push(`### ${s.start}s–${s.end}s`);
        lines.push(`**Visual:** ${s.visual}`);
        if (s.onScreenText) lines.push(`**On screen:** ${s.onScreenText}`);
        if (s.voiceover) lines.push(`**Voiceover:** ${s.voiceover}`);
      }
      break;
    case "blog":
      lines.push(`**Slug:** ${a.slug}`, `**Meta description:** ${a.metaDescription}`, "", a.body);
      break;
    case "static":
      if (a.headline) lines.push(`**Headline:** ${a.headline}`);
      if (a.body) lines.push(`**Copy:** ${a.body}`);
      if (a.visualNote) lines.push(`**Design:** ${a.visualNote}`);
      break;
    case "text":
      lines.push(a.body);
      break;
  }
  for (const c of a.captions) {
    lines.push(`**${c.platform} caption:** ${c.text}${c.hashtags.length ? `\n${c.hashtags.join(" ")}` : ""}`);
  }
  if (a.cta) lines.push(`**CTA:** ${a.cta}`);
  return lines.join("\n");
}

// ---------- normalising AI output ----------

const s = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());
const arr = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const num = (v: unknown) => (typeof v === "number" ? v : Number(v));
const isPlatform = (p: unknown): p is Platform => typeof p === "string" && (PLATFORMS as readonly string[]).includes(p);

export const slugify = (text: string) =>
  text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);

// Turns loosely-shaped model output into the strict v2 shape: keeps only the
// fields each asset type allows, fills defaults, numbers slides and gives
// assets ids. It never invents content; anything missing stays empty and the
// schema check that follows reports what is still wrong.
export function normalizeBriefContent(raw: unknown): unknown {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const assets = arr<Record<string, any>>(r.assets).map((a, i) => {
    const type = s(a.type).toLowerCase();
    const base: Record<string, unknown> = {
      id: s(a.id) || `a${i + 1}`,
      type,
      title: s(a.title),
      platforms: arr(a.platforms).filter(isPlatform),
      spec: s(a.spec),
      captions: arr<Record<string, any>>(a.captions)
        .filter((c) => isPlatform(c?.platform) && s(c?.text))
        .map((c) => ({
          platform: c.platform,
          text: s(c.text),
          hashtags: arr(c.hashtags).map(s).filter(Boolean).map((h) => (h.startsWith("#") ? h : `#${h}`)).map((h) => h.replace(/\s+/g, "")),
          ...(s(c.firstComment) ? { firstComment: s(c.firstComment) } : {}),
        })),
      cta: s(a.cta),
      ...(s(a.slot) ? { slot: s(a.slot) } : {}),
    };
    switch (type) {
      case "carousel":
        return { ...base, slides: arr<Record<string, any>>(a.slides).map((sl, n) => ({
          n: n + 1, background: s(sl.background), headline: s(sl.headline), body: s(sl.body), visualNote: s(sl.visualNote),
        })) };
      case "reel":
      case "video": {
        const scenes = arr<Record<string, any>>(a.scenes).map((sc) => ({
          start: Math.max(0, num(sc.start) || 0), end: Math.max(0, num(sc.end) || 0),
          visual: s(sc.visual), onScreenText: s(sc.onScreenText), voiceover: s(sc.voiceover),
        }));
        const lastEnd = scenes.reduce((m, sc) => Math.max(m, sc.end), 0);
        return {
          ...base, coverText: s(a.coverText), durationSec: Math.round(num(a.durationSec) || lastEnd),
          ...(s(a.audioNote) ? { audioNote: s(a.audioNote) } : {}), scenes,
        };
      }
      case "blog":
        return { ...base, slug: slugify(s(a.slug) || s(a.title)), metaDescription: s(a.metaDescription), body: s(a.body) };
      case "static":
        return { ...base, headline: s(a.headline), body: s(a.body), visualNote: s(a.visualNote) };
      case "text":
        return { ...base, body: s(a.body) };
      default:
        return base; // unknown type: the schema check rejects it with a clear error
    }
  });
  const platforms = arr(r.platforms).filter(isPlatform);
  return {
    title: s(r.title),
    pillar: s(r.pillar),
    personas: arr(r.personas).map(s).filter(Boolean),
    // Fall back to the union of asset platforms when the brief lists none.
    platforms: platforms.length ? platforms : [...new Set(assets.flatMap((a) => a.platforms as Platform[]))],
    keyMessage: s(r.keyMessage),
    rationale: s(r.rationale),
    assets,
    productionNotes: arr(r.productionNotes).map(s).filter(Boolean),
    unconfirmed: arr<Record<string, any>>(r.unconfirmed).map((u) => ({ field: s(u?.field), note: s(u?.note) })).filter((u) => u.field && u.note),
    successMeasures: arr<Record<string, any>>(r.successMeasures)
      .map((m) => ({ metric: s(m?.metric), target: s(m?.target), source: s(m?.source) }))
      .filter((m) => m.metric && m.target && m.source),
  };
}
