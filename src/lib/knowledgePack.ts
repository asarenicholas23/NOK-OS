// Brand knowledge pack: the facts and voice a writer needs to sound like the
// brand without inventing anything. Stored per brand in brandKnowledge/{brandId}
// (staff-only: client review sessions can read the brand record, not this).
// Shared by the Brands screen editor, the API server (Gemini) and the Claude
// connector. No Firebase imports.
import { z } from "zod";

const req = (max: number) => z.string().trim().min(1).max(max);
const opt = (max: number) => z.string().trim().max(max);
const list = (max: number, n: number) => z.array(req(max)).max(n).default([]);

export const knowledgePackSchema = z.object({
  positioning: opt(2000).default("").describe("Who it's for, what it does, why it's different."),
  offers: z.array(z.object({
    name: req(120),
    description: opt(800).default(""),
    price: opt(80).optional(),
    link: opt(300).optional(),
  }).strict()).max(30).default([]),
  audiences: z.array(z.object({
    name: req(120),
    description: opt(800).default(""),
    painPoints: list(300, 15),
    theirWords: list(300, 20).describe("Phrases the audience actually uses."),
  }).strict()).max(10).default([]),
  voice: z.object({
    summary: opt(1000).default(""),
    doExamples: list(500, 15),
    dontExamples: list(500, 15),
  }).strict().default({}),
  bannedPhrases: list(120, 50),
  proofPoints: z.array(z.object({
    claim: req(400),
    source: opt(300).default(""),
    verified: z.boolean().default(false).describe("Only verified proof points may be quoted in copy."),
  }).strict()).max(40).default([]),
  competitors: z.array(z.object({ name: req(120), notes: opt(800).default("") }).strict()).max(20).default([]),
  platformNotes: z.array(z.object({ platform: req(60), notes: req(1000) }).strict()).max(15).default([]),
}).strict();

export interface KnowledgePack {
  positioning: string;
  offers: { name: string; description: string; price?: string; link?: string }[];
  audiences: { name: string; description: string; painPoints: string[]; theirWords: string[] }[];
  voice: { summary: string; doExamples: string[]; dontExamples: string[] };
  bannedPhrases: string[];
  proofPoints: { claim: string; source: string; verified: boolean }[];
  competitors: { name: string; notes: string }[];
  platformNotes: { platform: string; notes: string }[];
  updatedAt?: string;
  updatedBy?: string;
}

// Hand-written type kept in step with the schema (project isn't in TS strict mode).
type Assert<T extends true> = T;
type KeysMatch<A, B> = [Exclude<keyof A, keyof B> | Exclude<keyof B, keyof A>] extends [never] ? true : false;
type _Check = Assert<KeysMatch<Omit<KnowledgePack, "updatedAt" | "updatedBy">, z.infer<typeof knowledgePackSchema>>>;

export const EMPTY_KNOWLEDGE_PACK: KnowledgePack = knowledgePackSchema.parse({}) as KnowledgePack;

export function safeParseKnowledgePack(input: unknown): { ok: true; pack: KnowledgePack } | { ok: false; errors: string[] } {
  const r = knowledgePackSchema.safeParse(input);
  if (r.success) return { ok: true, pack: r.data as KnowledgePack };
  return { ok: false, errors: r.error.issues.map((i) => `${i.path.join(".") || "pack"}: ${i.message}`) };
}

// Prompt text for AI features. Only verified proof points are offered as
// citable; competitors listed here are the only ones that may be named.
export function knowledgePackPrompt(pack: KnowledgePack | null): string {
  if (!pack) return "BRAND KNOWLEDGE PACK: none yet.";
  const lines: string[] = ["BRAND KNOWLEDGE PACK"];
  if (pack.positioning) lines.push(`- Positioning: ${pack.positioning}`);
  if (pack.offers.length) lines.push(`- Offers: ${pack.offers.map((o) => `${o.name}${o.price ? ` (${o.price})` : ""}${o.description ? `: ${o.description}` : ""}`).join("; ")}`);
  for (const a of pack.audiences) {
    lines.push(`- Audience "${a.name}": ${a.description}${a.painPoints.length ? ` Pain points: ${a.painPoints.join("; ")}.` : ""}${a.theirWords.length ? ` Their words: "${a.theirWords.join('", "')}".` : ""}`);
  }
  if (pack.voice.summary) lines.push(`- Voice: ${pack.voice.summary}`);
  if (pack.voice.doExamples.length) lines.push(`- Sounds like: "${pack.voice.doExamples.join('" | "')}"`);
  if (pack.voice.dontExamples.length) lines.push(`- Never sounds like: "${pack.voice.dontExamples.join('" | "')}"`);
  if (pack.bannedPhrases.length) lines.push(`- Banned phrases (never use): ${pack.bannedPhrases.join(", ")}`);
  const verified = pack.proofPoints.filter((p) => p.verified);
  lines.push(verified.length
    ? `- VERIFIED PROOF POINTS (the only claims you may cite, quote them as written): ${verified.map((p) => `"${p.claim}"${p.source ? ` [${p.source}]` : ""}`).join("; ")}`
    : "- Verified proof points: none. Any claim needing proof must be a placeholder plus an unconfirmed item.");
  if (pack.competitors.length) lines.push(`- Competitors (only these may be named): ${pack.competitors.map((c) => `${c.name}${c.notes ? `: ${c.notes}` : ""}`).join("; ")}`);
  for (const p of pack.platformNotes) lines.push(`- ${p.platform}: ${p.notes}`);
  return lines.join("\n");
}
