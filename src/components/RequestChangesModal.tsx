import React, { useState } from "react";
import { X, MessageSquare, AlertCircle, Send, Check } from "lucide-react";
import { CreativeBrief, Brand } from "../lib/firebase";

interface RequestChangesModalProps {
  brief: CreativeBrief;
  activeBrand: Brand | null;
  theme: string;
  onClose: () => void;
  onSubmit: (briefId: string, revisionNotes: string) => Promise<void> | void;
}

export const RequestChangesModal: React.FC<RequestChangesModalProps> = ({
  brief,
  activeBrand,
  theme,
  onClose,
  onSubmit
}) => {
  const [comment, setComment] = useState(brief.revisionNotes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDark = theme === "dark";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(brief.id, comment.trim());
      onClose();
    } catch (err) {
      console.error("Failed to request changes:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="request-changes-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="request-changes-dialog"
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
          isDark ? "bg-[#18191E] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? "border-slate-800 bg-[#121316]" : "border-slate-100 bg-slate-50"
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Request Changes & Revisions
              </h3>
              <p className="text-[11px] text-slate-400">
                {brief.dayOfWeek ? `${brief.dayOfWeek} • ` : ""}{brief.title}
              </p>
            </div>
          </div>
          <button
            id="close-request-changes-btn"
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark ? "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className={`p-3 rounded-xl border text-xs space-y-1 ${
            isDark ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-amber-50/50 border-amber-200 text-amber-900"
          }`}>
            <div className="flex items-center space-x-2 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Owner Feedback & Designer Revisions</span>
            </div>
            <p className="text-[11px] opacity-80 pl-5.5">
              This will update the status to <strong className="text-amber-500">Changes Requested</strong> and notify the creative team with your exact feedback.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
              Feedback / Revision Instructions *
            </label>
            <textarea
              id="revision-notes-input"
              rows={4}
              required
              placeholder="e.g. Please adjust the hook on Slide 1 to mention 'consistency over speed'. Make the background gold darker and add product close-up shot."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border font-sans resize-none focus:outline-none transition-all ${
                isDark 
                  ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50" 
                  : "bg-white border-slate-200 text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
              }`}
            />
          </div>

          {/* Quick preset suggestions */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Shorten caption & make punchier",
                "Update hook on Slide 1",
                "Adjust brand colors & contrast",
                "Switch CTA to DM 'POWER'",
                "Add more community focus"
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setComment(prev => prev ? `${prev}\n• ${preset}` : preset)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    isDark ? "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800/40">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-mono rounded-xl border transition-colors cursor-pointer ${
                isDark ? "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              Cancel
            </button>
            <button
              id="submit-request-changes-btn"
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Logging..." : "Submit Revision Request"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
