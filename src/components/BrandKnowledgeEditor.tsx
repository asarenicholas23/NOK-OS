import React, { useEffect, useState } from "react";
import { Plus, Trash2, X, Save, AlertTriangle, BookOpen } from "lucide-react";
import {
  EMPTY_KNOWLEDGE_PACK, safeParseKnowledgePack, type KnowledgePack,
} from "../lib/knowledgePack";

// Edits a brand's knowledge pack (brandKnowledge/{brandId}). Simple lists are
// one item per line; offers, audiences, proof points, competitors and
// platform notes are rows. Saves only what passes the shared schema.
interface Props {
  brandId: string;
  brandName: string;
  userEmail?: string;
  onClose: () => void;
}

const lines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);
const LABEL = "block text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 mb-1";

// Defined outside the editor so inputs aren't re-created (and lose focus) on every keystroke.
const Field: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <label className="block"><span className={LABEL}>{title}</span>{children}{hint && <span className="block text-[10px] text-slate-400 mt-0.5">{hint}</span>}</label>
);

export const BrandKnowledgeEditor: React.FC<Props> = ({ brandId, brandName, userEmail, onClose }) => {
  const [pack, setPack] = useState<KnowledgePack>(EMPTY_KNOWLEDGE_PACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { db } = await import("../lib/firebase");
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "brandKnowledge", brandId));
        if (!cancelled && snap.exists()) {
          const { updatedAt, updatedBy, ...rest } = snap.data() as Record<string, any>;
          const parsed = safeParseKnowledgePack(rest);
          if ("pack" in parsed) setPack(parsed.pack);
          setSavedAt(updatedAt ? `${new Date(updatedAt).toLocaleString()}${updatedBy ? ` by ${updatedBy}` : ""}` : null);
        }
      } catch (e: any) {
        if (!cancelled) setErrors([`Couldn't load the knowledge pack: ${e?.message || e}`]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [brandId]);

  const set = <K extends keyof KnowledgePack>(k: K, v: KnowledgePack[K]) => setPack((p) => ({ ...p, [k]: v }));
  const setRow = <K extends "offers" | "audiences" | "proofPoints" | "competitors" | "platformNotes">(k: K, i: number, patch: Partial<KnowledgePack[K][number]>) =>
    setPack((p) => ({ ...p, [k]: (p[k] as any[]).map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const removeRow = (k: "offers" | "audiences" | "proofPoints" | "competitors" | "platformNotes", i: number) =>
    setPack((p) => ({ ...p, [k]: (p[k] as any[]).filter((_, j) => j !== i) }));

  const save = async () => {
    const { updatedAt: _a, updatedBy: _b, ...content } = pack;
    void _a; void _b;
    const parsed = safeParseKnowledgePack(JSON.parse(JSON.stringify(content)));
    if ("errors" in parsed) {
      setErrors(parsed.errors);
      return;
    }
    setSaving(true);
    setErrors([]);
    try {
      const { db } = await import("../lib/firebase");
      const { doc, setDoc } = await import("firebase/firestore");
      const now = new Date().toISOString();
      await setDoc(doc(db, "brandKnowledge", brandId), { ...parsed.pack, updatedAt: now, ...(userEmail ? { updatedBy: userEmail } : {}) });
      setSavedAt(`${new Date(now).toLocaleString()}${userEmail ? ` by ${userEmail}` : ""}`);
    } catch (e: any) {
      setErrors([`Save failed: ${e?.message || e}`]);
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full px-2.5 py-1.5 rounded-md border text-sm bg-transparent border-slate-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500";
  const label = LABEL;
  const section = "rounded-xl border border-slate-500/25 p-4 space-y-3";
  const addBtn = "inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold border border-violet-500/40 text-violet-500 cursor-pointer";
  const delBtn = "p-1.5 text-rose-500 cursor-pointer shrink-0";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-3 md:p-6" role="dialog" aria-modal="true" aria-label={`Knowledge pack: ${brandName}`}>
      <div className="w-full max-w-3xl rounded-2xl border border-slate-500/30 bg-white dark:bg-[#18191E] text-slate-800 dark:text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-500/20">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-500" />
            <div>
              <h3 className="text-sm font-bold">Knowledge pack: {brandName}</h3>
              <p className="text-[11px] text-slate-400">Used by Gemini and Claude when writing for this brand. Staff only. {savedAt ? `Last saved ${savedAt}.` : "Not saved yet."}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded hover:bg-slate-500/20 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="p-5 space-y-4">
            <div className={section}>
              <Field title="Positioning" hint="Who it's for, what it does, why it's different.">
                <textarea className={input} rows={3} value={pack.positioning} onChange={(e) => set("positioning", e.target.value)} />
              </Field>
            </div>

            <div className={section}>
              <span className={label}>Offers</span>
              {pack.offers.map((o, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-[1fr_120px_auto] items-start">
                  <div className="space-y-1.5">
                    <input className={input} aria-label="Offer name" placeholder="Name" value={o.name} onChange={(e) => setRow("offers", i, { name: e.target.value })} />
                    <textarea className={input} aria-label="Offer description" placeholder="Description" rows={2} value={o.description} onChange={(e) => setRow("offers", i, { description: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <input className={input} aria-label="Price" placeholder="Price" value={o.price || ""} onChange={(e) => setRow("offers", i, { price: e.target.value || undefined })} />
                    <input className={input} aria-label="Link" placeholder="Link" value={o.link || ""} onChange={(e) => setRow("offers", i, { link: e.target.value || undefined })} />
                  </div>
                  <button type="button" aria-label="Remove offer" className={delBtn} onClick={() => removeRow("offers", i)}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button type="button" className={addBtn} onClick={() => set("offers", [...pack.offers, { name: "", description: "" }])}><Plus className="w-3 h-3" /> Add offer</button>
            </div>

            <div className={section}>
              <span className={label}>Audiences</span>
              {pack.audiences.map((a, i) => (
                <div key={i} className="rounded-lg border border-slate-500/20 p-3 space-y-2">
                  <div className="flex gap-2">
                    <input className={input} aria-label="Audience name" placeholder="Name, e.g. Students on a budget" value={a.name} onChange={(e) => setRow("audiences", i, { name: e.target.value })} />
                    <button type="button" aria-label="Remove audience" className={delBtn} onClick={() => removeRow("audiences", i)}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <textarea className={input} aria-label="Audience description" placeholder="Who they are" rows={2} value={a.description} onChange={(e) => setRow("audiences", i, { description: e.target.value })} />
                  <div className="grid gap-2 md:grid-cols-2">
                    <Field title="Pain points (one per line)"><textarea className={input} rows={3} value={a.painPoints.join("\n")} onChange={(e) => setRow("audiences", i, { painPoints: lines(e.target.value) })} /></Field>
                    <Field title="Their words (one per line)" hint="Phrases they actually use, from DMs, comments, reviews."><textarea className={input} rows={3} value={a.theirWords.join("\n")} onChange={(e) => setRow("audiences", i, { theirWords: lines(e.target.value) })} /></Field>
                  </div>
                </div>
              ))}
              <button type="button" className={addBtn} onClick={() => set("audiences", [...pack.audiences, { name: "", description: "", painPoints: [], theirWords: [] }])}><Plus className="w-3 h-3" /> Add audience</button>
            </div>

            <div className={section}>
              <Field title="Voice"><textarea className={input} rows={2} value={pack.voice.summary} onChange={(e) => set("voice", { ...pack.voice, summary: e.target.value })} /></Field>
              <div className="grid gap-2 md:grid-cols-2">
                <Field title="Sounds like: good examples (one per line)"><textarea className={input} rows={4} value={pack.voice.doExamples.join("\n")} onChange={(e) => set("voice", { ...pack.voice, doExamples: lines(e.target.value) })} /></Field>
                <Field title="Never sounds like: bad examples (one per line)"><textarea className={input} rows={4} value={pack.voice.dontExamples.join("\n")} onChange={(e) => set("voice", { ...pack.voice, dontExamples: lines(e.target.value) })} /></Field>
              </div>
              <Field title="Banned phrases (one per line)"><textarea className={input} rows={3} value={pack.bannedPhrases.join("\n")} onChange={(e) => set("bannedPhrases", lines(e.target.value))} /></Field>
            </div>

            <div className={section}>
              <span className={label}>Proof points</span>
              <p className="text-[11px] text-slate-400 -mt-2">Only proof points ticked as verified can be quoted in copy. Unverified ones stay as notes.</p>
              {pack.proofPoints.map((p, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-[1fr_200px_auto_auto] items-start">
                  <textarea className={input} aria-label="Claim" placeholder='Claim, e.g. "Every hoodie is double-stitched"' rows={2} value={p.claim} onChange={(e) => setRow("proofPoints", i, { claim: e.target.value })} />
                  <input className={input} aria-label="Source" placeholder="Source (where it's confirmed)" value={p.source} onChange={(e) => setRow("proofPoints", i, { source: e.target.value })} />
                  <label className="flex items-center gap-1 text-xs pt-2 cursor-pointer"><input type="checkbox" checked={p.verified} onChange={(e) => setRow("proofPoints", i, { verified: e.target.checked })} /> Verified</label>
                  <button type="button" aria-label="Remove proof point" className={delBtn} onClick={() => removeRow("proofPoints", i)}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button type="button" className={addBtn} onClick={() => set("proofPoints", [...pack.proofPoints, { claim: "", source: "", verified: false }])}><Plus className="w-3 h-3" /> Add proof point</button>
            </div>

            <div className={section}>
              <span className={label}>Competitors</span>
              {pack.competitors.map((c, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-[200px_1fr_auto] items-start">
                  <input className={input} aria-label="Competitor name" placeholder="Name" value={c.name} onChange={(e) => setRow("competitors", i, { name: e.target.value })} />
                  <textarea className={input} aria-label="Competitor notes" placeholder="Notes" rows={2} value={c.notes} onChange={(e) => setRow("competitors", i, { notes: e.target.value })} />
                  <button type="button" aria-label="Remove competitor" className={delBtn} onClick={() => removeRow("competitors", i)}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button type="button" className={addBtn} onClick={() => set("competitors", [...pack.competitors, { name: "", notes: "" }])}><Plus className="w-3 h-3" /> Add competitor</button>
            </div>

            <div className={section}>
              <span className={label}>Platform notes</span>
              {pack.platformNotes.map((p, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-[160px_1fr_auto] items-start">
                  <input className={input} aria-label="Platform" placeholder="Platform" value={p.platform} onChange={(e) => setRow("platformNotes", i, { platform: e.target.value })} />
                  <textarea className={input} aria-label="Platform notes" placeholder="What works there, posting rules, formats" rows={2} value={p.notes} onChange={(e) => setRow("platformNotes", i, { notes: e.target.value })} />
                  <button type="button" aria-label="Remove platform note" className={delBtn} onClick={() => removeRow("platformNotes", i)}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button type="button" className={addBtn} onClick={() => set("platformNotes", [...pack.platformNotes, { platform: "", notes: "" }])}><Plus className="w-3 h-3" /> Add platform note</button>
            </div>

            {errors.length > 0 && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-500" role="alert">
                <div className="flex items-center gap-1.5 font-bold mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Fix these before saving:</div>
                <ul className="list-disc pl-5 space-y-0.5">{errors.slice(0, 10).map((e, i) => <li key={i} className="font-mono">{e}</li>)}</ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-500/20">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-500/40 cursor-pointer">Close</button>
          <button type="button" onClick={save} disabled={saving || loading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white cursor-pointer disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save knowledge pack"}
          </button>
        </div>
      </div>
    </div>
  );
};
