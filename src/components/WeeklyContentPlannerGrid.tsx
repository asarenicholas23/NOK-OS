import React, { useState, useMemo } from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Edit3, 
  Plus, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  MessageSquare, 
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Share2,
  FileSpreadsheet,
  Download,
  Flame,
  Info,
  Rocket,
  Repeat,
  SlidersHorizontal,
  Send,
  Filter,
  CalendarDays,
  Target,
  Hash
} from "lucide-react";
import { CreativeBrief, Brand } from "../lib/firebase";
import { PushBriefWorkflowModal } from "./PushBriefWorkflowModal";

interface WeeklyContentPlannerGridProps {
  briefs: CreativeBrief[];
  activeBrand: Brand | null;
  theme: string;
  activeColor: string;
  monthName: string;
  monthIndex?: number;
  year: number;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onSelectMonth?: (mIndex: number) => void;
  onSelectYear?: (y: number) => void;
  onJumpToday?: () => void;
  onApproveDay: (brief: CreativeBrief) => void;
  onRequestChanges: (brief: CreativeBrief) => void;
  onApproveAllWeek: (weekNumber: number, briefIds: string[]) => void;
  onOpenBriefDetail: (brief: CreativeBrief) => void;
  onPushBriefToWorkflow?: (brief: CreativeBrief) => void;
  onAddNewBriefForDay?: (weekNumber: number, dayOfWeek: string, dateStr: string) => void;
  onShareCalendar?: () => void;
  updateCreativeBrief?: (id: string, brief: Partial<CreativeBrief>) => Promise<void>;
  addCampaign?: (campaign: any) => Promise<void>;
  addCalendarEvent?: (event: any) => Promise<void>;
  addNotification?: (title: string, message: string, type?: "info" | "success" | "warning") => void;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const MONTHS_LIST = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const WeeklyContentPlannerGrid: React.FC<WeeklyContentPlannerGridProps> = ({
  briefs,
  activeBrand,
  theme,
  activeColor,
  monthName,
  monthIndex,
  year,
  onPrevMonth,
  onNextMonth,
  onSelectMonth,
  onSelectYear,
  onJumpToday,
  onApproveDay,
  onRequestChanges,
  onApproveAllWeek,
  onOpenBriefDetail,
  onPushBriefToWorkflow,
  onAddNewBriefForDay,
  onShareCalendar,
  updateCreativeBrief,
  addCampaign,
  addCalendarEvent,
  addNotification
}) => {
  const isDark = theme === "dark";
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [copiedCaptionId, setCopiedCaptionId] = useState<string | null>(null);

  // Workflow Filter Mode: "all" (Combined Unified Workflow), "weekly" (Weekly Cadence Only), "campaign" (Campaigns Only)
  const [workflowFilter, setWorkflowFilter] = useState<"all" | "weekly" | "campaign">("all");

  // Selected Brief for Push / Slotting Modal
  const [briefToPush, setBriefToPush] = useState<CreativeBrief | null>(null);
  const [showPushModal, setShowPushModal] = useState(false);

  // Quick slotter states
  const [selectedWeekForSlot, setSelectedWeekForSlot] = useState<number>(1);
  const [selectedDayForSlot, setSelectedDayForSlot] = useState<string>("Monday");

  // Group briefs by weekNumber (Weeks 1 to 4)
  const weekNumbers = [1, 2, 3, 4];

  const safeMonthIndex = typeof monthIndex === "number" 
    ? monthIndex 
    : MONTHS_LIST.findIndex(m => m.toLowerCase() === monthName?.toLowerCase()) >= 0 
      ? MONTHS_LIST.findIndex(m => m.toLowerCase() === monthName?.toLowerCase()) 
      : new Date().getMonth();

  // Helper to compute exact calendar date string for a given week & day
  const getComputedDateForWeekDay = (weekNum: number, dayName: string) => {
    const dayIdx = DAYS_OF_WEEK.indexOf(dayName);
    const safeOffset = dayIdx >= 0 ? dayIdx : 0;
    const dayNum = (weekNum - 1) * 7 + safeOffset + 1;
    const maxDays = new Date(year, safeMonthIndex + 1, 0).getDate();
    const safeDay = Math.min(Math.max(dayNum, 1), maxDays);
    const mStr = String(safeMonthIndex + 1).padStart(2, "0");
    const dStr = String(safeDay).padStart(2, "0");
    return `${year}-${mStr}-${dStr}`;
  };

  // Helper for platform badge styling
  const getPlatformBadge = (platformStr?: string) => {
    if (!platformStr) return null;
    const platforms = platformStr.split(",").map(p => p.trim());
    return (
      <div className="flex flex-wrap gap-1">
        {platforms.map((p, idx) => {
          let badgeClass = "bg-slate-800 text-slate-300 border-slate-700";
          if (/instagram/i.test(p)) badgeClass = "bg-pink-500/10 text-pink-400 border-pink-500/20";
          else if (/facebook/i.test(p)) badgeClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
          else if (/tiktok/i.test(p)) badgeClass = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
          else if (/linkedin/i.test(p)) badgeClass = "bg-sky-500/10 text-sky-400 border-sky-500/20";
          else if (/twitter|x/i.test(p)) badgeClass = "bg-slate-500/10 text-slate-300 border-slate-500/20";
          else if (/youtube/i.test(p)) badgeClass = "bg-red-500/10 text-red-400 border-red-500/20";

          return (
            <span 
              key={idx} 
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold ${badgeClass}`}
            >
              {p}
            </span>
          );
        })}
      </div>
    );
  };

  // Helper for workflow badge on table row
  const getWorkflowBadge = (brief: CreativeBrief) => {
    if (brief.workflowType === "campaign" || brief.campaignId) {
      return (
        <div className="flex items-center space-x-1">
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
            <Flame className="w-2.5 h-2.5 mr-0.5" />
            <span>Campaign</span>
          </span>
          {brief.sequencePosition && (
            <span className="text-[8px] font-mono text-slate-400 truncate max-w-[80px]">
              {brief.sequencePosition}
            </span>
          )}
        </div>
      );
    }

    if (brief.workflowType === "weekly") {
      return (
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center space-x-1">
          <Repeat className="w-2.5 h-2.5 mr-0.5" />
          <span>Weekly Cadence</span>
        </span>
      );
    }

    return (
      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 flex items-center space-x-1">
        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
        <span>Unified</span>
      </span>
    );
  };

  // Helper for status badge styling
  const getStatusPill = (status: CreativeBrief["status"]) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
            Approved
          </span>
        );
      case "Changes Requested":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3 mr-1 text-amber-400" />
            Changes Requested
          </span>
        );
      case "Proposed":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Clock className="w-3 h-3 mr-1 text-blue-400" />
            Proposed
          </span>
        );
    }
  };

  // Helper for content pillar badge
  const getPillarBadge = (pillar?: string) => {
    if (!pillar) return <span className="text-slate-500 text-[10px]">—</span>;
    return (
      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
        {pillar}
      </span>
    );
  };

  // Helper for post type badge
  const getTypeBadge = (postType?: string) => {
    if (!postType) return <span className="text-slate-500 text-[10px]">—</span>;
    return (
      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700/40 text-slate-300 border border-slate-700/60">
        {postType}
      </span>
    );
  };

  // Helper for progress tracking badge
  const getProgressBadge = (progress?: string) => {
    if (!progress) return <span className="text-slate-500 text-[10px]">—</span>;
    let color = "bg-slate-800 text-slate-300 border-slate-700";
    if (progress === "Create") color = "bg-amber-500/10 text-amber-300 border-amber-500/20";
    if (progress === "Edit") color = "bg-blue-500/10 text-blue-300 border-blue-500/20";
    if (progress === "Film") color = "bg-purple-500/10 text-purple-300 border-purple-500/20";
    if (progress === "Review") color = "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
    if (progress === "Schedule" || progress === "Done") color = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";

    return (
      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${color}`}>
        {progress}
      </span>
    );
  };

  const handleCopyCaption = (briefId: string, text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCaptionId(briefId);
    setTimeout(() => setCopiedCaptionId(null), 2000);
  };

  const toggleCaptionExpand = (briefId: string) => {
    setExpandedCaptions(prev => ({
      ...prev,
      [briefId]: !prev[briefId]
    }));
  };

  // Filter briefs according to the selected workflow filter
  const filteredBriefs = useMemo(() => {
    return briefs.filter(b => {
      if (workflowFilter === "weekly") {
        return b.workflowType === "weekly" || (!b.workflowType && !b.campaignId);
      }
      if (workflowFilter === "campaign") {
        return b.workflowType === "campaign" || !!b.campaignId;
      }
      return true; // "all" shows both unified, weekly and campaigns!
    });
  }, [briefs, workflowFilter]);

  const handleOpenPushModalForNew = (weekNum: number, dayName: string) => {
    // If we have an unassigned brief, pick it; otherwise create a lightweight template brief
    const unassigned = briefs.find(b => !b.weekNumber && b.status !== "Approved");
    if (unassigned) {
      setBriefToPush({
        ...unassigned,
        weekNumber: weekNum,
        dayOfWeek: dayName
      });
    } else {
      setBriefToPush({
        id: `brief-${Date.now()}`,
        brandId: activeBrand?.id || "acme-corp",
        title: `${activeBrand?.name || "Brand"} • ${dayName} Spotlight`,
        objective: "Boost brand awareness and engagement across target channels.",
        targetAudience: "Marketing leaders, founders, and industry professionals",
        keyMessage: "High-value practical insight demonstrating leadership.",
        deliverables: "1080x1350 Carousel (5 slides) + Engaging Caption",
        status: "Proposed",
        weekNumber: weekNum,
        dayOfWeek: dayName,
        workflowType: "hybrid",
        platform: "LinkedIn",
        contentPillar: "Marketing & Strategy",
        postType: "Carousel",
        mainFocus: "Engagement & Reach",
        progressTracking: "Create"
      });
    }
    setShowPushModal(true);
  };

  return (
    <div id="weekly-content-planner-container" className="space-y-8">
      {/* Top Interactive Month Selector & Workflow Hub Ribbon */}
      <div className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
        isDark ? "bg-[#18191E] border-slate-800 shadow-xl" : "bg-white border-slate-200 shadow-sm"
      }`}>
        
        {/* Left: Month / Date Selector Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-900/80 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {onPrevMonth && (
              <button
                id="btn-planner-prev-month"
                onClick={onPrevMonth}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Month Dropdown */}
            <div className="relative">
              <select
                id="select-planner-month"
                value={monthIndex}
                onChange={(e) => onSelectMonth && onSelectMonth(Number(e.target.value))}
                className="appearance-none bg-transparent pl-3 pr-7 py-1.5 text-xs font-mono font-bold text-slate-100 cursor-pointer focus:outline-none"
              >
                {MONTHS_LIST.map((m, idx) => (
                  <option key={m} value={idx} className="bg-slate-900 text-slate-100">
                    {m.toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Year Dropdown */}
            <div className="relative border-l border-slate-800 pl-1">
              <select
                id="select-planner-year"
                value={year}
                onChange={(e) => onSelectYear && onSelectYear(Number(e.target.value))}
                className="appearance-none bg-transparent pl-2.5 pr-6 py-1.5 text-xs font-mono font-bold text-slate-100 cursor-pointer focus:outline-none"
              >
                {[2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-slate-100">
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-3 pointer-events-none" />
            </div>

            {onNextMonth && (
              <button
                id="btn-planner-next-month"
                onClick={onNextMonth}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Jump to Current / Today Button */}
          {onJumpToday && (
            <button
              id="btn-planner-today"
              onClick={onJumpToday}
              className={`px-3 py-2 text-xs font-mono font-semibold rounded-xl border transition-all cursor-pointer ${
                isDark ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Today
            </button>
          )}
        </div>

        {/* Center: Workflow Mode Switcher (Unified vs Weekly vs Campaign) */}
        <div className={`p-1 rounded-xl border flex items-center space-x-1 ${
          isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
        }`}>
          <button
            id="filter-workflow-all"
            onClick={() => setWorkflowFilter("all")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              workflowFilter === "all"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                : isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            title="Unified Weekly Workflow: Combines organic weekly cadence and strategic campaigns in one schedule"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unified Workflow (All)</span>
          </button>

          <button
            id="filter-workflow-weekly"
            onClick={() => setWorkflowFilter("weekly")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              workflowFilter === "weekly"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            title="Weekly Cadence: Standard recurring organic pillar posts"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Weekly Cadence</span>
          </button>

          <button
            id="filter-workflow-campaign"
            onClick={() => setWorkflowFilter("campaign")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              workflowFilter === "campaign"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            title="Campaign Pipeline: Multi-drop marketing releases & sequence drops"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Campaign Pipeline</span>
          </button>
        </div>

        {/* Right: Push Brief & Share Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            id="btn-push-brief-top"
            onClick={() => handleOpenPushModalForNew(1, "Monday")}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-mono font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
            title="Push creative brief into the weekly calendar schedule and campaign queue"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Push Creative Brief</span>
          </button>

          {onShareCalendar && (
            <button
              id="btn-share-calendar-top"
              onClick={onShareCalendar}
              className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-mono font-semibold rounded-xl border transition-all cursor-pointer ${
                isDark ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800" : "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200"
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Share for Approval</span>
            </button>
          )}
        </div>
      </div>

      {/* Render Each Week Grid */}
      {weekNumbers.map((weekNum) => {
        // Filter briefs for this week
        const weekBriefs = filteredBriefs.filter(
          b => (b.weekNumber === weekNum) || (!b.weekNumber && weekNum === 1)
        );
        const proposedInWeek = weekBriefs.filter(b => b.status === "Proposed");
        const approvedInWeek = weekBriefs.filter(b => b.status === "Approved");
        const changesInWeek = weekBriefs.filter(b => b.status === "Changes Requested");

        return (
          <div 
            key={weekNum}
            id={`week-grid-${weekNum}`}
            className={`rounded-2xl border overflow-hidden shadow-2xl transition-all ${
              isDark ? "bg-[#141518] border-slate-800" : "bg-white border-slate-200 shadow-md"
            }`}
          >
            {/* Week Header Bar */}
            <div className={`px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              isDark ? "bg-[#1A1B20] border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-violet-600 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md">
                  W{weekNum}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold tracking-tight">
                      WEEK {weekNum} • {monthName.toUpperCase()} {year} CONTENT ROADMAP
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-semibold">
                      {workflowFilter === "all" ? "Unified Schedule" : workflowFilter === "weekly" ? "Weekly Cadence" : "Campaign Pipeline"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 mt-0.5">
                    <span>
                      Proposed: <strong className="text-blue-400">{proposedInWeek.length}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Approved: <strong className="text-emerald-400">{approvedInWeek.length}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Changes: <strong className="text-amber-400">{changesInWeek.length}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Week-level Actions */}
              <div className="flex items-center space-x-2.5">
                <button
                  id={`btn-push-to-week-${weekNum}`}
                  onClick={() => handleOpenPushModalForNew(weekNum, "Monday")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                    isDark ? "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Push a creative brief directly into this week"
                >
                  <Send className="w-3 h-3 text-violet-400" />
                  <span>+ Push Brief to W{weekNum}</span>
                </button>

                <button
                  id={`btn-approve-all-week-${weekNum}`}
                  onClick={() => onApproveAllWeek(weekNum, proposedInWeek.map(b => b.id))}
                  disabled={proposedInWeek.length === 0}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-lg ${
                    proposedInWeek.length > 0
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                      : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                  }`}
                  title={
                    proposedInWeek.length > 0 
                      ? `Approve all ${proposedInWeek.length} proposed items in Week ${weekNum}.` 
                      : "No proposed items awaiting approval in this week."
                  }
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {proposedInWeek.length > 0
                      ? `Approve All Week ${weekNum} (${proposedInWeek.length} Proposed)`
                      : `All Proposed Approved ✓`}
                  </span>
                </button>
              </div>
            </div>

            {/* Spreadsheet Table Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1280px]">
                <thead>
                  <tr className={`border-b ${isDark ? "bg-[#111215] border-slate-800/80" : "bg-slate-100/70 border-slate-200"}`}>
                    <th className="p-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold w-40 sticky left-0 z-10 bg-[#111215] border-r border-slate-800">
                      SCHEDULE ITEMS
                    </th>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dateStr = getComputedDateForWeekDay(weekNum, dayName);
                      const dayNumber = dateStr.split("-")[2];
                      return (
                        <th 
                          key={dayName} 
                          className={`p-3 text-xs font-mono uppercase tracking-wider font-bold min-w-[170px] border-r ${
                            isDark ? "border-slate-800 text-slate-200" : "border-slate-200 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-violet-300">{dayName}</span>
                            <span className="text-[10px] text-slate-400 font-normal bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/40">
                              {monthName.substring(0, 3)} {dayNumber}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                    <th className="p-3.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold w-44">
                      OPERATIONAL NOTES
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs ${isDark ? "divide-slate-800/60" : "divide-slate-200"}`}>
                  
                  {/* ROW 1: APPROVAL CONTROLS (Top quick action row) */}
                  <tr className={isDark ? "bg-[#18191E]/70" : "bg-slate-50/50"}>
                    <td className="p-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold sticky left-0 z-10 bg-[#141518] border-r border-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>APPROVAL & STATUS</span>
                      </div>
                    </td>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dayBrief = weekBriefs.find(b => b.dayOfWeek?.toLowerCase() === dayName.toLowerCase());

                      if (!dayBrief) {
                        return (
                          <td key={dayName} className="p-3 text-center border-r border-slate-800/50">
                            <button
                              onClick={() => handleOpenPushModalForNew(weekNum, dayName)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 border border-dashed border-slate-700 hover:border-violet-500/40 transition-all cursor-pointer"
                              title={`Slot a creative brief for ${dayName} Week ${weekNum}`}
                            >
                              + Slot Brief
                            </button>
                          </td>
                        );
                      }

                      return (
                        <td key={dayName} className="p-2.5 border-r border-slate-800/50">
                          <div className="flex flex-col space-y-2">
                            {/* Workflow badge + Status badge */}
                            <div className="flex items-center justify-between gap-1">
                              {getWorkflowBadge(dayBrief)}
                              {getStatusPill(dayBrief.status)}
                            </div>

                            {/* Per-day Approval Actions */}
                            <div className="flex items-center space-x-1.5">
                              <button
                                id={`btn-approve-day-${dayBrief.id}`}
                                onClick={() => onApproveDay(dayBrief)}
                                className={`flex-1 flex items-center justify-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                  dayBrief.status === "Approved"
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30"
                                }`}
                                title="Approve this day's brief & push to Posting Queue"
                              >
                                <Check className="w-3 h-3" />
                                <span>{dayBrief.status === "Approved" ? "Approved" : "Approve"}</span>
                              </button>

                              <button
                                id={`btn-request-changes-${dayBrief.id}`}
                                onClick={() => onRequestChanges(dayBrief)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                                  dayBrief.status === "Changes Requested"
                                    ? "bg-amber-600 text-white font-bold"
                                    : "bg-amber-500/15 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30"
                                }`}
                                title="Request revisions and record feedback"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>

                              {/* Re-route / Configure Workflow Button */}
                              <button
                                onClick={() => {
                                  setBriefToPush(dayBrief);
                                  setShowPushModal(true);
                                }}
                                className="p-1 rounded-lg text-[10px] font-mono bg-slate-800 text-slate-400 hover:text-violet-300 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                                title="Re-configure workflow slotting or push to campaign queue"
                              >
                                <SlidersHorizontal className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Show revision notes preview if changes requested */}
                            {dayBrief.status === "Changes Requested" && dayBrief.revisionNotes && (
                              <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">
                                <span className="font-bold block text-[9px] uppercase font-mono">Revision Note:</span>
                                <p className="line-clamp-2 italic">{dayBrief.revisionNotes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-3 text-[10px] font-mono text-slate-400 align-top">
                      Approval pushes directly to Posting Queue.
                    </td>
                  </tr>

                  {/* ROW 2: PLATFORM */}
                  <tr>
                    <td className="p-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold sticky left-0 z-10 bg-[#141518] border-r border-slate-800">
                      Platform
                    </td>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dayBrief = weekBriefs.find(b => b.dayOfWeek?.toLowerCase() === dayName.toLowerCase());
                      return (
                        <td key={dayName} className="p-3 border-r border-slate-800/50 align-top">
                          {dayBrief ? getPlatformBadge(dayBrief.platform) : <span className="text-slate-500 text-[10px]">—</span>}
                        </td>
                      );
                    })}
                    <td className="p-3 text-[10px] text-slate-400">
                      Multi-channel sync (LinkedIn, IG, TikTok, YouTube, X)
                    </td>
                  </tr>

                  {/* ROW 3: MAIN FOCUS / GOALS */}
                  <tr className={isDark ? "bg-[#16171B]/40" : "bg-slate-50/30"}>
                    <td className="p-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold sticky left-0 z-10 bg-[#141518] border-r border-slate-800">
                      Main Focus/Goals
                    </td>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dayBrief = weekBriefs.find(b => b.dayOfWeek?.toLowerCase() === dayName.toLowerCase());
                      return (
                        <td key={dayName} className="p-3 border-r border-slate-800/50 align-top">
                          {dayBrief?.mainFocus ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {dayBrief.mainFocus}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-[10px] text-slate-400">
                      Funnel alignment: Reach, Engagement & Conversion
                    </td>
                  </tr>

                  {/* ROW 4: TOPIC / IDEA */}
                  <tr>
                    <td className="p-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold sticky left-0 z-10 bg-[#141518] border-r border-slate-800">
                      Topic/Idea
                    </td>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dayBrief = weekBriefs.find(b => b.dayOfWeek?.toLowerCase() === dayName.toLowerCase());
                      return (
                        <td key={dayName} className="p-3 border-r border-slate-800/50 align-top">
                          {dayBrief ? (
                            <p className="font-semibold text-xs text-slate-100 leading-snug line-clamp-3">
                              {dayBrief.topicIdea || dayBrief.title}
                            </p>
                          ) : (
                            <span className="text-slate-500 text-[10px]">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-[10px] text-slate-400">
                      Key creative hooks & narrative anchors
                    </td>
                  </tr>

                  {/* ROW 5: CONTENT PILLAR */}
                  <tr className={isDark ? "bg-[#16171B]/40" : "bg-slate-50/30"}>
                    <td className="p-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold sticky left-0 z-10 bg-[#141518] border-r border-slate-800">
                      Content Pillars
                    </td>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dayBrief = weekBriefs.find(b => b.dayOfWeek?.toLowerCase() === dayName.toLowerCase());
                      return (
                        <td key={dayName} className="p-3 border-r border-slate-800/50 align-top">
                          {dayBrief ? getPillarBadge(dayBrief.contentPillar) : <span className="text-slate-500 text-[10px]">—</span>}
                        </td>
                      );
                    })}
                    <td className="p-3 text-[10px] text-slate-400">
                      Pillars: Strategy, Proof, Culture, Product
                    </td>
                  </tr>

                  {/* ROW 6: TYPE */}
                  <tr>
                    <td className="p-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold sticky left-0 z-10 bg-[#141518] border-r border-slate-800">
                      Type
                    </td>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dayBrief = weekBriefs.find(b => b.dayOfWeek?.toLowerCase() === dayName.toLowerCase());
                      return (
                        <td key={dayName} className="p-3 border-r border-slate-800/50 align-top">
                          {dayBrief ? getTypeBadge(dayBrief.postType) : <span className="text-slate-500 text-[10px]">—</span>}
                        </td>
                      );
                    })}
                    <td className="p-3 text-[10px] text-slate-400">
                      Formats: Carousel, Reel, Artwork, Video
                    </td>
                  </tr>

                  {/* ROW 7: PROGRESS TRACKING */}
                  <tr className={isDark ? "bg-[#16171B]/40" : "bg-slate-50/30"}>
                    <td className="p-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold sticky left-0 z-10 bg-[#141518] border-r border-slate-800">
                      Progress Tracking
                    </td>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dayBrief = weekBriefs.find(b => b.dayOfWeek?.toLowerCase() === dayName.toLowerCase());
                      return (
                        <td key={dayName} className="p-3 border-r border-slate-800/50 align-top">
                          {dayBrief ? getProgressBadge(dayBrief.progressTracking) : <span className="text-slate-500 text-[10px]">—</span>}
                        </td>
                      );
                    })}
                    <td className="p-3 text-[10px] text-slate-400">
                      Stages: Create, Edit, Film, Schedule, Done
                    </td>
                  </tr>

                  {/* ROW 8: CONTENT BRIEF (Opens full Brief View) */}
                  <tr>
                    <td className="p-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold sticky left-0 z-10 bg-[#141518] border-r border-slate-800">
                      Content Brief
                    </td>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dayBrief = weekBriefs.find(b => b.dayOfWeek?.toLowerCase() === dayName.toLowerCase());
                      if (!dayBrief) {
                        return (
                          <td key={dayName} className="p-3 border-r border-slate-800/50">
                            <span className="text-slate-500 text-[10px]">—</span>
                          </td>
                        );
                      }

                      return (
                        <td key={dayName} className="p-3 border-r border-slate-800/50 align-top">
                          <button
                            id={`btn-open-brief-modal-${dayBrief.id}`}
                            onClick={() => onOpenBriefDetail(dayBrief)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-violet-600/15 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 transition-all cursor-pointer w-full justify-center"
                          >
                            <Layers className="w-3 h-3" />
                            <span>View Brief 📋</span>
                          </button>
                        </td>
                      );
                    })}
                    <td className="p-3 text-[10px] text-slate-400">
                      Detailed slide deck & copy specifications
                    </td>
                  </tr>

                  {/* ROW 9: VISUAL / VISUAL REFERENCE */}
                  <tr className={isDark ? "bg-[#16171B]/40" : "bg-slate-50/30"}>
                    <td className="p-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold sticky left-0 z-10 bg-[#141518] border-r border-slate-800">
                      Visual Reference
                    </td>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dayBrief = weekBriefs.find(b => b.dayOfWeek?.toLowerCase() === dayName.toLowerCase());
                      return (
                        <td key={dayName} className="p-3 border-r border-slate-800/50 align-top">
                          {dayBrief?.visualReference ? (
                            <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                              {dayBrief.visualReference}
                            </p>
                          ) : (
                            <span className="text-slate-500 text-[10px]">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-[10px] text-slate-400">
                      Art direction, palette, typography guidelines
                    </td>
                  </tr>

                  {/* ROW 10: VISUAL COPY DETAIL (Slide Arc breakdowns) */}
                  <tr>
                    <td className="p-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold sticky left-0 z-10 bg-[#141518] border-r border-slate-800">
                      Visual Copy Detail
                    </td>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dayBrief = weekBriefs.find(b => b.dayOfWeek?.toLowerCase() === dayName.toLowerCase());
                      return (
                        <td key={dayName} className="p-3 border-r border-slate-800/50 align-top">
                          {dayBrief?.visualCopyDetail ? (
                            <div className="text-[11px] text-slate-300 font-mono whitespace-pre-line line-clamp-4 leading-snug">
                              {dayBrief.visualCopyDetail}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-[10px] text-slate-400">
                      Slide-by-slide storyline flow
                    </td>
                  </tr>

                  {/* ROW 11: COPYWRITING / CAPTION */}
                  <tr className={isDark ? "bg-[#16171B]/40" : "bg-slate-50/30"}>
                    <td className="p-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold sticky left-0 z-10 bg-[#141518] border-r border-slate-800">
                      Copywriting
                    </td>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dayBrief = weekBriefs.find(b => b.dayOfWeek?.toLowerCase() === dayName.toLowerCase());
                      const isExpanded = dayBrief ? expandedCaptions[dayBrief.id] : false;

                      if (!dayBrief || !dayBrief.copywritingCaption) {
                        return (
                          <td key={dayName} className="p-3 border-r border-slate-800/50">
                            <span className="text-slate-500 text-[10px]">—</span>
                          </td>
                        );
                      }

                      return (
                        <td key={dayName} className="p-3 border-r border-slate-800/50 align-top">
                          <div className="space-y-1.5">
                            <p className={`text-[11px] text-slate-200 leading-relaxed ${isExpanded ? "" : "line-clamp-3"}`}>
                              {dayBrief.copywritingCaption}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <button
                                onClick={() => toggleCaptionExpand(dayBrief.id)}
                                className="text-[10px] font-mono text-violet-400 hover:text-violet-300 cursor-pointer flex items-center"
                              >
                                {isExpanded ? (
                                  <><span>Less</span> <ChevronUp className="w-3 h-3 ml-0.5" /></>
                                ) : (
                                  <><span>More</span> <ChevronDown className="w-3 h-3 ml-0.5" /></>
                                )}
                              </button>
                              <button
                                onClick={() => handleCopyCaption(dayBrief.id, dayBrief.copywritingCaption)}
                                className="text-[10px] font-mono text-slate-400 hover:text-slate-200 cursor-pointer flex items-center space-x-1"
                                title="Copy caption text"
                              >
                                {copiedCaptionId === dayBrief.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-3 text-[10px] text-slate-400">
                      High-converting caption copy
                    </td>
                  </tr>

                  {/* ROW 12: HASHTAGS */}
                  <tr>
                    <td className="p-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold sticky left-0 z-10 bg-[#141518] border-r border-slate-800">
                      Hashtags
                    </td>
                    {DAYS_OF_WEEK.map((dayName) => {
                      const dayBrief = weekBriefs.find(b => b.dayOfWeek?.toLowerCase() === dayName.toLowerCase());
                      return (
                        <td key={dayName} className="p-3 border-r border-slate-800/50 align-top">
                          {dayBrief?.hashtags ? (
                            <p className="text-[10px] font-mono text-slate-400 line-clamp-2">
                              {dayBrief.hashtags}
                            </p>
                          ) : (
                            <span className="text-slate-500 text-[10px]">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-[10px] text-slate-400">
                      SEO tag buckets
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Push Brief Workflow Modal */}
      {showPushModal && briefToPush && updateCreativeBrief && addCampaign && addCalendarEvent && (
        <PushBriefWorkflowModal
          brief={briefToPush}
          activeBrand={activeBrand}
          theme={theme}
          activeColor={activeColor}
          currentMonthName={monthName}
          currentYear={year}
          onClose={() => {
            setShowPushModal(false);
            setBriefToPush(null);
          }}
          updateCreativeBrief={updateCreativeBrief}
          addCampaign={addCampaign}
          addCalendarEvent={addCalendarEvent}
          addNotification={addNotification}
        />
      )}
    </div>
  );
};
