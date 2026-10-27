import React from "react";
import { Sparkles } from "lucide-react";

// Items written through the Claude connector carry createdBy: "claude".
export const isClaudeDraft = (item: { createdBy?: string } | null | undefined) => item?.createdBy === "claude";

export const ClaudeDraftBadge: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <span
    title="Drafted by Claude through the NOK OS connector. Review before approving."
    className={`inline-flex items-center shrink-0 rounded-full font-mono font-bold border bg-orange-500/10 text-orange-500 border-orange-500/30 ${
      compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[9px]"
    }`}
  >
    <Sparkles className={compact ? "w-2 h-2 mr-0.5" : "w-3 h-3 mr-1"} />
    {compact ? "Claude" : "Drafted by Claude"}
  </span>
);

// Toggle used by list screens to show only Claude's drafts.
export const ClaudeDraftFilter: React.FC<{ active: boolean; count: number; onToggle: () => void; id?: string }> = ({
  active,
  count,
  onToggle,
  id,
}) => (
  <button
    id={id}
    type="button"
    onClick={onToggle}
    aria-pressed={active}
    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
      active
        ? "bg-orange-500 text-white border-orange-500"
        : "bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500/20"
    }`}
  >
    <Sparkles className="w-3 h-3" />
    Drafted by Claude ({count})
  </button>
);
