import React, { useState, useEffect } from "react";
import { useBrand } from "../context/BrandContext";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  CalendarDays, 
  ExternalLink, 
  Sparkles, 
  RefreshCw,
  X,
  Check,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Youtube,
  FileSpreadsheet,
  Download,
  Share2,
  FileDown,
  Loader2,
  FileText
} from "lucide-react";
import { CalendarEvent, CreativeBrief } from "../lib/firebase";
import { fetchGoogleCalendarEvents, createGoogleCalendarEvent, GoogleCalendarEvent } from "../utils/googleCalendar";
import { downloadCalendarExcel, downloadCalendarCSV } from "../utils/calendarExporter";
import { downloadCalendarPDF } from "../utils/pdfGenerator";
import { CalendarEmailModal } from "./CalendarEmailModal";
import { WeeklyContentPlannerGrid } from "./WeeklyContentPlannerGrid";
import { RequestChangesModal } from "./RequestChangesModal";
import { ShareCalendarReviewModal } from "./ShareCalendarReviewModal";
import { BriefDetailModal } from "./BriefDetailModal";

export const CalendarPage: React.FC = () => {
  const { 
    activeBrand, 
    calendarEvents, 
    addCalendarEvent, 
    updateCalendarEvent,
    deleteCalendarEvent,
    queues,
    addCampaign,
    updateCampaign,
    briefs,
    updateCreativeBrief,
    bulkApproveBriefs,
    theme, 
    accentColor,
    googleCalendarToken,
    googleCalendarUser,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    gmailToken,
    gmailUser,
    connectGmail,
    addNotification
  } = useBrand();

  const [selectedBriefForChanges, setSelectedBriefForChanges] = useState<CreativeBrief | null>(null);
  const [selectedBriefForDetail, setSelectedBriefForDetail] = useState<CreativeBrief | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Date Navigation State (Defaulting to July 2026 to showcase the seeded mock events perfectly)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 6, 1));

  // Google Calendar Integration States
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  // Fetch Google Calendar events when token changes
  const loadGCalEvents = async () => {
    if (!googleCalendarToken) {
      setGoogleEvents([]);
      return;
    }
    setLoadingGoogle(true);
    try {
      const events = await fetchGoogleCalendarEvents(googleCalendarToken);
      setGoogleEvents(events);
    } catch (err) {
      console.error("Failed to load Google Calendar events:", err);
    } finally {
      setLoadingGoogle(false);
    }
  };

  useEffect(() => {
    loadGCalEvents();
  }, [googleCalendarToken]);

  const handleManualSync = async () => {
    setSyncingNow(true);
    await loadGCalEvents();
    setTimeout(() => setSyncingNow(false), 800);
  };

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Month rendering constants
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Grid Days computation
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = new Date(year, month, 1).getDay();
  const prevMonthDaysCount = new Date(year, month, 0).getDate();

  const gridCells: { dayNum: number; dateString: string; isCurrentMonth: boolean }[] = [];

  // Previous month cells padding
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDayNum = prevMonthDaysCount - i;
    const prevMonthDate = new Date(year, month - 1, prevDayNum);
    const mStr = String(prevMonthDate.getMonth() + 1).padStart(2, "0");
    const dStr = String(prevDayNum).padStart(2, "0");
    gridCells.push({
      dayNum: prevDayNum,
      dateString: `${prevMonthDate.getFullYear()}-${mStr}-${dStr}`,
      isCurrentMonth: false
    });
  }

  // Current month cells
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(i).padStart(2, "0");
    gridCells.push({
      dayNum: i,
      dateString: `${year}-${mStr}-${dStr}`,
      isCurrentMonth: true
    });
  }

  // Next month cells padding to make complete 6-week grids (42 cells)
  const remainingCells = 42 - gridCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    const mStr = String(nextMonthDate.getMonth() + 1).padStart(2, "0");
    const dStr = String(i).padStart(2, "0");
    gridCells.push({
      dayNum: i,
      dateString: `${nextMonthDate.getFullYear()}-${mStr}-${dStr}`,
      isCurrentMonth: false
    });
  }

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    setShowExportMenu(false);
    try {
      await downloadCalendarExcel({
        brand: activeBrand,
        briefs,
        calendarEvents,
        queues,
        googleEvents,
        monthName: months[month],
        year
      });
      addNotification("Calendar Downloaded", `Exported styled Content Calendar for ${activeBrand?.name || "Active Brand"}.`, "success");
    } catch (err: any) {
      console.error(err);
      addNotification("Export Failed", "Could not generate Excel spreadsheet.", "warning");
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadCSV = () => {
    setShowExportMenu(false);
    try {
      downloadCalendarCSV({
        brand: activeBrand,
        briefs,
        calendarEvents,
        queues,
        googleEvents
      });
      addNotification("CSV Downloaded", "Google Sheets compatible CSV exported.", "success");
    } catch (err: any) {
      console.error(err);
      addNotification("Export Failed", "Could not generate CSV file.", "warning");
    }
  };

  const handleDownloadPDF = () => {
    setShowExportMenu(false);
    try {
      downloadCalendarPDF(activeBrand, briefs, months[month], year);
      addNotification("PDF Downloaded", "Executive Content Calendar & Approval PDF exported.", "success");
    } catch (err: any) {
      console.error(err);
      addNotification("Export Failed", "Could not generate PDF calendar export.", "warning");
    }
  };

  const approvedBriefs = briefs.filter(b => b.status === "Approved");

  return (
    <div 
      id="calendar-view" 
      className={`space-y-6 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}
    >
      {/* Header title & Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              Interactive Content Calendar
            </h2>
            {approvedBriefs.length > 0 && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {approvedBriefs.length} Approved Briefs
              </span>
            )}
          </div>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Navigate months, export styled Excel / Google Sheets workbooks, email schedules, and audit delivery states.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Share for Owner Review Button */}
          <button
            id="btn-share-for-owner-review"
            onClick={() => setShowShareModal(true)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md shadow-xs border transition-all font-mono cursor-pointer ${
              isDark 
                ? "bg-violet-600/15 border-violet-500/40 hover:border-violet-500/70 text-violet-300 hover:bg-violet-500/25" 
                : "bg-violet-50 border-violet-300 text-violet-800 hover:bg-violet-100"
            }`}
            title="Share interactive calendar review link for owner approval"
          >
            <Share2 className="w-3.5 h-3.5 text-violet-400" />
            <span>Share for Approval</span>
          </button>

          {/* Download Calendar Dropdown */}
          <div className="relative">
            <button
              id="btn-download-calendar-main"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={downloadingExcel}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md shadow-xs border transition-all font-mono cursor-pointer ${
                isDark 
                  ? "bg-[#18181F] border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/10" 
                  : "bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              }`}
              title="Download content calendar and briefs spreadsheet"
            >
              {downloadingExcel ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{downloadingExcel ? "Exporting..." : "Download Calendar"}</span>
            </button>

            {showExportMenu && (
              <div 
                id="export-calendar-menu"
                className={`absolute right-0 mt-1.5 w-60 rounded-xl border shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 ${
                  isDark ? "bg-[#15151A] border-white/10 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-white/5">
                  Export Calendar & Briefs
                </div>
                <button
                  id="btn-export-xlsx"
                  onClick={handleDownloadExcel}
                  className="w-full text-left px-3 py-2 text-xs font-mono flex items-center space-x-2.5 hover:bg-emerald-500/10 hover:text-emerald-300 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold">Excel Workbook (.xlsx)</div>
                    <div className="text-[10px] text-slate-400 font-sans">Styled, multi-tab with approved briefs & specs</div>
                  </div>
                </button>
                <button
                  id="btn-export-csv"
                  onClick={handleDownloadCSV}
                  className="w-full text-left px-3 py-2 text-xs font-mono flex items-center space-x-2.5 hover:bg-violet-500/10 hover:text-violet-300 cursor-pointer transition-colors border-t border-white/5"
                >
                  <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                  <div>
                    <div className="font-bold">Google Sheets / CSV (.csv)</div>
                    <div className="text-[10px] text-slate-400 font-sans">Raw tabular format ready for import</div>
                  </div>
                </button>
                <button
                  id="btn-export-pdf"
                  onClick={handleDownloadPDF}
                  className="w-full text-left px-3 py-2 text-xs font-mono flex items-center space-x-2.5 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer transition-colors border-t border-white/5"
                >
                  <FileDown className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-bold">PDF Approval Document (.pdf)</div>
                    <div className="text-[10px] text-slate-400 font-sans">Landscape executive calendar & approval matrix</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Share via Email Button */}
          <button
            id="btn-share-calendar-email"
            onClick={() => setShowEmailModal(true)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md shadow-xs border transition-all font-mono cursor-pointer ${
              isDark 
                ? "bg-[#18181F] border-blue-500/30 hover:border-blue-500/60 text-blue-300 hover:bg-blue-500/10" 
                : "bg-white border-blue-300 text-blue-800 hover:bg-blue-50"
            }`}
            title="Email styled calendar spreadsheet to team members"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>Share via Email</span>
          </button>

        </div>
      </div>

      {/* Approved Briefs & Multi-Channel Sync Ribbon */}
      <div 
        id="calendar-approved-briefs-banner"
        className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all ${
          approvedBriefs.length > 0 
            ? isDark ? "bg-emerald-500/5 border-emerald-500/30" : "bg-emerald-50/70 border-emerald-300"
            : isDark ? "bg-[#141418] border-white/10" : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex items-center space-x-3.5">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            approvedBriefs.length > 0 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
              : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
          }`}>
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wide">
                {approvedBriefs.length > 0 
                  ? `Active Roadmap: ${approvedBriefs.length} Approved Creative Briefs Scheduled` 
                  : "Creative Briefs & Multi-Channel Roadmap Matrix"}
              </h4>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Excel & Sheets Ready
              </span>
            </div>
            <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {approvedBriefs.length > 0
                ? `${approvedBriefs.length} briefs approved for production. Total Queue: ${queues.length} posts.`
                : "Approved briefs are automatically mapped into the weekly planner and available for download and email distribution."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleDownloadExcel}
            disabled={downloadingExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer transition-all disabled:opacity-50"
            title="Download full styled Excel spreadsheet (.xlsx)"
          >
            {downloadingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download .xlsx</span>
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
              isDark 
                ? "bg-[#18181F] border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10" 
                : "bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            }`}
            title="Share spreadsheet schedule via email"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Schedule</span>
          </button>
        </div>
      </div>

      {/* Google Calendar Connection Banner */}
      <div 
        id="gcalendar-connection-banner"
        className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
          isDark ? "bg-[#111111] border-border/60" : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex items-center space-x-3.5">
          <div className={`p-2.5 rounded-lg shrink-0 ${googleCalendarToken ? "bg-blue-600/10 text-blue-500" : "bg-slate-500/10 text-slate-500"}`}>
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`text-xs font-bold font-mono uppercase tracking-wide ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              Google Calendar Sync
            </h4>
            <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {googleCalendarToken
                ? `Connected to: ${googleCalendarUser?.email || "Google Account"}. Events are included in calendar exports and emails.`
                : "Connect Google Calendar to include its events in your exported calendar spreadsheets and emails."
              }
            </p>
            {!googleCalendarToken && typeof window !== "undefined" && window.self !== window.top && (
              <p className="text-[10px] text-amber-500 font-medium mt-1.5 flex items-center gap-1 bg-amber-500/10 p-1 px-2 rounded border border-amber-500/20 max-w-xl">
                <span>⚠️ Preview Mode Notice: If the authorization popup fails, please open this app in a <strong>New Tab</strong> (using the top-right icon) to sign in safely.</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {googleCalendarToken ? (
            <>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={loadingGoogle || syncingNow}
                className={`p-1.5 rounded border text-[11px] font-mono cursor-pointer flex items-center space-x-1 ${
                  isDark ? "bg-slate-900 border-border text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
                title="Sync calendar events now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingNow || loadingGoogle ? "animate-spin text-blue-500" : ""}`} />
                <span className="hidden xs:inline">Reload</span>
              </button>
              <button
                type="button"
                id="btn-disconnect-gcal"
                onClick={disconnectGoogleCalendar}
                className="bg-rose-600/15 text-rose-500 hover:bg-rose-600/20 text-[10px] font-mono font-bold px-3 py-1.5 rounded cursor-pointer uppercase border border-rose-500/20"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              id="btn-connect-gcal"
              onClick={connectGoogleCalendar}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold px-3 py-1.5 rounded shadow-sm cursor-pointer uppercase transition-all"
            >
              Authorize Google Calendar
            </button>
          )}
        </div>
      </div>

      {/* Weekly Content Planner (single source of truth for scheduling) */}
      <WeeklyContentPlannerGrid
          briefs={briefs}
          activeBrand={activeBrand}
          theme={theme}
          activeColor={activeColor}
          monthName={months[month]}
          monthIndex={month}
          year={year}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectMonth={(mIdx) => setCurrentDate(new Date(year, mIdx, 1))}
          onSelectYear={(y) => setCurrentDate(new Date(y, month, 1))}
          onJumpToday={() => setCurrentDate(new Date())}
          onApproveDay={async (brief) => {
            await updateCreativeBrief(brief.id, { status: "Approved" });
            addNotification(
              "Creative Brief Approved",
              `"${brief.title}" for ${brief.dayOfWeek || "scheduled day"} has been approved. Use "Email to Designer" to hand it off for production.`,
              "success"
            );
          }}
          onRequestChanges={(brief) => {
            setSelectedBriefForChanges(brief);
          }}
          onApproveAllWeek={async (weekNum, briefIds) => {
            await bulkApproveBriefs(briefIds);
            addNotification(
              "Week Approved",
              `All proposed content for Week ${weekNum} (${briefIds.length} briefs) has been approved.`,
              "success"
            );
          }}
          onOpenBriefDetail={(brief) => {
            setSelectedBriefForDetail(brief);
          }}
          onShareCalendar={() => {
            setShowShareModal(true);
          }}
          updateCreativeBrief={updateCreativeBrief}
          addCampaign={addCampaign}
          addCalendarEvent={addCalendarEvent}
          addNotification={addNotification}
        />

      {/* Request Changes Modal */}
      {selectedBriefForChanges && (
        <RequestChangesModal
          brief={selectedBriefForChanges}
          activeBrand={activeBrand}
          theme={theme}
          onClose={() => setSelectedBriefForChanges(null)}
          onSubmit={async (briefId, notes) => {
            await updateCreativeBrief(briefId, {
              status: "Changes Requested",
              revisionNotes: notes
            });
            addNotification(
              "Changes Requested",
              `Revision feedback submitted for "${selectedBriefForChanges.title}".`,
              "info"
            );
            setSelectedBriefForChanges(null);
          }}
        />
      )}

      {/* Creative Brief Full Detail Modal (Owner / Designer views) */}
      {selectedBriefForDetail && (
        <BriefDetailModal
          brief={selectedBriefForDetail}
          activeBrand={activeBrand}
          theme={theme}
          activeColor={activeColor}
          onClose={() => setSelectedBriefForDetail(null)}
          onApprove={async (brief) => {
            await updateCreativeBrief(brief.id, { status: "Approved" });
            addNotification(
              "Brief Approved",
              `"${brief.title}" approved and staged into Posting Queue.`,
              "success"
            );
            setSelectedBriefForDetail(null);
          }}
          onRequestChanges={(brief) => {
            setSelectedBriefForDetail(null);
            setSelectedBriefForChanges(brief);
          }}
        />
      )}

      {/* Share Calendar for Review Modal */}
      {showShareModal && (
        <ShareCalendarReviewModal
          activeBrand={activeBrand}
          theme={theme}
          briefs={briefs}
          monthName={months[month]}
          year={year}
          onClose={() => setShowShareModal(false)}
          onOpenEmailModal={() => setShowEmailModal(true)}
          gmailToken={gmailToken}
          gmailUser={gmailUser}
          connectGmail={connectGmail}
          addNotification={addNotification}
        />
      )}

      {/* Calendar Email / Download Modal */}
      {showEmailModal && (
        <CalendarEmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          brand={activeBrand}
          briefs={briefs}
          calendarEvents={calendarEvents}
          queues={queues}
          googleEvents={googleEvents}
          monthName={months[month]}
          year={year}
          gmailToken={gmailToken}
          gmailUser={gmailUser}
          connectGmail={connectGmail}
          addNotification={addNotification}
          isDark={isDark}
        />
      )}
    </div>
  );
};
