import React, { useState } from "react";
import { 
  X, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Copy, 
  Check, 
  Sparkles, 
  Download, 
  MessageSquare, 
  Edit3, 
  Eye, 
  Palette,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send
} from "lucide-react";
import { CreativeBrief, Brand } from "../lib/firebase";
import { SlideDeckPreview } from "./SlideDeckPreview";
import { ClaudeDraftBadge, isClaudeDraft } from "./ClaudeDraftBadge";
import { toLegacyView, isV2, approvalBlockers } from "../lib/briefs";
import { BriefV2View } from "./briefs/BriefV2View";
import { BriefV2Editor } from "./briefs/BriefV2Editor";
import { LastReviewNote } from "./ReviewActions";
import { downloadSingleBriefPDF } from "../utils/pdfGenerator";

interface BriefDetailModalProps {
  brief: CreativeBrief;
  activeBrand: Brand | null;
  theme: string;
  activeColor: string;
  onClose: () => void;
  onApprove: (brief: CreativeBrief) => void;
  onRequestChanges: (brief: CreativeBrief) => void;
  // "client" = share-link review: internal planning fields are hidden.
  audience?: "staff" | "client";
  // Staff only: save edits to the brief (v2 editor, "Mark confirmed").
  onUpdate?: (patch: Partial<CreativeBrief>) => Promise<void>;
  // Staff only: reject with a reason.
  onReject?: (brief: CreativeBrief, reason: string) => Promise<void>;
}

