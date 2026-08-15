import React, { useState } from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Sparkles, 
  Download, 
  Presentation, 
  Mail, 
  Send, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Layers, 
  Maximize2, 
  MessageSquare, 
  ShieldAlert, 
  Palette, 
  FileCode, 
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { CreativeBrief, Brand } from "../lib/firebase";

export interface UnconfirmedFlag {
  field: string;
  fieldKey: string;
  reason: string;
  excerpt: string;
}

/**
 * Global rule: detects any field in a brief that is a placeholder, assumption,
 * or generated without real client-confirmed data.
 */
export function detectUnconfirmedData(brief: CreativeBrief): UnconfirmedFlag[] {
  const flags: UnconfirmedFlag[] = [];
  const fieldsToCheck: { key: keyof CreativeBrief; label: string }[] = [
    { key: "proofPoint", label: "Proof Point / Data Source" },
    { key: "keyMessage", label: "Core Message" },
    { key: "objective", label: "Objective" },
    { key: "targetAudience", label: "Target Audience" },
    { key: "deliverables", label: "Deliverables Scope" },
    { key: "formatSpec", label: "Format & Tech Spec" },
    { key: "contentOutline", label: "Content Outline" },
    { key: "cta", label: "Call to Action" },
    { key: "toneVisualRef", label: "Tone & Visual Reference" },
    { key: "successMetric", label: "Success Metric" },
    { key: "title", label: "Brief Title" }
  ];

  const placeholderPatterns = [
    /placeholder/i,
    /needs\s+real\s+data/i,
    /unconfirmed/i,
    /unverified/i,
    /verify\s+(?:claim|with|data)/i,
    /pending\s+(?:confirmation|data|verification)/i,
    /assumption/i,
    /\[tbd\]/i,
    /\btbd\b/i,
    /\btodo\b/i,
    /\[insert/i,
    /\binsert\s+[a-z]+/i,
    /approx(?:\.|\b)/i,
    /estimated\s+(?:team|locations?|turnaround|coverage|revenue|size)/i,
    /check\s+with\s+client/i
  ];

  fieldsToCheck.forEach(({ key, label }) => {
    const value = (brief[key] as string) || "";
    if (!value) return;

    for (const pattern of placeholderPatterns) {
      if (pattern.test(value)) {
        const match = value.match(pattern);
        let excerpt = value;
        if (value.length > 90) {
          const idx = value.toLowerCase().indexOf((match?.[0] || "").toLowerCase());
          const start = Math.max(0, idx - 20);
          const end = Math.min(value.length, idx + 60);
          excerpt = (start > 0 ? "..." : "") + value.substring(start, end).trim() + (end < value.length ? "..." : "");
        }

        let reason = "Contains placeholder or unverified claim";
        if (/placeholder/i.test(value)) reason = "Explicitly marked as PLACEHOLDER";
        else if (/needs\s+real\s+data/i.test(value)) reason = "Requires real client-confirmed data before publishing";
        else if (/unconfirmed|unverified/i.test(value)) reason = "Unconfirmed claim requiring client sign-off";
        else if (/tbd|todo/i.test(value)) reason = "Contains TBD/TODO placeholder tag";
        else if (/assumption/i.test(value)) reason = "Based on unverified working assumption";

        flags.push({
          field: label,
          fieldKey: key,
          reason,
          excerpt
        });
        break;
      }
    }
  });

  return flags;
}

interface CreativeBriefCardProps {
  brief: CreativeBrief;
  activeBrand: Brand | null;
  theme: string;
  activeColor: string;
  isSelected: boolean;
  onToggleSelect: (id: string, selected: boolean) => void;
  onApprove: (brief: CreativeBrief) => void;
  onRequestChanges: (brief: CreativeBrief, notes: string) => void;
  onEdit: (brief: CreativeBrief) => void;
  onDelete: (briefId: string) => void;
  onDownloadPDF: (brief: CreativeBrief) => void;
  onEmailModal: (brief: CreativeBrief) => void;
  onSlideDeckPreview: (briefId: string) => void;
  onSyncToPipeline: (brief: CreativeBrief) => void;
  gmailToken: string | null;
  globalViewMode?: "owner" | "designer";
}

export const CreativeBriefCard: React.FC<CreativeBriefCardProps> = ({
  brief,
  activeBrand,
  theme,
  activeColor,
  isSelected,
  onToggleSelect,
  onApprove,
  onRequestChanges,
  onEdit,
  onDelete,
  onDownloadPDF,
  onEmailModal,
  onSlideDeckPreview,
  onSyncToPipeline,
  gmailToken,
  globalViewMode = "owner"
}) => {
  // Local card tab: default to Owner View (or honor global override if switched)
  const [viewMode, setViewMode] = useState<"owner" | "designer">(globalViewMode);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeNotes, setChangeNotes] = useState("");
  const [showApprovalWarningModal, setShowApprovalWarningModal] = useState(false);
  const [copiedHeadline, setCopiedHeadline] = useState(false);

  // Sync with global override when it changes
  React.useEffect(() => {
    setViewMode(globalViewMode);
  }, [globalViewMode]);

  const isDark = theme === "dark";
  const unconfirmedFlags = detectUnconfirmedData(brief);
  const hasUnconfirmedData = unconfirmedFlags.length > 0;

  // Extract clean plain text for Owner View
  const getPlainAssetPurpose = () => {
    if (!brief.objective) return "Promotional and marketing campaign asset.";
    // Clean out unnecessary jargon words if present or return direct readable sentence
    const clean = brief.objective
      .replace(/^define\s+primary\s+marketing[,\s]+/i, "")
      .replace(/^the\s+objective\s+is\s+to\s+/i, "To ")
      .trim();
    // Return first sentence or full clean string
    const firstSentence = clean.split(/(?<=[.?!])\s+/)[0];
    return firstSentence || clean;
  };

  const getPlainCoreMessage = () => {
    if (!brief.keyMessage) return "Key marketing message";
    // Strip persona brackets or meta prefixes if present
    return brief.keyMessage.replace(/^["']|["']$/g, "").trim();
  };

  const getPlainPlacementFormat = () => {
    const format = brief.formatSpec || brief.deliverables || "Social Media Asset";
    // Extract format & placement in plain terms
    return format;
  };

  // Helper for brand color hex
  const getBrandHex = () => {
    if (activeBrand?.primaryColor === "emerald" || activeColor === "emerald") return "#10b981";
    if (activeBrand?.primaryColor === "rose" || activeColor === "rose") return "#f43f5e";
    if (activeBrand?.primaryColor === "amber" || activeColor === "amber") return "#f59e0b";
    if (activeBrand?.primaryColor === "indigo" || activeColor === "indigo") return "#6366f1";
    return "#8b5cf6"; // Violet / Gold accent
  };

  const getStatusBadge = () => {
    switch (brief.status) {
      case "Approved":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Proposed":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Changes Requested":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold";
      case "In Progress":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Draft":
      default:
        return "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700";
    }
  };

  // Handle Approve with Unconfirmed Data check
  const handleApproveClick = () => {
    if (hasUnconfirmedData) {
      // Must show blocking warning first before allowing approval
      setShowApprovalWarningModal(true);
    } else {
      onApprove(brief);
    }
  };

  const handleConfirmApprovalWithWarning = () => {
    setShowApprovalWarningModal(false);
    onApprove(brief);
  };

  const handleRequestChangesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestChanges(brief, changeNotes || "Changes requested by owner");
    setShowChangeModal(false);
    setChangeNotes("");
  };

  const copyHeadline = () => {
    navigator.clipboard.writeText(`${brief.title}\n\n${brief.keyMessage}\n\nCTA: ${brief.cta || ""}`);
    setCopiedHeadline(true);
    setTimeout(() => setCopiedHeadline(false), 2000);
  };

  // Parse content outline into structured beat cards for Designer View
  const parseOutlineBeats = () => {
    const raw = brief.contentOutline || "";
    if (!raw) return [];
    // Check if separated by pipe | or newline or numbered list
    let beats: string[] = [];
    if (raw.includes("|")) {
      beats = raw.split("|").map(s => s.trim()).filter(Boolean);
    } else if (raw.includes("\n")) {
      beats = raw.split("\n").map(s => s.trim()).filter(Boolean);
    } else {
      beats = [raw];
    }
    return beats;
  };

  const outlineBeats = parseOutlineBeats();

  return (
    <div
      id={`brief-card-${brief.id}`}
      className={`border rounded-2xl flex flex-col justify-between transition-all duration-200 shadow-md overflow-hidden ${
        isSelected
          ? "border-violet-500 ring-2 ring-violet-500/30 bg-violet-500/[0.02]"
          : isDark
            ? "bg-[#1C1C22] border-white/10 hover:border-white/20"
            : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Top Header & View Switcher Bar */}
      <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDark ? "border-white/10 bg-[#15151A]/60" : "border-slate-150 bg-slate-50/70"
      }`}>
        {/* Left: Checkbox + Title + Status */}
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <label 
            htmlFor={`select-brief-${brief.id}`}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer select-none shrink-0 ${
              isSelected 
                ? "bg-violet-600/20 border-violet-500/50 text-violet-300 font-bold shadow-xs" 
                : isDark
                  ? "bg-slate-900/70 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Click to select or deselect this brief"
          >
            <input
              type="checkbox"
              id={`select-brief-${brief.id}`}
              checked={isSelected}
              onChange={(e) => onToggleSelect(brief.id, e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-400 text-violet-600 focus:ring-violet-500 cursor-pointer shrink-0 accent-violet-600"
              aria-label={`Select brief ${brief.title}`}
            />
            <span className="text-[10px] font-mono uppercase tracking-wider">
              {isSelected ? "Selected" : "Select"}
            </span>
          </label>

          <div className="flex items-center space-x-2 truncate">
            <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${getStatusBadge()}`}>
              {brief.status}
            </span>
            <span className="text-xs font-mono text-slate-400 truncate hidden sm:inline">
              {brief.campaignId || `ID: ${brief.id.substring(0, 7)}`}
            </span>
          </div>
        </div>

        {/* Center/Right: Two-View Switcher Tab Pill */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto">
          <div className={`p-0.5 rounded-xl border flex items-center ${
            isDark ? "bg-[#121216] border-white/10" : "bg-slate-200/80 border-slate-300"
          }`}>
            <button
              id={`btn-view-owner-${brief.id}`}
              onClick={() => setViewMode("owner")}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === "owner"
                  ? isDark 
                    ? "bg-[#282832] text-amber-300 shadow-xs border border-amber-400/30" 
                    : "bg-white text-amber-700 shadow-xs border border-amber-300"
                  : isDark 
                    ? "text-slate-400 hover:text-slate-200" 
                    : "text-slate-600 hover:text-slate-900"
              }`}
              title="Switch to Owner Approval View (Plain language, 10-second approval)"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Owner View</span>
            </button>

            <button
              id={`btn-view-designer-${brief.id}`}
              onClick={() => setViewMode("designer")}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === "designer"
                  ? isDark 
                    ? "bg-[#282832] text-violet-300 shadow-xs border border-violet-400/30" 
                    : "bg-white text-violet-700 shadow-xs border border-violet-300"
                  : isDark 
                    ? "text-slate-400 hover:text-slate-200" 
                    : "text-slate-600 hover:text-slate-900"
              }`}
              title="Switch to Designer View (Execution specs, dimensions, exact copy, visual guidelines)"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Designer View</span>
            </button>
          </div>

          {/* Secondary card utilities */}
          <button
            id={`btn-edit-brief-${brief.id}`}
            onClick={() => onEdit(brief)}
            className="p-1.5 rounded-lg border border-white/5 hover:border-white/20 text-slate-400 hover:text-slate-200 text-xs font-mono cursor-pointer transition-colors"
            title="Edit Brief Raw Fields"
            aria-label="Edit Brief"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-delete-brief-${brief.id}`}
            onClick={() => onDelete(brief.id)}
            className="p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-mono cursor-pointer transition-colors"
            title="Delete Brief"
            aria-label="Delete Brief"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body: Switchable between VIEW 1 (Owner) and VIEW 2 (Designer) */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
        {/* ====================================================================
            VIEW 1: OWNER VIEW (Default view when brief is opened for approval)
            Purpose: let a business owner approve or reject in under 10 seconds.
            Show only:
            - What this asset is for (one plain sentence, no jargon)
            - The core message, in plain language — no persona names, no campaign-speak framing
            - Where it will be used (format + placement, plain terms)
            - A visible warning banner if any field in the brief is still marked as a placeholder or unconfirmed data
            - Two actions only: "Approve" and "Request Changes"
            Hide entirely: target persona writeups, positioning language, design direction notes, technical specs, proof points.
           ==================================================================== */}
        {viewMode === "owner" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500/90 font-bold flex items-center">
                  <UserCheck className="w-3 h-3 mr-1" /> Executive Owner Approval Sheet
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Target: {brief.approver || activeBrand?.name || "Business Owner"}
                </span>
              </div>
              <h3 className={`text-lg font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                {brief.title}
              </h3>
            </div>

            {/* 1. What this asset is for (one plain sentence, no jargon) */}
            <div className={`p-4 rounded-xl border ${
              isDark ? "bg-[#15151A] border-white/5" : "bg-slate-50 border-slate-200"
            }`}>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                What this asset is for
              </span>
              <p className={`text-sm font-medium leading-relaxed ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                {getPlainAssetPurpose()}
              </p>
            </div>

            {/* 2. The core message, in plain language — no persona names, no campaign-speak framing */}
            <div className={`p-4 rounded-xl border ${
              isDark ? "bg-[#15151A] border-white/5" : "bg-slate-50 border-slate-200"
            }`}>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                The core message (in plain language)
              </span>
              <blockquote className={`text-sm font-semibold italic border-l-2 pl-3 py-0.5 ${
                isDark ? "text-amber-200/90 border-amber-400/60" : "text-amber-900 border-amber-500"
              }`}>
                "{getPlainCoreMessage()}"
              </blockquote>
            </div>

            {/* 3. Where it will be used (format + placement, plain terms) */}
            <div className={`p-4 rounded-xl border ${
              isDark ? "bg-[#15151A] border-white/5" : "bg-slate-50 border-slate-200"
            }`}>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                Where it will be used (Format + Placement)
              </span>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  {getPlainPlacementFormat()}
                </span>
                {brief.sequencePosition && (
                  <span className="text-xs font-mono text-slate-400">
                    • {brief.sequencePosition}
                  </span>
                )}
              </div>
            </div>

            {/* 4. Visible Warning Banner if any field is unconfirmed/placeholder */}
            {hasUnconfirmedData && (
              <div 
                id={`unconfirmed-warning-owner-${brief.id}`}
                className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 animate-in slide-in-from-top-1"
              >
                <div className="flex items-start space-x-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold font-mono tracking-wide uppercase text-amber-300">
                        ⚠️ Action Required: Unconfirmed Data / Placeholder Detected
                      </h4>
                      <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-200 font-bold">
                        {unconfirmedFlags.length} Flagged Item{unconfirmedFlags.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-amber-200/90 font-sans">
                      This brief contains unconfirmed client data or placeholder claims that require verification before public release.
                    </p>
                    <ul className="space-y-1 pt-1 border-t border-amber-500/20 text-[11px] font-mono text-amber-300/90">
                      {unconfirmedFlags.map((flag, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <div>
                            <strong>{flag.field}:</strong> <em>"{flag.excerpt}"</em> ({flag.reason})
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Two Actions Only: "Approve" and "Request Changes" */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center space-x-3">
                <button
                  id={`btn-owner-approve-${brief.id}`}
                  onClick={handleApproveClick}
                  disabled={brief.status === "Approved"}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    brief.status === "Approved"
                      ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 cursor-default"
                      : hasUnconfirmedData
                        ? "bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:scale-[1.01]"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{brief.status === "Approved" ? "✓ Approved for Execution" : "Approve Brief"}</span>
                </button>

                <button
                  id={`btn-owner-request-changes-${brief.id}`}
                  onClick={() => setShowChangeModal(true)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center space-x-2 transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Request Changes</span>
                </button>
              </div>
              <p className="text-[10px] font-mono text-center text-slate-500 mt-2">
                Executive View: Target approval time &lt; 10 seconds. Click "Designer View" for technical layout & copy specs.
              </p>
            </div>
          </div>
        )}

        {/* ====================================================================
            VIEW 2: DESIGNER VIEW (Toggle or separate tab, same brief)
            Purpose: execution instructions only.
            Show only:
            - Format & dimensions
            - Headline/copy to use, exactly as approved
            - Layout direction (grid, structure, section breakdown)
            - Visual style reference (pull from that brand's Style & Guides page)
            - CTA / contact info
            Hide entirely: persona narrative, strategic rationale, marketing framing language.
           ==================================================================== */}
        {viewMode === "designer" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Header info & Copy Action */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold flex items-center">
                  <Palette className="w-3 h-3 mr-1" /> Designer Execution Specifications
                </span>
                <h3 className={`text-base font-bold tracking-tight mt-0.5 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  {brief.title}
                </h3>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={copyHeadline}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 flex items-center space-x-1 cursor-pointer transition-colors"
                  title="Copy approved copy to clipboard"
                >
                  {copiedHeadline ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHeadline ? "Copied" : "Copy Copy"}</span>
                </button>

                <button
                  onClick={() => onSlideDeckPreview(brief.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono border border-violet-500/40 bg-violet-600 hover:bg-violet-500 text-white flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                  title="Open Interactive Visual Slide Carousel Preview"
                >
                  <Presentation className="w-3.5 h-3.5" />
                  <span>Visual Deck</span>
                </button>
              </div>
            </div>

            {/* Unconfirmed data indicator banner in designer view */}
            {hasUnconfirmedData && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Designer Alert:</strong> {unconfirmedFlags.length} field(s) contain placeholder data. Do not export for final print/publish without confirmation.
                </span>
              </div>
            )}

            {/* 1. Format & Dimensions */}
            <div className={`p-4 rounded-xl border ${
              isDark ? "bg-[#15151A] border-white/5" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center">
                  <Layers className="w-3 h-3 mr-1 text-violet-400" /> Format & Technical Dimensions
                </span>
                {unconfirmedFlags.some(f => f.fieldKey === "formatSpec") && (
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    ⚠️ Unconfirmed Spec
                  </span>
                )}
              </div>
              <p className={`text-xs font-mono font-semibold ${isDark ? "text-violet-300" : "text-violet-900"}`}>
                {brief.formatSpec || "1080 x 1350 px, portrait (4:5) | Carousel / Multi-slide Document | PDF / PNG"}
              </p>
              {brief.deliverables && (
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  Deliverables Scope: {brief.deliverables}
                </p>
              )}
            </div>

            {/* 2. Headline/Copy to use, exactly as approved */}
            <div className={`p-4 rounded-xl border ${
              isDark ? "bg-[#15151A] border-white/5" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center">
                  <FileCode className="w-3 h-3 mr-1 text-violet-400" /> Approved Headline & Primary Copy
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Exact Copy
                </span>
              </div>
              <div className="space-y-2">
                <div className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  {brief.title}
                </div>
                <div className={`text-xs leading-relaxed p-3 rounded-lg border font-sans ${
                  isDark ? "bg-[#121216] border-white/5 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                }`}>
                  "{brief.keyMessage}"
                </div>
              </div>
            </div>

            {/* 3. Layout Direction (grid, structure, section breakdown) */}
            <div className={`p-4 rounded-xl border ${
              isDark ? "bg-[#15151A] border-white/5" : "bg-slate-50 border-slate-200"
            }`}>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-2">
                Layout Direction & Section Breakdown
              </span>
              {outlineBeats.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {outlineBeats.map((beat, idx) => (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-lg border flex items-start space-x-2 text-xs font-mono ${
                        isDark ? "bg-[#121216] border-white/5 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{beat}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-slate-400 italic">
                  Standard 3-stage layout: 1. Cover Hook & Title → 2. Core Value Breakdown → 3. Call-to-Action Slide.
                </p>
              )}
            </div>

            {/* 4. Visual Style Reference (pull from that brand's Style & Guides page) */}
            <div className={`p-4 rounded-xl border ${
              isDark ? "bg-[#15151A] border-white/5" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center">
                  <Palette className="w-3 h-3 mr-1 text-violet-400" /> Brand Visual Style Reference ({activeBrand?.name || "Brand Registry"})
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  From Style & Guides
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                {/* Brand Color & Palette */}
                <div className={`p-2.5 rounded-lg border flex items-center space-x-2.5 ${
                  isDark ? "bg-[#121216] border-white/5" : "bg-white border-slate-200"
                }`}>
                  <div 
                    className="w-7 h-7 rounded-lg shadow-sm shrink-0 border border-white/20" 
                    style={{ backgroundColor: getBrandHex() }}
                  />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Primary Palette</div>
                    <div className="font-bold text-slate-200">{activeBrand?.primaryColor || activeColor || "violet"} ({getBrandHex()})</div>
                  </div>
                </div>

                {/* Voice & Tone Direction */}
                <div className={`p-2.5 rounded-lg border ${
                  isDark ? "bg-[#121216] border-white/5" : "bg-white border-slate-200"
                }`}>
                  <div className="text-[10px] text-slate-400 uppercase">Brand Tone</div>
                  <div className="font-medium text-slate-200 truncate">{activeBrand?.voiceTone || "Direct, Confident, Modern"}</div>
                </div>
              </div>

              {/* Specific brief visual direction note */}
              {brief.toneVisualRef && (
                <div className="mt-2 text-[11px] font-mono text-slate-300 bg-violet-500/5 p-2 rounded border border-violet-500/10">
                  <strong>Visual Notes:</strong> {brief.toneVisualRef}
                </div>
              )}
            </div>

            {/* 5. CTA / Contact Info */}
            <div className={`p-4 rounded-xl border ${
              isDark ? "bg-[#15151A] border-white/5" : "bg-slate-50 border-slate-200"
            }`}>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                Call to Action (CTA) & Contact Destination
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs font-bold font-mono text-emerald-400">
                  {brief.cta || "Comment below or visit link in bio"}
                </p>
                {activeBrand?.domain && (
                  <span className="text-[11px] font-mono text-slate-400">
                    Domain: {activeBrand.domain}
                  </span>
                )}
              </div>
            </div>

            {/* Handover / Export Buttons */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onDownloadPDF(brief)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    isDark 
                      ? "bg-[#15151A] border-white/10 hover:border-white/30 text-slate-200" 
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs"
                  }`}
                  title="Download PDF Spec Sheet for Design Software (Figma, Photoshop, Illustrator)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Spec PDF</span>
                </button>

                {brief.status === "Approved" && (
                  <button
                    onClick={() => onSyncToPipeline(brief)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-all shadow-sm font-bold"
                    title="Send to Campaign Queue & Calendar"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to Queue</span>
                  </button>
                )}
              </div>

              {brief.status === "Approved" ? (
                <button
                  onClick={() => onEmailModal(brief)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition-all"
                  title="Email approved spec to design team"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email to Designer</span>
                </button>
              ) : (
                <button
                  onClick={() => onEmailModal(brief)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer transition-all"
                  title="Request approval review via email"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Request Sign-off</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Request Changes Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl ${
            isDark ? "bg-[#1C1C22] border-white/10 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-rose-400" />
                <h4 className="text-sm font-mono font-bold uppercase tracking-wider">
                  Request Brief Changes
                </h4>
              </div>
              <button
                onClick={() => setShowChangeModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Specify what needs revision for <strong>"{brief.title}"</strong>. The brief status will revert to Draft and notifications will be dispatched to the creative team.
            </p>

            <form onSubmit={handleRequestChangesSubmit} className="space-y-4">
              <textarea
                required
                rows={4}
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="e.g., Please change the core message to focus on speed instead of price, and verify real team size numbers..."
                className={`w-full text-xs p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                  isDark ? "bg-[#121216] border-white/10 text-slate-100" : "bg-slate-50 border-slate-300 text-slate-800"
                }`}
              />

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowChangeModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-mono text-slate-400 hover:bg-white/5 cursor-pointer uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer uppercase shadow-sm"
                >
                  Submit Change Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blocking Approval Warning Modal when unconfirmed claims exist */}
      {showApprovalWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`w-full max-w-lg border rounded-2xl p-6 shadow-2xl ${
            isDark ? "bg-[#1C1C22] border-amber-500/40 text-slate-100" : "bg-white border-amber-400 text-slate-800"
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-amber-300">
                  Unconfirmed Data Warning
                </h4>
                <p className="text-xs text-slate-400">
                  {unconfirmedFlags.length} placeholder or unverified claim(s) detected
                </p>
              </div>
            </div>

            <div className="space-y-3 my-4">
              <p className="text-xs leading-relaxed text-slate-300">
                You are about to approve <strong>"{brief.title}"</strong>, but it contains unconfirmed client data or placeholder tags. Are you sure you want to approve this brief without verified data?
              </p>

              <div className={`p-3 rounded-xl border max-h-40 overflow-y-auto space-y-2 text-xs font-mono ${
                isDark ? "bg-[#121216] border-white/5" : "bg-slate-50 border-slate-200"
              }`}>
                {unconfirmedFlags.map((flag, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-amber-400 font-bold">{flag.field}:</span>{" "}
                    <span className="text-slate-300">"{flag.excerpt}"</span>
                    <div className="text-[10px] text-slate-500">Reason: {flag.reason}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowApprovalWarningModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-slate-700 hover:bg-slate-600 text-white cursor-pointer uppercase"
              >
                Review & Edit Claims First
              </button>
              <button
                type="button"
                onClick={handleConfirmApprovalWithWarning}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer uppercase shadow-md"
              >
                Confirm & Approve Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
