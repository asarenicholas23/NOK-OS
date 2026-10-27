import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit3,
  Check,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Share2,
  Flame,
  Repeat,
  CalendarDays
} from "lucide-react";
import { CreativeBrief, Brand, CampaignQueue } from "../lib/firebase";
import { PushBriefWorkflowModal } from "./PushBriefWorkflowModal";
import { ClaudeDraftBadge, ClaudeDraftFilter, isClaudeDraft } from "./ClaudeDraftBadge";
import { briefHook, briefPrimaryPlatform, briefFormatLabel, briefPillar, briefSummaryLine, approvalBlockers } from "../lib/briefs";
import { getMondayOfWeek, addDays, formatDateYMD, getISOWeek } from "../utils/weekSchedule";

interface WeeklyContentPlannerGridProps {
  briefs: CreativeBrief[];
  activeBrand: Brand | null;
  theme: string;
  activeColor: string;
  /** Any date inside the week to display; the grid snaps to that week's Monday. */
  weekAnchorDate: Date;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onJumpToday?: () => void;
  onApproveDay: (brief: CreativeBrief) => void;
  onRequestChanges: (brief: CreativeBrief) => void;
  onApproveAllWeek: (weekNumber: number, briefIds: string[]) => void;
  onOpenBriefDetail: (brief: CreativeBrief) => void;
  onShareCalendar?: () => void;
  updateCreativeBrief?: (id: string, brief: Partial<CreativeBrief>) => Promise<void>;
  addCampaign?: (campaign: any) => Promise<void>;
  addCalendarEvent?: (event: any) => Promise<void>;
  addNotification?: (title: string, message: string, type?: "info" | "success" | "warning") => void;
  queues?: CampaignQueue[];
  updateCampaign?: (id: string, campaign: Partial<CampaignQueue>) => Promise<void>;
  /** "client" = share-link review: hides internal tools like the Claude filter. */
  audience?: "staff" | "client";
}

const MONTHS_LIST = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const WEEKDAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type WorkflowFilter = "all" | "weekly" | "campaign";

const workflowOf = (b: CreativeBrief): "campaign" | "weekly" | "unified" => {
  if (b.workflowType === "campaign" || b.campaignId) return "campaign";
  if (b.workflowType === "weekly") return "weekly";
  return "unified";
};

