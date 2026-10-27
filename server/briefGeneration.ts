// v2 creative brief generation with Gemini. Each brief is generated in its own
// call (in parallel) so outputs stay small and one failure doesn't sink the
// batch. Output is normalised and validated against the shared v2 schema;
// nothing invalid is returned as a brief.
import { Type } from "@google/genai";
import type { Firestore } from "firebase-admin/firestore";
import {
  ASSET_TYPES, PLATFORMS, normalizeBriefContent, safeParseBriefContent, type BriefContent,
} from "../src/lib/briefs";
import { summarizeAnalytics, type AnalyticsRow } from "../mcp/analytics";
import { DEMO_BRAND_IDS, isFakeRecord } from "../mcp/fakeData";

type Generate = (contents: string, config: any) => Promise<{ text?: string }>;

export interface DirectionInput {
  pillar?: string;
  strategy?: string;
  focus?: string;
  checklist?: string[];
}

export class GenerationError extends Error {}

const STR = { type: Type.STRING };
const STR_ARR = { type: Type.ARRAY, items: STR };
const PLATFORM = { type: Type.STRING, enum: [...PLATFORMS] };

// Gemini can't express "one body per asset type", so every typed field is
// optional here; normalizeBriefContent keeps only the right ones per type.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: STR,
    pillar: STR,
    personas: STR_ARR,
    platforms: { type: Type.ARRAY, items: PLATFORM },
    keyMessage: STR,
    rationale: STR,
    assets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: [...ASSET_TYPES] },
          title: STR,
          platforms: { type: Type.ARRAY, items: PLATFORM },
          spec: STR,
          slot: STR,
          cta: STR,
          captions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { platform: PLATFORM, text: STR, hashtags: STR_ARR, firstComment: STR },
              required: ["platform", "text", "hashtags"],
            },
          },
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { n: { type: Type.INTEGER }, background: STR, headline: STR, body: STR, visualNote: STR },
              required: ["n", "background", "headline", "body", "visualNote"],
            },
          },
          coverText: STR,
          durationSec: { type: Type.INTEGER },
          audioNote: STR,
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { start: { type: Type.NUMBER }, end: { type: Type.NUMBER }, visual: STR, onScreenText: STR, voiceover: STR },
              required: ["start", "end", "visual", "onScreenText", "voiceover"],
            },
          },
          slug: STR,
          metaDescription: STR,
          body: STR,
          headline: STR,
          visualNote: STR,
        },
        required: ["type", "title", "platforms", "spec", "cta", "captions"],
      },
    },
    productionNotes: STR_ARR,
    unconfirmed: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { field: STR, note: STR }, required: ["field", "note"] },
    },
    successMeasures: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { metric: STR, target: STR, source: STR }, required: ["metric", "target", "source"] },
    },
  },
  required: ["title", "pillar", "personas", "platforms", "keyMessage", "rationale", "assets", "productionNotes", "unconfirmed", "successMeasures"],
};

const field = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "Not specified");

// The writing rules shared by brief generation and the chatbot.
export const BRIEF_WRITING_RULES = `
WHAT A BRIEF IS
One brief = one topic, developed into 1-3 finished ASSETS that a designer or editor can build without asking
anything. Write the actual content, never a description of it:
- carousel: every slide's headline and body copy as it will appear, plus background and design notes. 5-10 slides.
- reel / video: cover text, total length, and every scene with start/end seconds, what is on screen, the on-screen
  text and the exact voiceover (empty string if none). Scenes must cover the whole duration in order.
- blog: the full article in markdown (headings, paragraphs), a slug and a meta description under 160 characters.
- static: the headline, the body copy and design notes.
- text: the full post body.
Every asset needs: a short title, its platforms, a spec (dimensions + slide count or length, e.g. "1080x1350, 7 slides"
or "9:16, 30s"), a CTA, and one publish-ready caption per platform it runs on, in brand voice, with hashtags.

HONESTY (strict)
- Never invent statistics, percentages, client results, testimonials, quotes, prices, awards, partner names or dates.
- Use only facts from the brand context, the approved directions and the analytics summary below.
- When a piece of copy needs a fact you don't have, write a clear bracketed placeholder in the copy itself
  (e.g. "[client result: confirm figure]") AND add an "unconfirmed" item whose "field" is the exact path
  (e.g. "assets[0].slides[3].body") and whose "note" says what must be confirmed and by whom.
- Music/audio that may need a licence, people or locations that need permission also go in "unconfirmed".
- "rationale" explains why this topic, why now. Quote analytics figures only exactly as given; if the data is thin, say so.
- successMeasures: realistic targets, each with where it will be read (e.g. "Instagram Insights, 7 days after posting").
  Base targets on the analytics summary when it exists; otherwise say "baseline to be set" in the target.

VOICE
Write in the brand's voice and tone. Speak to the listed personas in their language. Respect the platform notes.
Platforms must be from: ${PLATFORMS.join(", ")}.`;

