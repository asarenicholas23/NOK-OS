import React, { useState } from "react";
import { Check, X, MessageSquare } from "lucide-react";
import { REVIEW_LABEL, noteRequired, type ReviewDecision, type ReviewEntry } from "../lib/review";

// Approve / Needs changes / Reject with a reason. Reject and "needs changes"
// can't be submitted without a note, so every decision says why.
interface Props {
  status?: string;
  onReview: (decision: ReviewDecision, note?: string) => Promise<void>;
  idPrefix: string;
}

export const ReviewActions: React.FC<Props> = ({ status, onReview, idPrefix }) => {
  const [pending, setPending] = useState<ReviewDecision | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (decision: ReviewDecision, text?: string) => {
    if (noteRequired(decision) && !(text || "").trim()) {
      setError(decision === "rejected" ? "Add a reason for rejecting." : "Say what needs to change.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onReview(decision, text?.trim() || undefined);
      setPending(null);
      setNote("");
    } catch (e: any) {
      setError(e?.message || "Couldn't save the review.");
    } finally {
      setBusy(false);
    }
  };

  const btn = "px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono font-semibold border disabled:opacity-50";

  if (pending) {
    return (
      <div className="w-full space-y-1.5" onClick={(e) => e.stopPropagation()}>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
          {pending === "rejected" ? "Reason for rejecting" : pending === "changes_requested" ? "What needs to change" : "Note (optional)"}
          <textarea
            autoFocus
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full px-2 py-1.5 rounded border text-xs bg-transparent border-slate-500/40 normal-case tracking-normal focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </label>
        {error && <p className="text-[10px] text-rose-500" role="alert">{error}</p>}
        <div className="flex gap-1.5">
          <button type="button" disabled={busy} onClick={() => submit(pending, note)} className={`${btn} bg-violet-600 border-violet-600 text-white`}>
            {busy ? "Saving…" : `Confirm: ${REVIEW_LABEL[pending]}`}
          </button>
          <button type="button" disabled={busy} onClick={() => { setPending(null); setNote(""); setError(""); }} className={`${btn} border-slate-500/40 text-slate-400`}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
      {status !== "Approved" && (
        <button id={`${idPrefix}-approve`} type="button" disabled={busy} onClick={() => submit("approved")}
          className={`${btn} hover:bg-emerald-600/15 text-emerald-400 border-emerald-500/20`}>
          <Check className="w-3.5 h-3.5" /> Approve
        </button>
      )}
      {status !== "Changes Requested" && (
        <button id={`${idPrefix}-changes`} type="button" onClick={() => setPending("changes_requested")}
          className={`${btn} hover:bg-amber-600/15 text-amber-500 border-amber-500/20`}>
          <MessageSquare className="w-3.5 h-3.5" /> Needs changes
        </button>
      )}
      {status !== "Rejected" && (
        <button id={`${idPrefix}-reject`} type="button" onClick={() => setPending("rejected")}
          className={`${btn} hover:bg-rose-600/15 text-rose-400 border-rose-500/20`}>
          <X className="w-3.5 h-3.5" /> Reject
        </button>
      )}
      {error && <p className="w-full text-[10px] text-rose-500" role="alert">{error}</p>}
    </div>
  );
};

// One line showing the latest decision and its note.
export const LastReviewNote: React.FC<{ review?: ReviewEntry }> = ({ review }) => {
  if (!review) return null;
  const tone = review.decision === "approved" ? "text-emerald-500" : review.decision === "rejected" ? "text-rose-500" : "text-amber-500";
  const when = new Date(review.at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return (
    <p className="text-[11px] leading-snug text-slate-400">
      <span className={`font-semibold ${tone}`}>{REVIEW_LABEL[review.decision]}</span>
      <span> · {review.role === "client" ? "client" : review.by || "staff"} · {when}</span>
      {review.note && <span className="block italic text-slate-400">"{review.note}"</span>}
    </p>
  );
};
