import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertTriangle, Check, Clock, Copy, Layers, Film, FileText, Image as ImageIcon, Type as TypeIcon } from "lucide-react";
import { assetTypeLabel, type BriefAsset, type BriefContent, type Caption } from "../../lib/briefs";

// Read-only v2 brief. "staff" sees everything; "client" (share-link review)
// doesn't see internal planning (rationale, production notes, success
// measures) and sees unconfirmed items as "waiting on confirmation".
interface Props {
  brief: BriefContent;
  audience: "staff" | "client";
  isDark: boolean;
  // Staff only: remove an unconfirmed item once it has been checked.
  onConfirmItem?: (index: number) => void;
}

const ASSET_ICONS: Record<BriefAsset["type"], React.ElementType> = {
  carousel: Layers, reel: Film, video: Film, blog: FileText, static: ImageIcon, text: TypeIcon,
};

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
};

export const BriefV2View: React.FC<Props> = ({ brief, audience, isDark, onConfirmItem }) => {
  const staff = audience === "staff";
  const card = isDark ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const strong = isDark ? "text-slate-100" : "text-slate-900";
  const label = `text-[10px] font-mono uppercase tracking-wider font-bold ${muted}`;
  const chip = `text-[10px] font-mono px-2 py-0.5 rounded-full border ${isDark ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-600"}`;

  return (
    <div className="space-y-5">
      {/* Key message + header facts */}
      <section className={`rounded-xl border p-4 ${card}`}>
        <div className={label}>Key message</div>
        <p className={`mt-1 text-base font-semibold leading-snug ${strong}`}>{brief.keyMessage}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 items-center">
          <span className={`${chip} font-bold`}>{brief.pillar}</span>
          {brief.platforms.map((p) => <span key={p} className={chip}>{p}</span>)}
        </div>
        {brief.personas.length > 0 && (
          <p className={`mt-2 text-xs ${muted}`}><span className="font-semibold">For:</span> {brief.personas.join(" · ")}</p>
        )}
      </section>

      {staff && (
        <section>
          <div className={label}>Rationale: why this, why now</div>
          <p className={`mt-1 text-sm leading-relaxed whitespace-pre-wrap ${strong}`}>{brief.rationale}</p>
        </section>
      )}

      <UnconfirmedBlock brief={brief} staff={staff} isDark={isDark} onConfirmItem={onConfirmItem} />

      {brief.assets.map((asset, i) => (
        <AssetSection key={asset.id || i} asset={asset} index={i} isDark={isDark} />
      ))}

      {staff && brief.productionNotes.length > 0 && (
        <section>
          <div className={label}>Production notes</div>
          <ul className={`mt-1 list-disc pl-5 text-sm space-y-1 ${strong}`}>
            {brief.productionNotes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </section>
      )}

      {staff && brief.successMeasures.length > 0 && (
        <section>
          <div className={label}>Success measures</div>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className={`text-left ${muted}`}><th className="py-1 pr-3">Metric</th><th className="py-1 pr-3">Target</th><th className="py-1">Where it's read</th></tr></thead>
              <tbody>
                {brief.successMeasures.map((m, i) => (
                  <tr key={i} className={`border-t ${isDark ? "border-slate-800" : "border-slate-200"} ${strong}`}>
                    <td className="py-1.5 pr-3 font-semibold">{m.metric}</td><td className="py-1.5 pr-3">{m.target}</td><td className="py-1.5">{m.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

const UnconfirmedBlock: React.FC<{ brief: BriefContent; staff: boolean; isDark: boolean; onConfirmItem?: (i: number) => void }> = ({ brief, staff, isDark, onConfirmItem }) => {
  if (brief.unconfirmed.length === 0) return null;
  const tone = staff
    ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
    : "border-amber-500/40 bg-amber-500/10 text-amber-600";
  return (
    <section className={`rounded-xl border p-4 ${tone}`} role="alert">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        {staff ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        {staff
          ? `Blocks approval: ${brief.unconfirmed.length} unconfirmed item${brief.unconfirmed.length === 1 ? "" : "s"}`
          : "Waiting on confirmation"}
      </div>
      <ul className="mt-2 space-y-2">
        {brief.unconfirmed.map((u, i) => (
          <li key={i} className="flex items-start justify-between gap-3 text-sm">
            <span className={isDark ? "text-slate-200" : "text-slate-800"}>
              {u.note}
              {staff && <span className="block text-[10px] font-mono opacity-70">{u.field}</span>}
            </span>
            {staff && onConfirmItem && (
              <button
                type="button"
                onClick={() => onConfirmItem(i)}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded border border-current text-[10px] font-mono font-bold hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                title="I've checked this: remove it from the blocking list"
              >
                <Check className="w-3 h-3" /> Mark confirmed
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

const AssetSection: React.FC<{ asset: BriefAsset; index: number; isDark: boolean }> = ({ asset, index, isDark }) => {
  const Icon = ASSET_ICONS[asset.type];
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const strong = isDark ? "text-slate-100" : "text-slate-900";
  const border = isDark ? "border-slate-800" : "border-slate-200";
  const th = `py-1.5 pr-3 text-left font-mono text-[10px] uppercase ${muted}`;
  const td = `py-2 pr-3 align-top ${strong}`;

  return (
    <section className={`rounded-xl border ${border} overflow-hidden`}>
      <header className={`px-4 py-3 border-b ${border} ${isDark ? "bg-slate-900/60" : "bg-slate-100"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Icon className="w-4 h-4 text-violet-500" />
          <span className={`text-[10px] font-mono font-bold uppercase ${muted}`}>Asset {index + 1} · {assetTypeLabel(asset.type)}</span>
          <h4 className={`text-sm font-bold ${strong}`}>{asset.title}</h4>
        </div>
        <p className={`mt-1 text-[11px] font-mono ${muted}`}>
          {asset.platforms.join(", ")} · {asset.spec}{asset.slot ? ` · ${asset.slot}` : ""}
        </p>
      </header>

      <div className="p-4 space-y-4 text-sm">
        {asset.type === "carousel" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead><tr><th className={th}>#</th><th className={th}>Headline</th><th className={th}>Body copy</th><th className={th}>Background</th><th className={th}>Design note</th></tr></thead>
              <tbody>
                {asset.slides.map((s) => (
                  <tr key={s.n} className={`border-t ${border}`}>
                    <td className={`${td} font-mono`}>{s.n}</td>
                    <td className={`${td} font-semibold`}>{s.headline}</td>
                    <td className={`${td} whitespace-pre-wrap`}>{s.body}</td>
                    <td className={`${td} ${muted}`}>{s.background}</td>
                    <td className={`${td} ${muted}`}>{s.visualNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(asset.type === "reel" || asset.type === "video") && (
          <>
            <p className={`text-xs ${muted}`}>
              <span className="font-semibold">Cover:</span> {asset.coverText || "—"} · <span className="font-semibold">Length:</span> {formatTime(asset.durationSec)}
              {asset.audioNote && <> · <span className="font-semibold">Audio:</span> {asset.audioNote}</>}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead><tr><th className={th}>Time</th><th className={th}>Visual</th><th className={th}>On-screen text</th><th className={th}>Voiceover</th></tr></thead>
                <tbody>
                  {asset.scenes.map((s, i) => (
                    <tr key={i} className={`border-t ${border}`}>
                      <td className={`${td} font-mono whitespace-nowrap`}>{formatTime(s.start)}–{formatTime(s.end)}</td>
                      <td className={td}>{s.visual}</td>
                      <td className={`${td} font-semibold`}>{s.onScreenText}</td>
                      <td className={`${td} italic`}>{s.voiceover}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {asset.type === "blog" && (
          <>
            <p className={`text-xs font-mono ${muted}`}>/{asset.slug}</p>
            {asset.metaDescription && <p className={`text-xs ${muted}`}><span className="font-semibold">Meta description:</span> {asset.metaDescription}</p>}
            <article className={`brief-markdown rounded-lg border ${border} p-4 ${strong}`}>
              <ReactMarkdown
                components={{
                  h1: (p) => <h1 className="text-lg font-bold mt-3 mb-2" {...p} />,
                  h2: (p) => <h2 className="text-base font-bold mt-3 mb-1.5" {...p} />,
                  h3: (p) => <h3 className="text-sm font-bold mt-2 mb-1" {...p} />,
                  p: (p) => <p className="text-sm leading-relaxed mb-2" {...p} />,
                  ul: (p) => <ul className="list-disc pl-5 mb-2 text-sm space-y-1" {...p} />,
                  ol: (p) => <ol className="list-decimal pl-5 mb-2 text-sm space-y-1" {...p} />,
                  a: (p) => <a className="text-violet-500 underline" {...p} />,
                }}
              >
                {asset.body}
              </ReactMarkdown>
            </article>
          </>
        )}

        {asset.type === "static" && (
          <dl className="grid gap-2 sm:grid-cols-[120px_1fr] text-xs">
            <dt className={muted}>Headline</dt><dd className={`font-semibold ${strong}`}>{asset.headline || "—"}</dd>
            <dt className={muted}>Body copy</dt><dd className={`whitespace-pre-wrap ${strong}`}>{asset.body || "—"}</dd>
            <dt className={muted}>Design note</dt><dd className={strong}>{asset.visualNote || "—"}</dd>
          </dl>
        )}

        {asset.type === "text" && <p className={`whitespace-pre-wrap leading-relaxed ${strong}`}>{asset.body}</p>}

        {asset.captions.length > 0 && (
          <div className="space-y-2">
            <div className={`text-[10px] font-mono uppercase tracking-wider font-bold ${muted}`}>Captions</div>
            {asset.captions.map((c, i) => <CaptionCard key={i} caption={c} isDark={isDark} />)}
          </div>
        )}

        {asset.cta && (
          <p className="text-xs"><span className={`font-mono uppercase text-[10px] font-bold ${muted}`}>CTA </span><span className={`font-semibold ${strong}`}>{asset.cta}</span></p>
        )}
      </div>
    </section>
  );
};

const CaptionCard: React.FC<{ caption: Caption; isDark: boolean }> = ({ caption, isDark }) => {
  const [copied, setCopied] = useState(false);
  const full = [caption.text, caption.hashtags.join(" ")].filter(Boolean).join("\n\n");
  const copy = () => {
    navigator.clipboard?.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };
  return (
    <div className={`rounded-lg border p-3 ${isDark ? "border-slate-800 bg-slate-950/30" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono font-bold uppercase text-violet-500">{caption.platform}</span>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-violet-500 cursor-pointer">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className={`mt-1 text-sm whitespace-pre-wrap ${isDark ? "text-slate-200" : "text-slate-800"}`}>{caption.text}</p>
      {caption.hashtags.length > 0 && <p className="mt-1 text-xs text-violet-400">{caption.hashtags.join(" ")}</p>}
      {caption.firstComment && <p className="mt-1 text-xs text-slate-400"><span className="font-semibold">First comment:</span> {caption.firstComment}</p>}
    </div>
  );
};