function compactAnalytics(summary: ReturnType<typeof summarizeAnalytics> | null) {
  if (!summary) return "No analytics have been imported for this brand.";
  return JSON.stringify({
    scope: summary.scope,
    totals: summary.totals,
    byPlatform: summary.byPlatform.slice(0, 6).map(({ key, posts, impressions, engagementRate }) => ({ key, posts, impressions, engagementRate })),
    byFormat: summary.byFormat.slice(0, 6).map(({ key, posts, impressions, engagementRate }) => ({ key, posts, impressions, engagementRate })),
    topPosts: summary.topPosts.slice(0, 3),
    periodChange: summary.periodChange?.change ?? null,
    dataNotes: summary.dataNotes,
  });
}

async function loadContext(db: Firestore, brandId: string) {
  if (DEMO_BRAND_IDS.has(brandId)) throw new GenerationError("This is a demo brand.");
  const brandSnap = await db.collection("brands").doc(brandId).get();
  if (!brandSnap.exists) throw new GenerationError("Brand not found.");
  const brand = brandSnap.data() as Record<string, any>;

  const rowsSnap = await db.collection("rawAnalytics").where("brandId", "==", brandId).get();
  const rows = rowsSnap.docs.filter((d) => !isFakeRecord("rawAnalytics", d.id, d.data())).map((d) => ({ ...d.data(), id: d.id }) as AnalyticsRow);
  const summary = rows.length ? summarizeAnalytics(rows) : null;
  return { brand, summary };
}

function buildPrompt(brand: Record<string, any>, analytics: string, direction: DirectionInput | null, n: number, total: number) {
  return `You are a senior content strategist and copywriter producing a production-ready creative brief for "${field(brand.name)}".

BRAND CONTEXT
- Description: ${field(brand.brandDescription)}
- Industry: ${field(brand.industry)}
- Tagline: ${field(brand.tagline)}
- Voice & tone: ${field(brand.voiceTone)}
- Campaign objective: ${field(brand.campaignObjective)}
- Content pillars: ${field(brand.contentPillars)}
- Audience personas: ${field(brand.audiencePersonas)}
- Competitor context: ${field(brand.competitorContext)}
- Platform notes: ${field(brand.platformNotes)}

ANALYTICS SUMMARY (computed from imported data; the only numbers you may cite)
${analytics}

APPROVED DIRECTION FOR THIS BRIEF
${direction ? JSON.stringify(direction) : "None given: pick the strongest topic from the brand's pillars."}

This is brief ${n} of ${total} in a batch; pick a distinct topic and angle within the direction.
${BRIEF_WRITING_RULES}

Return one brief as JSON matching the response schema.`;
}

async function generateOne(generate: Generate, prompt: string): Promise<BriefContent> {
  const config = { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, maxOutputTokens: 16000 };
  let lastErrors: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const contents = attempt === 0 ? prompt
      : `${prompt}\n\nYour previous answer failed validation with these problems; fix all of them:\n- ${lastErrors.join("\n- ")}`;
    const response = await generate(contents, config);
    let parsed: unknown;
    try {
      parsed = JSON.parse(response.text || "{}");
    } catch {
      lastErrors = ["Response was not valid JSON."];
      continue;
    }
    const result = safeParseBriefContent(normalizeBriefContent(parsed));
    if ("content" in result) return result.content;
    lastErrors = result.errors.slice(0, 15);
  }
  throw new GenerationError(`Generated brief failed validation: ${lastErrors.join("; ")}`);
}

export async function generateV2Briefs(opts: {
  db: Firestore;
  generate: Generate;
  brandId: string;
  directions: DirectionInput[];
  count: number;
}) {
  const count = Math.min(Math.max(Math.round(opts.count) || 3, 1), 5);
  const { brand, summary } = await loadContext(opts.db, opts.brandId);
  const analytics = compactAnalytics(summary);
  const directions = opts.directions.filter(Boolean);

  const settled = await Promise.allSettled(
    Array.from({ length: count }, (_, i) =>
      generateOne(opts.generate, buildPrompt(brand, analytics, directions.length ? directions[i % directions.length] : null, i + 1, count)),
    ),
  );
  const briefs: BriefContent[] = [];
  const failed: string[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") briefs.push(r.value);
    else failed.push(`Brief ${i + 1}: ${r.reason instanceof GenerationError ? r.reason.message : "generation failed"}`);
  });
  return { briefs, failed };
}
