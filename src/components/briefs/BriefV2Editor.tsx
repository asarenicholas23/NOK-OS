import React, { useState } from "react";
import { Plus, Trash2, X, Save, AlertTriangle } from "lucide-react";
import {
  ASSET_TYPES, PLATFORMS, assetTypeLabel, safeParseBriefContent, slugify, pickBriefContent,
  type AssetType, type BriefAsset, type BriefContent, type Caption, type Platform,
} from "../../lib/briefs";

// Create / edit form for v2 briefs. Saves only content that passes the shared
// schema, so whatever it writes is exactly what generation and the connector write.
interface Props {
  initial?: BriefContent;
  isDark: boolean;
  heading: string;
  onSave: (content: BriefContent) => Promise<void>;
  onCancel: () => void;
}

const EMPTY: BriefContent = {
  title: "", pillar: "", personas: [], platforms: ["Instagram"], keyMessage: "", rationale: "",
  assets: [], productionNotes: [], unconfirmed: [], successMeasures: [],
};

function newAsset(type: AssetType, n: number, platforms: Platform[]): BriefAsset {
  const base = { id: `a${n}`, title: "", platforms: platforms.length ? [platforms[0]] : ["Instagram" as Platform], spec: "", captions: [] as Caption[], cta: "" };
  switch (type) {
    case "carousel": return { ...base, type, slides: [{ n: 1, background: "", headline: "", body: "", visualNote: "" }] };
    case "reel":
    case "video": return { ...base, type, coverText: "", durationSec: 30, scenes: [{ start: 0, end: 5, visual: "", onScreenText: "", voiceover: "" }] };
    case "blog": return { ...base, type, slug: "", metaDescription: "", body: "" };
    case "static": return { ...base, type, headline: "", body: "", visualNote: "" };
    case "text": return { ...base, type, body: "" };
  }
}

const lines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);