export const WeeklyContentPlannerGrid: React.FC<WeeklyContentPlannerGridProps> = ({
  briefs,
  activeBrand,
  theme,
  activeColor,
  weekAnchorDate,
  onPrevWeek,
  onNextWeek,
  onJumpToday,
  onApproveDay,
  onRequestChanges,
  onApproveAllWeek,
  onOpenBriefDetail,
  onShareCalendar,
  updateCreativeBrief,
  addCampaign,
  addCalendarEvent,
  addNotification,
  queues,
  updateCampaign,
  audience = "staff"
}) => {
  const isDark = theme === "dark";

  const [workflowFilter, setWorkflowFilter] = useState<WorkflowFilter>("all");
  const [claudeOnly, setClaudeOnly] = useState(false);
  const [briefToPush, setBriefToPush] = useState<CreativeBrief | null>(null);
  const [showPushModal, setShowPushModal] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<{ dateStr: string; dayName: string } | null>(null);

  // The 7 real calendar dates (Mon..Sun) of the displayed week.
  const monday = useMemo(() => getMondayOfWeek(weekAnchorDate), [weekAnchorDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      return { date, iso: formatDateYMD(date), dayName: WEEKDAY_FULL[i], short: WEEKDAY_SHORT[i] };
    }),
    [monday]
  );
  const sunday = weekDays[6].date;
  const todayIso = formatDateYMD(new Date());
  const isoWeek = getISOWeek(monday);

  const rangeLabel = (() => {
    const startM = MONTHS_LIST[monday.getMonth()].slice(0, 3);
    const endM = MONTHS_LIST[sunday.getMonth()].slice(0, 3);
    const sameYear = monday.getFullYear() === sunday.getFullYear();
    const left = `${startM} ${monday.getDate()}`;
    const right = `${monday.getMonth() === sunday.getMonth() ? "" : endM + " "}${sunday.getDate()}`;
    return sameYear
      ? `${left} – ${right}, ${sunday.getFullYear()}`
      : `${left}, ${monday.getFullYear()} – ${endM} ${sunday.getDate()}, ${sunday.getFullYear()}`;
  })();

  const filteredBriefs = useMemo(() => {
    return briefs.filter(b => {
      if (claudeOnly && !isClaudeDraft(b)) return false;
      if (workflowFilter === "weekly") return workflowOf(b) === "weekly" || workflowOf(b) === "unified";
      if (workflowFilter === "campaign") return workflowOf(b) === "campaign";
      return true;
    });
  }, [briefs, workflowFilter, claudeOnly]);

  const briefsByDate = useMemo(() => {
    const map = new Map<string, CreativeBrief[]>();
    for (const b of filteredBriefs) {
      if (!b.date) continue;
      const list = map.get(b.date) || [];
      list.push(b);
      map.set(b.date, list);
    }
    return map;
  }, [filteredBriefs]);

  const weekBriefs = useMemo(
    () => weekDays.flatMap(d => briefsByDate.get(d.iso) || []),
    [weekDays, briefsByDate]
  );
  const proposedThisWeek = weekBriefs.filter(b => b.status === "Proposed");

  // Briefs that exist but aren't slotted onto a day yet — what "+ Slot brief" offers.
  const unscheduledBriefs = useMemo(() => briefs.filter(b => !b.date), [briefs]);

  // Posting-ops record auto-created when a brief is approved (title match, guarded
  // against docs with a missing title).
  const findQueueItemForBrief = (brief: CreativeBrief) =>
    queues?.find(q => (q.title || "").toLowerCase() === (brief.title || "").toLowerCase());

  const handlePickBriefForSlot = (brief: CreativeBrief) => {
    if (!pickerSlot) return;
    setBriefToPush({ ...brief, date: pickerSlot.dateStr, dayOfWeek: pickerSlot.dayName });
    setPickerSlot(null);
    setShowPushModal(true);
  };

  const canSlot = !!(updateCreativeBrief && addCampaign && addCalendarEvent);

  return (
    <div id="weekly-content-planner-container" className="space-y-5">
      {/* Week navigation + controls */}
      <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isDark ? "bg-[#18191E] border-slate-800 shadow-xl" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
            <button
              id="btn-planner-prev-week"
              onClick={onPrevWeek}
              disabled={!onPrevWeek}
              className="p-2 rounded-lg hover:bg-slate-700/40 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer disabled:opacity-40"
              title="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-center min-w-[190px]">
              <div className={`text-xs font-mono font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>{rangeLabel}</div>
              <div className="text-[10px] font-mono text-slate-400">Week {isoWeek}</div>
            </div>
            <button
              id="btn-planner-next-week"
              onClick={onNextWeek}
              disabled={!onNextWeek}
              className="p-2 rounded-lg hover:bg-slate-700/40 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer disabled:opacity-40"
              title="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onJumpToday && (
            <button
              id="btn-planner-today"
              onClick={onJumpToday}
              className={`px-3 py-2 text-xs font-mono font-semibold rounded-xl border transition-all cursor-pointer ${
                isDark ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
            >
              This week
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Workflow filter */}
          <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
            {([
              ["all", "All", Sparkles],
              ["weekly", "Weekly", Repeat],
              ["campaign", "Campaign", Flame]
            ] as [WorkflowFilter, string, typeof Sparkles][]).map(([key, label, Icon]) => (
              <button
                key={key}
                id={`filter-workflow-${key}`}
                onClick={() => setWorkflowFilter(key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  workflowFilter === key
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {audience === "staff" && <ClaudeDraftFilter
            id="filter-briefs-claude"
            active={claudeOnly}
            count={briefs.filter(isClaudeDraft).length}
            onToggle={() => setClaudeOnly(v => !v)}
          />}

          {proposedThisWeek.length > 0 && updateCreativeBrief && (
            <button
              id="btn-approve-all-week"
              onClick={() => onApproveAllWeek(isoWeek, proposedThisWeek.map(b => b.id))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all cursor-pointer"
              title="Approve every proposed brief in this week"
            >
              <Check className="w-3.5 h-3.5" />
              Approve week ({proposedThisWeek.length})
            </button>
          )}

          {onShareCalendar && (
            <button
              id="btn-planner-share"
              onClick={onShareCalendar}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                isDark ? "bg-violet-600/15 border-violet-500/40 text-violet-300 hover:bg-violet-500/25" : "bg-violet-50 border-violet-300 text-violet-800 hover:bg-violet-100"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              Share for Approval
            </button>
          )}
        </div>
      </div>

      {/* Week grid: 7 day columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {weekDays.map(({ date, iso, dayName, short }) => {
          const dayBriefs = briefsByDate.get(iso) || [];
          const isToday = iso === todayIso;
          const isFirstOfMonth = date.getDate() === 1;
          return (
            <div
              key={iso}
              id={`day-col-${iso}`}
              className={`rounded-xl border flex flex-col min-h-[220px] ${
                isToday
                  ? isDark ? "border-violet-500/60 bg-violet-500/[0.06]" : "border-violet-400 bg-violet-50/60"
                  : isDark ? "border-slate-800 bg-[#141519]" : "border-slate-200 bg-white"
              }`}
            >
              {/* Day header */}
              <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                <span className={`text-[10px] font-mono font-bold tracking-wider ${isToday ? "text-violet-400" : "text-slate-400"}`}>
                  {short}
                </span>
                <span className={`text-xs font-bold ${
                  isToday ? "text-violet-400" : isDark ? "text-slate-200" : "text-slate-700"
                }`}>
                  {isFirstOfMonth ? `${MONTHS_LIST[date.getMonth()].slice(0, 3)} 1` : date.getDate()}
                </span>
              </div>

              {/* Brief cards */}
              <div className="flex-1 p-2 space-y-2">
                {dayBriefs.length === 0 && (
                  <div className="h-full min-h-[120px] flex items-center justify-center">
                    <span className="text-[10px] text-slate-500 font-mono">No posts</span>
                  </div>
                )}
                {dayBriefs.map(brief => {
                  const wf = workflowOf(brief);
                  const queueItem = brief.status === "Approved" ? findQueueItemForBrief(brief) : undefined;
                  return (
                    <div
                      key={brief.id}
                      id={`brief-card-${brief.id}`}
                      className={`rounded-lg border p-2.5 transition-all ${
                        isDark ? "bg-[#1B1C22] border-slate-800 hover:border-violet-500/50" : "bg-slate-50 border-slate-200 hover:border-violet-400"
                      }`}
                    >
                      <button
                        onClick={() => onOpenBriefDetail(brief)}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <WorkflowDot kind={wf} />
                          <StatusPill status={brief.status} compact />
                          {audience === "staff" && isClaudeDraft(brief) && <ClaudeDraftBadge compact />}
                        </div>
                        <p className={`text-xs font-semibold leading-snug line-clamp-2 ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                          {briefHook(brief) || "Untitled brief"}
                        </p>
                        {(briefPrimaryPlatform(brief) || briefFormatLabel(brief)) && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {briefPrimaryPlatform(brief) && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                                {briefPrimaryPlatform(brief)}
                              </span>
                            )}
                            {briefFormatLabel(brief) && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-600/20 text-slate-300 border border-slate-600/40">
                                {briefFormatLabel(brief)}
                              </span>
                            )}
                          </div>
                        )}
                        {queueItem && (
                          <div className="flex items-center gap-1 mt-1.5 text-[9px] font-mono text-slate-400">
                            <CalendarDays className="w-2.5 h-2.5" />
                            Queue: {queueItem.status}
                          </div>
                        )}
                      </button>

                      {/* Quick actions */}
                      <div className="flex items-center gap-1 mt-2">
                        <button
                          id={`btn-approve-day-${brief.id}`}
                          onClick={() => onApproveDay(brief)}
                          disabled={brief.status !== "Approved" && approvalBlockers(brief).length > 0}
                          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] font-mono font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            brief.status === "Approved"
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30"
                          }`}
                          title={approvalBlockers(brief).length > 0 ? "Unconfirmed items block approval" : "Approve this brief"}
                        >
                          <Check className="w-2.5 h-2.5" />
                          {brief.status === "Approved" ? "Approved" : "Approve"}
                        </button>
                        <button
                          id={`btn-request-changes-${brief.id}`}
                          onClick={() => onRequestChanges(brief)}
                          className={`px-2 py-1 rounded text-[9px] font-mono transition-all cursor-pointer ${
                            brief.status === "Changes Requested"
                              ? "bg-amber-600 text-white font-bold"
                              : "bg-amber-500/15 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30"
                          }`}
                          title="Request changes"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Slot an existing brief onto this day */}
              {canSlot && (
                <div className={`px-2 py-2 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <button
                    onClick={() => setPickerSlot({ dateStr: iso, dayName })}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 border border-dashed border-slate-700 hover:border-violet-500/40 transition-all cursor-pointer"
                    title={`Slot a brief for ${dayName}`}
                  >
                    <Layers className="w-3 h-3" />
                    Slot brief
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Push Brief Workflow Modal */}
      {showPushModal && briefToPush && updateCreativeBrief && addCampaign && addCalendarEvent && (
        <PushBriefWorkflowModal
          brief={briefToPush}
          activeBrand={activeBrand}
          theme={theme}
          activeColor={activeColor}
          currentMonthName={MONTHS_LIST[monday.getMonth()]}
          currentYear={monday.getFullYear()}
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

      {/* Brief picker: choose which already-generated brief fills this day */}
      {pickerSlot && (
        <div
          id="brief-picker-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPickerSlot(null)}
        >
          <div
            id="brief-picker-dialog"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col ${
              isDark ? "bg-[#15161A] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${
              isDark ? "border-slate-800 bg-[#101115]" : "border-slate-100 bg-slate-50"
            }`}>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  Choose a brief for {pickerSlot.dayName}, {pickerSlot.dateStr}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pick from creative briefs already generated for {activeBrand?.name || "this brand"}.
                </p>
              </div>
              <button
                onClick={() => setPickerSlot(null)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark ? "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ChevronRight className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
              {unscheduledBriefs.length === 0 ? (
                <div className={`text-center py-10 rounded-xl border border-dashed ${
                  isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
                }`}>
                  <Layers className="w-6 h-6 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-mono">No unscheduled briefs available.</p>
                  <p className="text-[11px] mt-1 max-w-xs mx-auto text-slate-500">
                    Generate briefs from approved Brand Directions first, then come back to slot them in.
                  </p>
                </div>
              ) : (
                unscheduledBriefs.map((brief) => (
                  <button
                    key={brief.id}
                    onClick={() => handlePickBriefForSlot(brief)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isDark ? "bg-slate-900/50 border-slate-800 hover:border-violet-500/60 hover:bg-violet-500/5" : "bg-slate-50 border-slate-200 hover:border-violet-400 hover:bg-violet-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold truncate">{brief.title || "Untitled brief"}</span>
                      {audience === "staff" && isClaudeDraft(brief) && <ClaudeDraftBadge compact />}
                      <StatusPill status={brief.status} />
                    </div>
                    {briefSummaryLine(brief) && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {briefSummaryLine(brief)}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      {briefPillar(brief) && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                          {briefPillar(brief)}
                        </span>
                      )}
                      {briefFormatLabel(brief) && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-700/30 text-slate-300 border border-slate-700/50">
                          {briefFormatLabel(brief)}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WorkflowDot: React.FC<{ kind: "campaign" | "weekly" | "unified" }> = ({ kind }) => {
  const map = {
    campaign: { c: "bg-amber-400", t: "Campaign" },
    weekly: { c: "bg-blue-400", t: "Weekly cadence" },
    unified: { c: "bg-violet-400", t: "Unified" }
  } as const;
  const { c, t } = map[kind];
  return <span className={`w-1.5 h-1.5 rounded-full ${c} shrink-0`} title={t} />;
};

const StatusPill: React.FC<{ status: CreativeBrief["status"]; compact?: boolean }> = ({ status, compact }) => {
  const base = "inline-flex items-center rounded-full font-mono font-bold border";
  const size = compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[10px]";
  switch (status) {
    case "Approved":
      return (
        <span className={`${base} ${size} bg-emerald-500/15 text-emerald-400 border-emerald-500/30`}>
          <CheckCircle2 className={compact ? "w-2 h-2 mr-0.5" : "w-3 h-3 mr-1"} />Approved
        </span>
      );
    case "Changes Requested":
      return (
        <span className={`${base} ${size} bg-amber-500/15 text-amber-400 border-amber-500/30`}>
          <AlertCircle className={compact ? "w-2 h-2 mr-0.5" : "w-3 h-3 mr-1"} />Changes
        </span>
      );
    case "Rejected":
      return (
        <span className={`${base} ${size} bg-rose-500/15 text-rose-400 border-rose-500/30`}>
          <AlertCircle className={compact ? "w-2 h-2 mr-0.5" : "w-3 h-3 mr-1"} />Rejected
        </span>
      );
    case "Draft":
      return (
        <span className={`${base} ${size} bg-slate-500/15 text-slate-400 border-slate-500/30`}>
          <Edit3 className={compact ? "w-2 h-2 mr-0.5" : "w-3 h-3 mr-1"} />Draft
        </span>
      );
    default:
      return (
        <span className={`${base} ${size} bg-blue-500/15 text-blue-400 border-blue-500/30`}>
          <Clock className={compact ? "w-2 h-2 mr-0.5" : "w-3 h-3 mr-1"} />{status || "Proposed"}
        </span>
      );
  }
};