export const BriefDetailModal: React.FC<BriefDetailModalProps> = ({
  brief,
  activeBrand,
  theme,
  activeColor,
  onClose,
  onApprove,
  onRequestChanges,
  audience = "staff",
  onUpdate,
  onReject
}) => {
  const [activeTab, setActiveTab] = useState<"owner" | "designer" | "slides">("owner");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const isDark = theme === "dark";
  // Display-only legacy view: v1 briefs pass through unchanged; v2 briefs are
  // flattened until the v2 layout lands. Callbacks still get the real brief.
  const view = toLegacyView(brief);
  const v2 = isV2(brief) ? brief : null;
  const blockers = approvalBlockers(brief);
  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const canEdit = !!v2 && audience === "staff" && !!onUpdate && brief.status !== "Approved";

  const handleCopy = (field: string, text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadPDF = () => {
    downloadSingleBriefPDF(brief, activeBrand, audience);
  };

  return (
    <div 
      id="brief-detail-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        id="brief-detail-dialog"
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
          isDark ? "bg-[#18191E] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          isDark ? "border-slate-800 bg-[#121316]" : "border-slate-100 bg-slate-50"
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-violet-600/15 text-violet-400 border border-violet-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight">
                  {brief.title}
                </h3>
                {brief.dayOfWeek && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {brief.dayOfWeek}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {activeBrand?.name || "Active Brand"} • {brief.date || "Scheduled Campaign Day"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-download-brief-modal-pdf"
              onClick={handleDownloadPDF}
              className={`p-2 rounded-xl border transition-colors cursor-pointer text-xs font-mono flex items-center space-x-1.5 ${
                isDark ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
              title="Download standalone Creative Brief PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              id="btn-close-brief-detail-modal"
              onClick={onClose}
              aria-label="Close"
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark ? "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className={`px-6 py-2 border-b flex items-center justify-between shrink-0 ${
          isDark ? "bg-[#141518] border-slate-800/80" : "bg-slate-100/60 border-slate-200"
        }`}>
          {v2 ? (
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-violet-600 text-white">Brief</span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border cursor-pointer ${isDark ? "border-slate-700 text-slate-300 hover:text-white" : "border-slate-300 text-slate-600 hover:text-slate-900"}`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>
          ) : (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab("owner")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeTab === "owner"
                  ? "bg-violet-600 text-white shadow-sm"
                  : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Owner View (Plain Language)
            </button>
            <button
              onClick={() => setActiveTab("designer")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeTab === "designer"
                  ? "bg-violet-600 text-white shadow-sm"
                  : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Designer Spec View
            </button>
            <button
              onClick={() => setActiveTab("slides")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                activeTab === "slides"
                  ? "bg-violet-600 text-white shadow-sm"
                  : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Interactive Slide Deck
            </button>
          </div>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Status:</span>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              brief.status === "Approved"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : brief.status === "Changes Requested"
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "bg-blue-500/15 text-blue-400 border-blue-500/30"
            }`}>
              {brief.status || "Proposed"}
            </span>
            {audience === "staff" && isClaudeDraft(brief) && <ClaudeDraftBadge />}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {v2 && brief.status === "Changes Requested" && brief.revisionNotes && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs space-y-1">
              <div className="flex items-center space-x-2 font-bold uppercase font-mono">
                <AlertCircle className="w-4 h-4" />
                <span>Owner Feedback / Revision Notes</span>
              </div>
              <p className="italic pl-6">{brief.revisionNotes}</p>
            </div>
          )}
          {v2 && (
            <BriefV2View
              brief={v2}
              audience={audience}
              isDark={isDark}
              onConfirmItem={audience === "staff" && onUpdate ? (i) => { void onUpdate({ unconfirmed: v2.unconfirmed.filter((_, k) => k !== i) }); } : undefined}
            />
          )}
          {!v2 && activeTab === "owner" && (
            <div className="space-y-6">
              {/* Revision note banner if changes requested */}
              {brief.status === "Changes Requested" && brief.revisionNotes && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <div className="flex items-center space-x-2 font-bold uppercase font-mono">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Owner Feedback / Revision Notes</span>
                  </div>
                  <p className="italic pl-6">{brief.revisionNotes}</p>
                </div>
              )}

              {/* Core Attributes Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border space-y-1.5 ${
                  isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Primary Goal & Objective
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {view.objective || "Promote brand collection and increase customer acquisition."}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border space-y-1.5 ${
                  isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Core Customer Message
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    "{brief.keyMessage || "Start the new month with intentional focus and style."}"
                  </p>
                </div>
              </div>

              {/* Visual Copy Story Arc */}
              {view.visualCopyDetail && (
                <div className={`p-5 rounded-xl border space-y-2 ${
                  isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Story Arc & Visual Concept
                    </span>
                    <button
                      onClick={() => handleCopy("visualCopy", view.visualCopyDetail)}
                      className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedField === "visualCopy" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === "visualCopy" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-slate-200 whitespace-pre-line leading-relaxed">
                    {view.visualCopyDetail}
                  </pre>
                </div>
              )}

              {/* Full Caption Copywriting */}
              {view.copywritingCaption && (
                <div className={`p-5 rounded-xl border space-y-2 ${
                  isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Full Caption Copywriting
                    </span>
                    <button
                      onClick={() => handleCopy("caption", view.copywritingCaption)}
                      className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedField === "caption" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === "caption" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {view.copywritingCaption}
                  </p>
                </div>
              )}

              {/* Hashtags */}
              {view.hashtags && (
                <div className={`p-4 rounded-xl border space-y-1.5 ${
                  isDark ? "bg-slate-900/30 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Target Hashtags
                  </span>
                  <p className="text-xs font-mono text-violet-400">
                    {view.hashtags}
                  </p>
                </div>
              )}
            </div>
          )}

          {!v2 && activeTab === "designer" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Format & Specs</span>
                  <p className="text-xs text-slate-200 mt-1 font-mono">{view.formatSpec || view.deliverables || "1080x1350px Portrait"}</p>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Target Audience</span>
                  <p className="text-xs text-slate-200 mt-1">{view.targetAudience || "Urban Tastemakers & Creators"}</p>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Tone & Visual Reference</span>
                  <p className="text-xs text-slate-200 mt-1">{view.visualReference || view.toneVisualRef || "High-contrast editorial minimal"}</p>
                </div>
              </div>

              <div className={`p-5 rounded-xl border space-y-2 ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Deliverables Scope
                </span>
                <p className="text-xs text-slate-200">{view.deliverables || "Multi-slide carousel asset and caption package."}</p>
              </div>

              {view.contentOutline && (
                <div className={`p-5 rounded-xl border space-y-2 ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Technical Outline
                  </span>
                  <pre className="text-xs font-mono text-slate-300 whitespace-pre-line leading-relaxed">
                    {view.contentOutline}
                  </pre>
                </div>
              )}
            </div>
          )}

          {!v2 && activeTab === "slides" && (
            <div>
              <SlideDeckPreview 
                brief={{
                  title: brief.title,
                  objective: view.objective,
                  targetAudience: view.targetAudience,
                  keyMessage: brief.keyMessage,
                  deliverables: view.deliverables,
                  contentOutline: view.contentOutline || view.visualCopyDetail || "",
                  cta: view.cta,
                  toneVisualRef: view.visualReference || view.toneVisualRef,
                  formatSpec: view.formatSpec
                }}
                brandName={activeBrand?.name || "Active Brand"}
                brandColor={activeBrand?.primaryColor || activeColor || "violet"}
              />
            </div>
          )}
        </div>

        {audience === "staff" && brief.lastReview && (
          <div className={`px-6 py-2 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <LastReviewNote review={brief.lastReview} />
          </div>
        )}

        {audience === "staff" && rejecting && onReject && (
          <div className={`px-6 py-3 border-t space-y-2 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Reason for rejecting
              <textarea
                autoFocus
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 w-full px-2 py-1.5 rounded border text-xs bg-transparent border-slate-500/40 normal-case tracking-normal focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </label>
            {rejectError && <p className="text-[11px] text-rose-500" role="alert">{rejectError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!rejectReason.trim()) { setRejectError("Add a reason for rejecting."); return; }
                  await onReject(brief, rejectReason.trim());
                  setRejecting(false);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
              >
                Confirm reject
              </button>
              <button type="button" onClick={() => { setRejecting(false); setRejectError(""); }} className="px-3 py-1.5 rounded-lg text-xs font-mono border border-slate-500/40 text-slate-400 cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer with Actions */}
        <div className={`px-6 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
          isDark ? "bg-[#121316] border-slate-800" : "bg-slate-50 border-slate-100"
        }`}>
          <div className="text-xs text-slate-400">
            {brief.status === "Approved" ? (
              <span className="text-emerald-400 font-semibold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" />
                Approved & Synced to Posting Queue
              </span>
            ) : brief.status === "Changes Requested" ? (
              <span className="text-amber-400 font-semibold flex items-center">
                <AlertCircle className="w-4 h-4 mr-1 text-amber-400" />
                Awaiting Designer Revisions
              </span>
            ) : blockers.length > 0 ? (
              <span className="text-rose-500 font-semibold flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {audience === "client" ? "Waiting on confirmation before approval" : `${blockers.length} unconfirmed item(s) block approval`}
              </span>
            ) : (
              <span>Awaiting Owner Approval</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {audience === "staff" && onReject && brief.status !== "Rejected" && !rejecting && (
              <button
                id="btn-modal-reject-brief"
                type="button"
                onClick={() => setRejecting(true)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            )}
            <button
              id="btn-modal-request-changes"
              type="button"
              onClick={() => {
                onRequestChanges(brief);
                onClose();
              }}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Request Changes</span>
            </button>

            <button
              id="btn-modal-approve-brief"
              type="button"
              disabled={blockers.length > 0}
              title={blockers.length > 0 ? `${blockers.length} unconfirmed item(s) must be confirmed before approval` : undefined}
              onClick={() => {
                if (blockers.length > 0) return;
                onApprove(brief);
                onClose();
              }}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve & Push to Queue</span>
            </button>
          </div>
        </div>
      </div>
      {editing && v2 && onUpdate && (
        <BriefV2Editor
          heading={`Edit brief: ${v2.title}`}
          initial={v2}
          isDark={isDark}
          onCancel={() => setEditing(false)}
          onSave={async (content) => {
            await onUpdate(content);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
};