export const BriefV2Editor: React.FC<Props> = ({ initial, isDark, heading, onSave, onCancel }) => {
  // Only content fields are edited; header fields (status, date…) stay with the brief.
  const [c, setC] = useState<BriefContent>(() => JSON.parse(JSON.stringify(initial ? pickBriefContent(initial as any) : EMPTY)));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [newType, setNewType] = useState<AssetType>("carousel");

  const input = `w-full px-2.5 py-1.5 rounded-md border text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 ${
    isDark ? "bg-slate-950 border-slate-700 text-slate-100" : "bg-white border-slate-300 text-slate-900"
  }`;
  const label = `block text-[10px] font-mono uppercase tracking-wider font-bold mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`;
  const box = `rounded-xl border p-4 space-y-3 ${isDark ? "border-slate-800 bg-slate-950/30" : "border-slate-200 bg-slate-50"}`;
  const smallBtn = "inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors";

  const set = <K extends keyof BriefContent>(k: K, v: BriefContent[K]) => setC((p) => ({ ...p, [k]: v }));
  const setAsset = (i: number, patch: Partial<BriefAsset>) =>
    setC((p) => ({ ...p, assets: p.assets.map((a, j) => (j === i ? ({ ...a, ...patch } as BriefAsset) : a)) }));

  const togglePlatform = (list: Platform[], p: Platform) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]);

  const save = async () => {
    // Captions only for platforms the asset runs on, and only when written.
    const cleaned: BriefContent = {
      ...c,
      assets: c.assets.map((a, i) => ({
        ...a,
        id: a.id || `a${i + 1}`,
        captions: a.captions.filter((cap) => a.platforms.includes(cap.platform) && cap.text.trim()),
        ...(a.type === "carousel" ? { slides: a.slides.map((s, n) => ({ ...s, n: n + 1 })) } : {}),
        ...(a.type === "blog" ? { slug: slugify(a.slug || a.title) } : {}),
        ...(a.slot === "" ? { slot: undefined } : {}),
      })) as BriefAsset[],
    };
    const result = safeParseBriefContent(JSON.parse(JSON.stringify(cleaned)));
    if ("errors" in result) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await onSave(result.content);
    } catch (e: any) {
      setErrors([e?.message || "Save failed."]);
    } finally {
      setSaving(false);
    }
  };

  const PlatformPicker: React.FC<{ value: Platform[]; onChange: (v: Platform[]) => void }> = ({ value, onChange }) => (
    <div className="flex flex-wrap gap-1.5">
      {PLATFORMS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(togglePlatform(value, p))}
          aria-pressed={value.includes(p)}
          className={`${smallBtn} ${value.includes(p) ? "bg-violet-600 border-violet-600 text-white" : isDark ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-600"}`}
        >
          {p}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 p-3 md:p-6" role="dialog" aria-modal="true" aria-label={heading}>
      <div className={`w-full max-w-4xl rounded-2xl border shadow-2xl ${isDark ? "bg-[#18191E] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}>
        <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <h3 className="text-sm font-bold">{heading}</h3>
          <button type="button" onClick={onCancel} className="p-1.5 rounded hover:bg-slate-500/20 cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block"><span className={label}>Title</span><input className={input} value={c.title} onChange={(e) => set("title", e.target.value)} /></label>
            <label className="block"><span className={label}>Content pillar</span><input className={input} value={c.pillar} onChange={(e) => set("pillar", e.target.value)} /></label>
          </div>
          <div><label className={label}>Platforms</label><PlatformPicker value={c.platforms} onChange={(v) => set("platforms", v)} /></div>
          <label className="block"><span className={label}>Personas (one per line)</span><textarea className={input} rows={2} value={c.personas.join("\n")} onChange={(e) => set("personas", lines(e.target.value))} /></label>
          <label className="block"><span className={label}>Key message: the one thing, one sentence</span><input className={input} value={c.keyMessage} onChange={(e) => set("keyMessage", e.target.value)} /></label>
          <label className="block"><span className={label}>Rationale: why this, why now</span><textarea className={input} rows={3} value={c.rationale} onChange={(e) => set("rationale", e.target.value)} /></label>

          {/* Assets */}
          {c.assets.map((a, i) => (
            <div key={i} className={box}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">Asset {i + 1} · {assetTypeLabel(a.type)}</span>
                <button type="button" onClick={() => set("assets", c.assets.filter((_, j) => j !== i))} className={`${smallBtn} border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:text-white`}>
                  <Trash2 className="w-3 h-3" /> Remove asset
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="block"><span className={label}>Title</span><input className={input} value={a.title} onChange={(e) => setAsset(i, { title: e.target.value })} /></label>
                <label className="block"><span className={label}>Spec (size, length)</span><input className={input} placeholder="1080x1350, 7 slides" value={a.spec} onChange={(e) => setAsset(i, { spec: e.target.value })} /></label>
                <label className="block"><span className={label}>Slot (optional)</span><input className={input} placeholder="Tue 6pm" value={a.slot || ""} onChange={(e) => setAsset(i, { slot: e.target.value })} /></label>
              </div>
              <div><label className={label}>Runs on</label><PlatformPicker value={a.platforms} onChange={(v) => setAsset(i, { platforms: v })} /></div>

              {a.type === "carousel" && (
                <div className="space-y-2">
                  <label className={label}>Slides</label>
                  {a.slides.map((s, n) => (
                    <div key={n} className="grid gap-2 md:grid-cols-[32px_1fr_1fr_auto] items-start">
                      <span className="text-xs font-mono pt-2">{n + 1}</span>
                      <div className="space-y-1.5">
                        <input className={input} placeholder="Headline" value={s.headline} onChange={(e) => setAsset(i, { slides: a.slides.map((x, k) => (k === n ? { ...x, headline: e.target.value } : x)) })} />
                        <textarea className={input} rows={2} placeholder="Body copy" value={s.body} onChange={(e) => setAsset(i, { slides: a.slides.map((x, k) => (k === n ? { ...x, body: e.target.value } : x)) })} />
                      </div>
                      <div className="space-y-1.5">
                        <input className={input} placeholder="Background" value={s.background} onChange={(e) => setAsset(i, { slides: a.slides.map((x, k) => (k === n ? { ...x, background: e.target.value } : x)) })} />
                        <textarea className={input} rows={2} placeholder="Design note" value={s.visualNote} onChange={(e) => setAsset(i, { slides: a.slides.map((x, k) => (k === n ? { ...x, visualNote: e.target.value } : x)) })} />
                      </div>
                      <button type="button" aria-label={`Remove slide ${n + 1}`} onClick={() => setAsset(i, { slides: a.slides.filter((_, k) => k !== n) })} className="p-1.5 text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setAsset(i, { slides: [...a.slides, { n: a.slides.length + 1, background: "", headline: "", body: "", visualNote: "" }] })} className={`${smallBtn} border-violet-500/40 text-violet-500`}><Plus className="w-3 h-3" /> Add slide</button>
                </div>
              )}

              {(a.type === "reel" || a.type === "video") && (
                <div className="space-y-2">
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="block"><span className={label}>Cover text</span><input className={input} value={a.coverText} onChange={(e) => setAsset(i, { coverText: e.target.value })} /></label>
                    <label className="block"><span className={label}>Length (seconds)</span><input type="number" min={1} className={input} value={a.durationSec} onChange={(e) => setAsset(i, { durationSec: Number(e.target.value) || 0 })} /></label>
                    <label className="block"><span className={label}>Audio note</span><input className={input} value={a.audioNote || ""} onChange={(e) => setAsset(i, { audioNote: e.target.value || undefined })} /></label>
                  </div>
                  <label className={label}>Scenes</label>
                  {a.scenes.map((sc, n) => {
                    const upd = (patch: Partial<typeof sc>) => setAsset(i, { scenes: a.scenes.map((x, k) => (k === n ? { ...x, ...patch } : x)) });
                    return (
                      <div key={n} className="grid gap-2 md:grid-cols-[64px_64px_1fr_1fr_1fr_auto] items-start">
                        <input type="number" min={0} className={input} aria-label="Start (s)" value={sc.start} onChange={(e) => upd({ start: Number(e.target.value) || 0 })} />
                        <input type="number" min={0} className={input} aria-label="End (s)" value={sc.end} onChange={(e) => upd({ end: Number(e.target.value) || 0 })} />
                        <textarea className={input} rows={2} placeholder="Visual" value={sc.visual} onChange={(e) => upd({ visual: e.target.value })} />
                        <textarea className={input} rows={2} placeholder="On-screen text" value={sc.onScreenText} onChange={(e) => upd({ onScreenText: e.target.value })} />
                        <textarea className={input} rows={2} placeholder="Voiceover" value={sc.voiceover} onChange={(e) => upd({ voiceover: e.target.value })} />
                        <button type="button" aria-label={`Remove scene ${n + 1}`} onClick={() => setAsset(i, { scenes: a.scenes.filter((_, k) => k !== n) })} className="p-1.5 text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    );
                  })}
                  <button type="button" onClick={() => {
                    const last = a.scenes[a.scenes.length - 1];
                    setAsset(i, { scenes: [...a.scenes, { start: last?.end || 0, end: (last?.end || 0) + 5, visual: "", onScreenText: "", voiceover: "" }] });
                  }} className={`${smallBtn} border-violet-500/40 text-violet-500`}><Plus className="w-3 h-3" /> Add scene</button>
                </div>
              )}

              {a.type === "blog" && (
                <div className="space-y-2">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block"><span className={label}>Slug</span><input className={input} placeholder="from-title-if-empty" value={a.slug} onChange={(e) => setAsset(i, { slug: e.target.value })} /></label>
                    <label className="block"><span className={label}>Meta description</span><input className={input} value={a.metaDescription} onChange={(e) => setAsset(i, { metaDescription: e.target.value })} /></label>
                  </div>
                  <label className="block"><span className={label}>Article (markdown)</span><textarea className={`${input} font-mono`} rows={10} value={a.body} onChange={(e) => setAsset(i, { body: e.target.value })} /></label>
                </div>
              )}

              {a.type === "static" && (
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block"><span className={label}>Headline</span><input className={input} value={a.headline} onChange={(e) => setAsset(i, { headline: e.target.value })} /></label>
                  <label className="block"><span className={label}>Body copy</span><textarea className={input} rows={2} value={a.body} onChange={(e) => setAsset(i, { body: e.target.value })} /></label>
                  <label className="block"><span className={label}>Design note</span><textarea className={input} rows={2} value={a.visualNote} onChange={(e) => setAsset(i, { visualNote: e.target.value })} /></label>
                </div>
              )}

              {a.type === "text" && (
                <label className="block"><span className={label}>Post</span><textarea className={input} rows={5} value={a.body} onChange={(e) => setAsset(i, { body: e.target.value })} /></label>
              )}

              {/* One caption per platform the asset runs on */}
              {a.platforms.map((p) => {
                const cap = a.captions.find((x) => x.platform === p) || { platform: p, text: "", hashtags: [] };
                const upd = (patch: Partial<Caption>) => {
                  const next = { ...cap, ...patch };
                  setAsset(i, { captions: [...a.captions.filter((x) => x.platform !== p), next] });
                };
                return (
                  <div key={p} className="grid gap-2 md:grid-cols-[1fr_200px]">
                    <label className="block"><span className={label}>{p} caption</span><textarea className={input} rows={2} value={cap.text} onChange={(e) => upd({ text: e.target.value })} /></label>
                    <div className="space-y-1.5">
                      <label className={label}>Hashtags</label>
                      <input className={input} placeholder="#one #two" value={cap.hashtags.join(" ")} onChange={(e) => upd({ hashtags: e.target.value.split(/\s+/).filter(Boolean) })} />
                      <input className={input} placeholder="First comment (optional)" value={cap.firstComment || ""} onChange={(e) => upd({ firstComment: e.target.value || undefined })} />
                    </div>
                  </div>
                );
              })}
              <label className="block"><span className={label}>CTA</span><input className={input} value={a.cta} onChange={(e) => setAsset(i, { cta: e.target.value })} /></label>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <select className={input.replace("w-full", "w-auto")} value={newType} onChange={(e) => setNewType(e.target.value as AssetType)} aria-label="New asset type">
              {ASSET_TYPES.map((t) => <option key={t} value={t}>{assetTypeLabel(t)}</option>)}
            </select>
            <button type="button" onClick={() => set("assets", [...c.assets, newAsset(newType, c.assets.length + 1, c.platforms)])} className={`${smallBtn} py-1.5 border-violet-500/40 text-violet-500`}>
              <Plus className="w-3 h-3" /> Add asset
            </button>
          </div>

          {/* Notes, unconfirmed, success */}
          <label className="block"><span className={label}>Production notes (one per line)</span><textarea className={input} rows={2} value={c.productionNotes.join("\n")} onChange={(e) => set("productionNotes", lines(e.target.value))} /></label>

          <div className="space-y-2">
            <label className={label}>Unconfirmed items (these block approval)</label>
            {c.unconfirmed.map((u, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[220px_1fr_auto]">
                <input className={input} placeholder="Where, e.g. assets[0].slides[2].body" value={u.field} onChange={(e) => set("unconfirmed", c.unconfirmed.map((x, k) => (k === i ? { ...x, field: e.target.value } : x)))} />
                <input className={input} placeholder="What needs confirming, and by whom" value={u.note} onChange={(e) => set("unconfirmed", c.unconfirmed.map((x, k) => (k === i ? { ...x, note: e.target.value } : x)))} />
                <button type="button" aria-label="Remove item" onClick={() => set("unconfirmed", c.unconfirmed.filter((_, k) => k !== i))} className="p-1.5 text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button type="button" onClick={() => set("unconfirmed", [...c.unconfirmed, { field: "", note: "" }])} className={`${smallBtn} border-rose-500/40 text-rose-500`}><Plus className="w-3 h-3" /> Add unconfirmed item</button>
          </div>

          <div className="space-y-2">
            <label className={label}>Success measures</label>
            {c.successMeasures.map((m, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_1.5fr_auto]">
                <input className={input} placeholder="Metric" value={m.metric} onChange={(e) => set("successMeasures", c.successMeasures.map((x, k) => (k === i ? { ...x, metric: e.target.value } : x)))} />
                <input className={input} placeholder="Target" value={m.target} onChange={(e) => set("successMeasures", c.successMeasures.map((x, k) => (k === i ? { ...x, target: e.target.value } : x)))} />
                <input className={input} placeholder="Where it's read" value={m.source} onChange={(e) => set("successMeasures", c.successMeasures.map((x, k) => (k === i ? { ...x, source: e.target.value } : x)))} />
                <button type="button" aria-label="Remove measure" onClick={() => set("successMeasures", c.successMeasures.filter((_, k) => k !== i))} className="p-1.5 text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button type="button" onClick={() => set("successMeasures", [...c.successMeasures, { metric: "", target: "", source: "" }])} className={`${smallBtn} border-violet-500/40 text-violet-500`}><Plus className="w-3 h-3" /> Add measure</button>
          </div>

          {errors.length > 0 && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-500" role="alert">
              <div className="flex items-center gap-1.5 font-bold mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Fix these before saving:</div>
              <ul className="list-disc pl-5 space-y-0.5">{errors.slice(0, 12).map((e, i) => <li key={i} className="font-mono">{e}</li>)}</ul>
            </div>
          )}
        </div>

        <div className={`flex justify-end gap-2 px-5 py-3 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <button type="button" onClick={onCancel} className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${isDark ? "border-slate-700" : "border-slate-300"}`}>Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white cursor-pointer disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save brief"}
          </button>
        </div>
      </div>
    </div>
  );
};
