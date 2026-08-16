import React, { useState, useEffect } from "react";
import { 
  X, 
  Send, 
  Calendar as CalendarIcon, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Rocket, 
  Repeat, 
  Share2, 
  ShieldCheck, 
  ChevronRight, 
  Check, 
  SlidersHorizontal,
  Flame,
  ArrowRight
} from "lucide-react";
import { CreativeBrief, Brand, CampaignQueue } from "../lib/firebase";

interface PushBriefWorkflowModalProps {
  brief: CreativeBrief | null;
  activeBrand: Brand | null;
  theme: string;
  activeColor: string;
  currentMonthName?: string;
  currentYear?: number;
  onClose: () => void;
  onSuccess?: () => void;
  updateCreativeBrief: (id: string, brief: Partial<CreativeBrief>) => Promise<void>;
  addCampaign: (campaign: Omit<CampaignQueue, "id" | "brandId">) => Promise<void>;
  addCalendarEvent: (event: any) => Promise<void>;
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const PushBriefWorkflowModal: React.FC<PushBriefWorkflowModalProps> = ({
  brief,
  activeBrand,
  theme,
  activeColor,
  currentMonthName,
  currentYear,
  onClose,
  onSuccess,
  updateCreativeBrief,
  addCampaign,
  addCalendarEvent,
  addNotification
}) => {
  if (!brief) return null;
  const isDark = theme === "dark";

  const defaultMonthName = currentMonthName || MONTH_NAMES[new Date().getMonth()];
  const defaultYear = currentYear || new Date().getFullYear();

  // Selected Workflow Mode
  const [workflowType, setWorkflowType] = useState<"hybrid" | "weekly" | "campaign">(
    brief.workflowType || "hybrid"
  );

  // Target Timing States
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthName);
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedWeek, setSelectedWeek] = useState<number>(brief.weekNumber || 1);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string>(
    brief.dayOfWeek || "Monday"
  );

  // Calculate approximate date for Week + Day
  const monthIdx = MONTH_NAMES.findIndex(
    m => m.toLowerCase() === selectedMonth.toLowerCase()
  );
  const safeMonthIdx = monthIdx >= 0 ? monthIdx : 6; // Default to July

  const calculateTargetDate = (year: number, mIdx: number, week: number, dayName: string) => {
    const dayOffset = DAYS_OF_WEEK.indexOf(dayName);
    const safeOffset = dayOffset >= 0 ? dayOffset : 0;
    // Calculate approximate day in month
    const approxDay = (week - 1) * 7 + safeOffset + 1;
    const maxDays = new Date(year, mIdx + 1, 0).getDate();
    const day = Math.min(Math.max(approxDay, 1), maxDays);
    const mStr = String(mIdx + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    return `${year}-${mStr}-${dStr}`;
  };

  const [targetDate, setTargetDate] = useState<string>(() => {
    if (brief.date && /^\d{4}-\d{2}-\d{2}$/.test(brief.date)) {
      return brief.date;
    }
    return calculateTargetDate(selectedYear, safeMonthIdx, selectedWeek, selectedDayOfWeek);
  });

  // Whenever week/day/month changes, update target date
  useEffect(() => {
    const newDate = calculateTargetDate(selectedYear, safeMonthIdx, selectedWeek, selectedDayOfWeek);
    setTargetDate(newDate);
  }, [selectedYear, safeMonthIdx, selectedWeek, selectedDayOfWeek]);

  // Campaign specific states
  const [campaignId, setCampaignId] = useState<string>(
    brief.campaignId || `CAMP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  );
  const [campaignName, setCampaignName] = useState<string>(
    brief.campaignName || (activeBrand?.name ? `${activeBrand.name} Growth Push` : "Quarterly Push")
  );
  const [sequencePosition, setSequencePosition] = useState<string>(
    brief.sequencePosition || "Drop 1 of 4 (Awareness Hook)"
  );
  const [channel, setChannel] = useState<CampaignQueue["channel"]>(
    (brief.platform as any) || "LinkedIn"
  );
  const [contentPillar, setContentPillar] = useState<string>(
    brief.contentPillar || "Marketing & Strategy"
  );
  const [postType, setPostType] = useState<string>(
    brief.postType || "Carousel / Multi-Slide"
  );
  const [mainFocus, setMainFocus] = useState<string>(
    brief.mainFocus || "Reach & Thought Leadership"
  );
  const [progressTracking, setProgressTracking] = useState<string>(
    brief.progressTracking || "Create"
  );
  const [status, setStatus] = useState<"Proposed" | "Approved">(
    brief.status === "Approved" ? "Approved" : "Proposed"
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brief) return;

    try {
      setIsSubmitting(true);

      // 1. Update Creative Brief with Weekly Content Planner & Workflow attributes
      const updatedBriefData: Partial<CreativeBrief> = {
        workflowType,
        weekNumber: selectedWeek,
        dayOfWeek: selectedDayOfWeek,
        date: targetDate,
        campaignId: campaignId || "",
        campaignName: workflowType !== "weekly" ? (campaignName || "") : "",
        sequencePosition: workflowType !== "weekly" ? (sequencePosition || "") : "",
        platform: channel || "LinkedIn",
        contentPillar: contentPillar || "Marketing & Strategy",
        postType: postType || "Carousel / Multi-Slide",
        mainFocus: mainFocus || "Reach & Thought Leadership",
        progressTracking: progressTracking || "Create",
        status,
        topicIdea: brief.topicIdea || brief.title || "",
        copywritingCaption: brief.copywritingCaption || brief.keyMessage || ""
      };

      await updateCreativeBrief(brief.id, updatedBriefData);

      // 2. If Workflow is "hybrid" or "campaign", also push to the posting queue.
      // The brief's own weekNumber/dayOfWeek (set above) is what places it on the
      // Weekly Content Planner — no separate calendar milestone record needed.
      if (workflowType === "hybrid" || workflowType === "campaign") {
        const scheduledTime = `${targetDate}T10:00`;
        const content = `[${workflowType.toUpperCase()} WORKFLOW • ${selectedDayOfWeek} W${selectedWeek}]\n\nTitle: ${brief.title}\n\nObjective:\n${brief.objective}\n\nCore Message:\n${brief.keyMessage}\n\nTarget Audience:\n${brief.targetAudience}\n\nDeliverables:\n${brief.deliverables || "N/A"}`;

        await addCampaign({
          title: brief.title,
          channel: channel || "LinkedIn",
          status: status === "Approved" ? "scheduled" : "active",
          scheduledTime,
          content,
          metrics: {
            estimatedReach: 24000,
            engagementRate: 4.8
          }
        });
      }

      if (addNotification) {
        addNotification(
          "Brief Synced to Weekly Planner",
          `"${brief.title}" successfully slotted into Week ${selectedWeek} (${selectedDayOfWeek}, ${targetDate}) under the ${
            workflowType === "hybrid" 
              ? "Combined Unified Workflow" 
              : workflowType === "campaign" 
              ? "Campaign Workflow" 
              : "Weekly Cadence Workflow"
          }.`,
          "success"
        );
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to push brief to workflow queue:", err);
      if (addNotification) {
        addNotification(
          "Push Failed",
          err.message || "Could not push brief to weekly planner.",
          "warning"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="push-brief-workflow-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div 
        id="push-brief-workflow-dialog"
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col ${
          isDark ? "bg-[#15161A] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          isDark ? "border-slate-800 bg-[#101115]" : "border-slate-100 bg-slate-50"
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold tracking-tight">
                  Push Creative Brief to Calendar & Queue
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold">
                  Workflow Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                "{brief.title}" • Brand: {activeBrand?.name || "Global"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark ? "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* STEP 1: Select Workflow Engine */}
          <div className="space-y-2.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
              <span>1. Choose Workflow Integration Model</span>
              <span className="text-[10px] text-violet-400 font-normal">How should this brief operate?</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option A: Combined Unified Workflow */}
              <div 
                onClick={() => setWorkflowType("hybrid")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                  workflowType === "hybrid"
                    ? "bg-violet-600/15 border-violet-500 shadow-md ring-1 ring-violet-500/50 text-slate-100"
                    : isDark 
                    ? "bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200" 
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  {workflowType === "hybrid" && (
                    <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-500/20 px-1.5 py-0.5 rounded">
                      ✓ Selected
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs">Unified Workflow</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                  <strong>Recommended:</strong> Slots into the Weekly Planner AND auto-queues in Campaign Pipeline.
                </div>
              </div>

              {/* Option B: Weekly Cadence Workflow */}
              <div 
                onClick={() => setWorkflowType("weekly")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                  workflowType === "weekly"
                    ? "bg-blue-600/15 border-blue-500 shadow-md ring-1 ring-blue-500/50 text-slate-100"
                    : isDark 
                    ? "bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200" 
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                    <Repeat className="w-4 h-4" />
                  </span>
                  {workflowType === "weekly" && (
                    <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">
                      ✓ Selected
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs">Weekly Cadence</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Standard recurring organic social post (Pillar, Hook, Carousel slides, Caption).
                </div>
              </div>

              {/* Option C: Campaign Launch Workflow */}
              <div 
                onClick={() => setWorkflowType("campaign")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                  workflowType === "campaign"
                    ? "bg-amber-600/15 border-amber-500 shadow-md ring-1 ring-amber-500/50 text-slate-100"
                    : isDark 
                    ? "bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200" 
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Flame className="w-4 h-4" />
                  </span>
                  {workflowType === "campaign" && (
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                      ✓ Selected
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs">Campaign Burst</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Strategic multi-drop campaign release with sequence positions & reach targets.
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Date, Month & Week Slotting */}
          <div className={`p-4 rounded-xl border space-y-4 ${
            isDark ? "bg-[#18191E]/70 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center space-x-1.5">
                <CalendarIcon className="w-4 h-4 text-violet-400" />
                <span>2. Target Calendar Schedule</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Target: {targetDate}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              {/* Month Selector */}
              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`w-full p-2 rounded-lg border text-xs font-mono ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Year Selector */}
              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className={`w-full p-2 rounded-lg border text-xs font-mono ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  {[2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Week Selector */}
              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">Week of Month</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className={`w-full p-2 rounded-lg border text-xs font-mono ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <option value={1}>Week 1 (Days 1–7)</option>
                  <option value={2}>Week 2 (Days 8–14)</option>
                  <option value={3}>Week 3 (Days 15–21)</option>
                  <option value={4}>Week 4 (Days 22–28)</option>
                </select>
              </div>

              {/* Day of Week Selector */}
              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">Day of Week</label>
                <select
                  value={selectedDayOfWeek}
                  onChange={(e) => setSelectedDayOfWeek(e.target.value)}
                  className={`w-full p-2 rounded-lg border text-xs font-mono ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* STEP 3: Channel, Format & Pillar Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                Distribution Channel / Platform
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                <option value="LinkedIn">LinkedIn (Carousel / Thought Leadership)</option>
                <option value="Instagram">Instagram (Reel / Carousel / Story)</option>
                <option value="TikTok">TikTok (Short Form Video)</option>
                <option value="YouTube">YouTube (Shorts / Longform Video)</option>
                <option value="Twitter/X">Twitter / X (Thread / Single Post)</option>
                <option value="Newsletter">Newsletter (Substack / Email)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                Content Pillar
              </label>
              <input
                type="text"
                value={contentPillar}
                onChange={(e) => setContentPillar(e.target.value)}
                placeholder="e.g. Marketing Strategy, Client Proof, Culture"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                Deliverable Format / Spec
              </label>
              <input
                type="text"
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                placeholder="e.g. 1080x1350 Carousel (7 slides), Reel (9:16)"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
                Main Focus / KPI
              </label>
              <input
                type="text"
                value={mainFocus}
                onChange={(e) => setMainFocus(e.target.value)}
                placeholder="e.g. Reach, Engagement, Book Demo, Link Clicks"
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                }`}
              />
            </div>
          </div>

          {/* STEP 4: Campaign Specific fields (if hybrid or campaign) */}
          {(workflowType === "hybrid" || workflowType === "campaign") && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? "bg-amber-950/10 border-amber-500/20" : "bg-amber-50/50 border-amber-200"
            }`}>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400">
                <Flame className="w-4 h-4" />
                <span>Campaign Pipeline Metadata</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">Campaign Name / Identifier</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Summer Growth Push"
                    className={`w-full p-2 rounded-lg border text-xs ${
                      isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">Sequence Position / Drop Tag</label>
                  <input
                    type="text"
                    value={sequencePosition}
                    onChange={(e) => setSequencePosition(e.target.value)}
                    placeholder="e.g. Drop 1 of 4 (Awareness Hook)"
                    className={`w-full p-2 rounded-lg border text-xs ${
                      isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Initial Approval Status */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-100/70 border-slate-200"
          }`}>
            <div>
              <span className="text-xs font-bold text-slate-200 block">Initial Calendar Approval State</span>
              <span className="text-[11px] text-slate-400">
                "Proposed" allows client review in the interactive portal before final posting.
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setStatus("Proposed")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                  status === "Proposed"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Proposed
              </button>
              <button
                type="button"
                onClick={() => setStatus("Approved")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                  status === "Approved"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Approved
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                isDark ? "border-slate-800 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold font-mono bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Slotting Brief..." : "Push to Weekly Content Planner"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
