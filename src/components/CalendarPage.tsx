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

  const [plannerViewMode, setPlannerViewMode] = useState<"planner" | "matrix">("planner");
  const [selectedBriefForChanges, setSelectedBriefForChanges] = useState<CreativeBrief | null>(null);
  const [selectedBriefForDetail, setSelectedBriefForDetail] = useState<CreativeBrief | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Date Navigation State (Defaulting to July 2026 to showcase the seeded mock events perfectly)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 6, 1)); 

  // Google Calendar Integration States
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);

  // Milestone Form fields
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("2026-07-01");
  const [type, setType] = useState<CalendarEvent["type"]>("Campaign");
  const [status, setStatus] = useState<CalendarEvent["status"]>("Planned");
  const [notes, setNotes] = useState("");

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

  // Submit new milestone event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    try {
      // 1. Add to local Firestore
      await addCalendarEvent({
        title,
        date,
        type,
        status,
        notes
      });

      // 2. Sync to Google Calendar in real-time if connected!
      if (googleCalendarToken) {
        const fullNotes = notes 
          ? `${notes}\n\n[Brand: ${activeBrand?.name || "Global"}] [Status: ${status}]`
          : `[Brand: ${activeBrand?.name || "Global"}] [Type: ${type}] [Status: ${status}]`;
        
        await createGoogleCalendarEvent(googleCalendarToken, {
          title: `[Roadmap] ${title}`,
          date,
          notes: fullNotes
        });
        
        // Reload google calendar events to update UI
        await loadGCalEvents();
      }

      setTitle("");
      setNotes("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Error creating calendar event:", err);
    }
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

  // Helper to extract Google event date
  const getGoogleEventDate = (evt: GoogleCalendarEvent) => {
    if (evt.start?.date) return evt.start.date;
    if (evt.start?.dateTime) return evt.start.dateTime.split("T")[0];
    return "";
  };

  // Helper for matching queues (scheduled posts) to date
  const getScheduledPostDate = (item: any) => {
    if (!item.scheduledTime) return "";
    return item.scheduledTime.split(/[ T]/)[0];
  };

  // Helper for matching briefs to calendar dates safely
  const normalizeDateString = (dStr?: string): string => {
    if (!dStr) return "";
    const trimmed = dStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const m = slashMatch[1].padStart(2, "0");
      const d = slashMatch[2].padStart(2, "0");
      const y = slashMatch[3];
      return `${y}-${m}-${d}`;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return trimmed;
  };

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

  // Visual Styling Helpers
  const getEventBadge = (status: CalendarEvent["status"]) => {
    switch (status) {
      case "Published":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Planned":
        if (activeColor === "emerald") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        if (activeColor === "rose") return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
        if (activeColor === "amber") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
      case "Under Review":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Draft":
        return "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-350 dark:border-slate-700";
    }
  };

  const getTypeStyle = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "Campaign": 
        if (activeColor === "emerald") return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/10";
        if (activeColor === "rose") return "text-rose-600 dark:text-rose-400 bg-rose-500/5 border-rose-500/10";
        if (activeColor === "amber") return "text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-500/10";
        return "text-violet-600 dark:text-violet-400 bg-violet-500/5 border-violet-500/10";
      case "Launch": return "text-rose-600 dark:text-rose-400 bg-rose-500/5 border-rose-500/10";
      case "Newsletter": return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/10";
      case "Event": return "text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-500/10";
      case "Social": return "text-sky-600 dark:text-sky-400 bg-sky-500/5 border-sky-500/10";
    }
  };

  const getHexForCalendar = (type: CalendarEvent["type"]) => {
    if (type === "Launch") return "#f43f5e";
    if (type === "Newsletter") return "#10b981";
    if (type === "Event") return "#f59e0b";
    if (type === "Social") return "#0ea5e9";
    
    if (activeColor === "emerald") return "#10b981";
    if (activeColor === "rose") return "#f43f5e";
    if (activeColor === "amber") return "#f59e0b";
    return "#8b5cf6"; 
  };

  const getBrandTextColor = () => {
    if (activeColor === "emerald") return "text-emerald-500 dark:text-emerald-400";
    if (activeColor === "rose") return "text-rose-500 dark:text-rose-400";
    if (activeColor === "amber") return "text-amber-500 dark:text-amber-400";
    return "text-violet-500 dark:text-violet-400";
  };

  const getBrandBgButton = () => {
    if (activeColor === "emerald") return "bg-emerald-600 hover:bg-emerald-500 text-white";
    if (activeColor === "rose") return "bg-rose-600 hover:bg-rose-500 text-white";
    if (activeColor === "amber") return "bg-amber-600 hover:bg-amber-500 text-white";
    return "bg-violet-600 hover:bg-violet-500 text-white";
  };

  const getBrandAccentBorder = () => {
    if (activeColor === "emerald") return "border-emerald-500";
    if (activeColor === "rose") return "border-rose-500";
    if (activeColor === "amber") return "border-amber-500";
    return "border-violet-500";
  };

  // Channel Icon helper for social rendering
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "Twitter/X": return <Twitter className="w-2.5 h-2.5 text-sky-400 inline shrink-0" />;
      case "LinkedIn": return <Linkedin className="w-2.5 h-2.5 text-blue-500 inline shrink-0" />;
      case "Instagram": return <Instagram className="w-2.5 h-2.5 text-rose-500 inline shrink-0" />;
      case "Newsletter": return <Mail className="w-2.5 h-2.5 text-emerald-500 inline shrink-0" />;
      case "YouTube": return <Youtube className="w-2.5 h-2.5 text-red-500 inline shrink-0" />;
      default: return <Sparkles className="w-2.5 h-2.5 inline shrink-0" />;
    }
  };

  // Status mapping colors for posts
  const getPostStatusStyle = (status: string) => {
    switch (status) {
      case "posted":
      case "completed":
        return { border: "border-emerald-500/25", text: "text-emerald-500", bg: "bg-emerald-500/5" };
      case "waiting posting":
      case "scheduled":
      case "active":
      case "processing":
        return { border: "border-amber-500/25", text: "text-amber-500", bg: "bg-amber-500/5" };
      case "wasn't posted":
        return { border: "border-rose-500/25", text: "text-rose-500", bg: "bg-rose-500/5" };
      default:
        return { border: "border-border/20", text: "text-slate-400", bg: "bg-slate-100/5" };
    }
  };

  // Aggregate selected day's items
  const selectedDayRoadmap = selectedDate 
    ? calendarEvents.filter(e => e.date === selectedDate) 
    : [];
  
  const selectedDayGoogle = selectedDate 
    ? googleEvents.filter(evt => getGoogleEventDate(evt) === selectedDate)
    : [];

  const selectedDayPosts = selectedDate
    ? queues.filter(q => getScheduledPostDate(q) === selectedDate)
    : [];

  const selectedDayBriefs = selectedDate
    ? briefs.filter(b => normalizeDateString(b.date) === selectedDate || b.date === selectedDate)
    : [];

  const totalSelectedDayItems = selectedDayRoadmap.length + selectedDayGoogle.length + selectedDayPosts.length + selectedDayBriefs.length;

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

          {/* Add Milestone Button */}
          <button
            id="btn-trigger-add-event"
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md shadow-md transition-colors font-mono cursor-pointer ${
              showAddForm ? "bg-rose-600 hover:bg-rose-500 text-white" : getBrandBgButton()
            }`}
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showAddForm ? "Close Form" : "Plan Milestone"}</span>
          </button>
        </div>
      </div>

      {/* Main View Mode Selector */}
      <div className={`p-1.5 rounded-2xl border flex items-center space-x-2 ${
        isDark ? "bg-[#141518] border-slate-800" : "bg-slate-100 border-slate-200"
      }`}>
        <button
          id="tab-view-weekly-planner"
          onClick={() => setPlannerViewMode("planner")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            plannerViewMode === "planner"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
              : isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-white"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Weekly Content Planner (Approval Hub)</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            plannerViewMode === "planner" ? "bg-white/20 text-white" : "bg-slate-700/50 text-slate-300"
          }`}>
            {briefs.length} Briefs
          </span>
        </button>

        <button
          id="tab-view-monthly-matrix"
          onClick={() => setPlannerViewMode("matrix")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            plannerViewMode === "matrix"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
              : isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60" : "text-slate-600 hover:text-slate-900 hover:bg-white"
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Monthly Roadmap & Milestone Matrix</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            plannerViewMode === "matrix" ? "bg-white/20 text-white" : "bg-slate-700/50 text-slate-300"
          }`}>
            {calendarEvents.length + googleEvents.length} Events
          </span>
        </button>
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
                ? `${approvedBriefs.length} briefs approved for production. Total Queue: ${queues.length} posts | Roadmap Milestones: ${calendarEvents.length} events.`
                : "Approved briefs are automatically mapped into the calendar roadmap and available for download and email distribution."}
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
                ? `Connected to: ${googleCalendarUser?.email || "Google Account"}. Live events are dynamically overlaid.` 
                : "Integrate Google Calendar to seamlessly view corporate meetings alongside your social campaign roadmap."
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

      {/* Quick Event Planning Form (Conditional render) */}
      {showAddForm && (
        <div 
          id="event-form-card" 
          className={`border rounded-xl p-6 shadow-xl animate-in slide-in-from-top-3 duration-200 ${
            isDark ? "bg-card border-border" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              New Content Milestone Deployment
            </h3>
            {googleCalendarToken && (
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                ✓ Auto-syncs to Google Calendar
              </span>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Milestone / Content Title *</label>
                <input
                  id="event-input-title"
                  type="text"
                  required
                  placeholder="e.g., Spatial Audio Demo Video Release"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Milestone Category</label>
                <select
                  id="event-input-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as CalendarEvent["type"])}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="Campaign">Campaign</option>
                  <option value="Launch">Launch Event</option>
                  <option value="Newsletter">Newsletter</option>
                  <option value="Event">Live Event</option>
                  <option value="Social">Social Release</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Calendar Date *</label>
                <input
                  id="event-input-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Validation State</label>
                <select
                  id="event-input-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CalendarEvent["status"])}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="Planned">Planned</option>
                  <option value="Draft">Draft</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Published">Published</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Operational Brief Notes</label>
                <input
                  id="event-input-notes"
                  type="text"
                  placeholder="e.g., Deliverable checklist: 1080p rendering, copy guidelines, YouTube metadata tags."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="event-submit-btn"
                type="submit"
                className={`px-4 py-2 text-xs font-semibold rounded-md shadow-md font-mono cursor-pointer ${getBrandBgButton()}`}
              >
                Schedule Milestone Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Area based on Planner vs Matrix View */}
      {plannerViewMode === "planner" ? (
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
              `"${brief.title}" for ${brief.dayOfWeek || "scheduled day"} has been approved and moved to the Posting Queue.`,
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
              `All proposed content for Week ${weekNum} (${briefIds.length} briefs) has been approved and staged in the Posting Queue.`,
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
      ) : (
        /* Grid Layout of Months with visual content cards (Monthly Matrix) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Calendar visual layout box (Dynamic Monthly Grid) */}
        <div 
          id="calendar-grid-card" 
          className={`border rounded-xl p-6 lg:col-span-8 shadow-lg flex flex-col justify-between ${
            isDark ? "bg-card border-border" : "bg-white border-slate-200"
          }`}
        >
          <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <CalendarIcon className={`w-4 h-4 ${getBrandTextColor()}`} />
                <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  Roadmap Registry Matrix
                </h3>
              </div>
              <div className="flex items-center space-x-4 text-xs font-mono">
                <div className="flex items-center space-x-2 text-slate-400">
                  <button 
                    onClick={handlePrevMonth}
                    className={`p-1.5 rounded-lg border transition-colors hover:text-slate-100 ${
                      isDark ? "border-border bg-slate-950/40 hover:bg-slate-900" : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className={`font-bold px-1.5 min-w-[100px] text-center ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    {months[month]} {year}
                  </span>
                  <button 
                    onClick={handleNextMonth}
                    className={`p-1.5 rounded-lg border transition-colors hover:text-slate-100 ${
                      isDark ? "border-border bg-slate-950/40 hover:bg-slate-900" : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Weekday headers */}
            <div className={`grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-slate-400 font-bold mb-3 border-b pb-2 ${
              isDark ? "border-border" : "border-slate-100"
            }`}>
              <span>SUN</span>
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
            </div>

            {/* Calendar Days Container Grid */}
            <div id="calendar-days-container" className="grid grid-cols-7 gap-2">
              {gridCells.map((cell, idx) => {
                const dailyInternalEvents = calendarEvents.filter(e => e.date === cell.dateString);
                const dailyGoogleEvents = googleEvents.filter(evt => getGoogleEventDate(evt) === cell.dateString);
                const dailyPosts = queues.filter(q => getScheduledPostDate(q) === cell.dateString);
                const dailyBriefs = briefs.filter(b => normalizeDateString(b.date) === cell.dateString || b.date === cell.dateString);

                const hasAnything = dailyInternalEvents.length > 0 || dailyGoogleEvents.length > 0 || dailyPosts.length > 0 || dailyBriefs.length > 0;
                const isSelected = selectedDate === cell.dateString;
                
                // Compare with real calendar today's date
                const todayObj = new Date();
                const todayFormatted = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;
                const isRealToday = cell.dateString === todayFormatted;

                return (
                  <div 
                    key={idx} 
                    id={`calendar-day-${cell.dateString}`}
                    onClick={() => {
                      setSelectedDate(cell.dateString);
                      setDate(cell.dateString);
                    }}
                    className={`min-h-[75px] rounded-lg border p-1.5 flex flex-col justify-between transition-all cursor-pointer relative group ${
                      isSelected 
                        ? `bg-violet-600/10 dark:bg-violet-600/5 ${getBrandAccentBorder()} ring-1 ring-offset-0 ring-violet-500/30`
                        : cell.isCurrentMonth
                        ? isDark 
                          ? "bg-[#181818]/60 border-border hover:border-slate-700" 
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        : isDark
                        ? "bg-slate-950/20 border-slate-900/40 opacity-40 hover:opacity-75"
                        : "bg-slate-100/50 border-slate-200/50 opacity-45 hover:opacity-75"
                    } ${isRealToday ? "ring-1 ring-emerald-500 ring-offset-1" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-semibold ${
                        isRealToday 
                          ? "text-emerald-500 font-bold" 
                          : cell.isCurrentMonth
                          ? isDark ? "text-slate-400 group-hover:text-slate-200" : "text-slate-600 group-hover:text-slate-800"
                          : "text-slate-500"
                      }`}>
                        {cell.dayNum}
                      </span>
                      <div className="flex items-center space-x-1">
                        {dailyBriefs.length > 0 && (
                          <span 
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400" 
                            title={`${dailyBriefs.length} Creative Brief(s)`} 
                          />
                        )}
                        {isRealToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Today" />
                        )}
                      </div>
                    </div>

                    {/* Compact Events display stack */}
                    <div className="space-y-1 mt-1 max-h-[50px] overflow-hidden">
                      
                      {/* Creative Briefs scheduled for this date */}
                      {dailyBriefs.slice(0, 1).map((b) => (
                        <div
                          key={b.id}
                          className="text-[7px] font-mono font-bold px-1 py-0.5 rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 leading-none truncate"
                          title={`[Brief - ${b.status}] ${b.title}`}
                        >
                          📋 {b.title}
                        </div>
                      ))}

                      {/* Internal Roadmap Events */}
                      {dailyInternalEvents.slice(0, 1).map((evt) => {
                        const hexColor = getHexForCalendar(evt.type);
                        return (
                          <div 
                            key={evt.id} 
                            className="text-[7.5px] font-mono font-semibold px-1 py-0.5 rounded border leading-none truncate"
                            title={`[Internal] ${evt.title}`}
                            style={{
                              borderColor: `${hexColor}35`,
                              color: hexColor,
                              backgroundColor: `${hexColor}08`
                            }}
                          >
                            ⭐ {evt.title}
                          </div>
                        );
                      })}

                      {/* Google Calendar Events */}
                      {dailyGoogleEvents.slice(0, 1).map((evt) => (
                        <div 
                          key={evt.id} 
                          className="text-[7.5px] font-mono font-semibold px-1 py-0.5 rounded border border-blue-500/25 text-blue-500 bg-blue-500/5 leading-none truncate"
                          title={`[Google] ${evt.summary}`}
                        >
                          📅 {evt.summary}
                        </div>
                      ))}

                      {/* Social Queue Scheduled Posts with status-specific styling */}
                      {dailyPosts.slice(0, 1).map((post) => {
                        const style = getPostStatusStyle(post.status);
                        return (
                          <div
                            key={post.id}
                            className={`text-[7px] font-mono font-semibold px-1 py-0.5 rounded border leading-none truncate flex items-center space-x-0.5 ${style.border} ${style.text} ${style.bg}`}
                            title={`[Post Status: ${post.status}] ${post.title}`}
                          >
                            {getChannelIcon(post.channel)}
                            <span className="truncate">{post.title}</span>
                          </div>
                        );
                      })}

                      {/* More items indicator */}
                      {(dailyBriefs.length + dailyInternalEvents.length + dailyGoogleEvents.length + dailyPosts.length) > 2 && (
                        <div className="text-[7px] font-mono text-slate-500 text-right pr-1">
                          +{ (dailyBriefs.length + dailyInternalEvents.length + dailyGoogleEvents.length + dailyPosts.length) - 2 } more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-border/20 text-[9px] font-mono text-slate-400">
            <span className="font-bold">Legend:</span>
            <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />📋 Approved Brief</span>
            <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-violet-500 mr-1" />⭐ Internal Milestone</span>
            <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" />📅 Google Calendar Event</span>
            <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />✓ Posted</span>
            <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />◷ Waiting Posting</span>
            <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1" />⚠ Wasn't Posted</span>
          </div>
        </div>

        {/* Dynamic Agenda details sidebar */}
        <div className={`border rounded-xl p-6 shadow-lg flex flex-col justify-between lg:col-span-4 ${
          isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/20">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                {selectedDate ? "Day Agenda Summary" : "Milestone Roadmap"}
              </h4>
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1"
                >
                  <X className="w-2.5 h-2.5" />
                  <span>Show All</span>
                </button>
              )}
            </div>

            {selectedDate && (
              <div className={`mb-4 px-3 py-2 rounded-lg border font-mono text-[10px] leading-tight ${
                isDark ? "bg-slate-950 border-border" : "bg-slate-50 border-slate-200 text-slate-600"
              }`}>
                <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Focus Date</div>
                <div className={`text-xs font-bold ${isDark ? "text-violet-400" : "text-violet-600"}`}>{selectedDate}</div>
                <div className="mt-1 text-[9px] text-slate-500">
                  {totalSelectedDayItems} scheduled events, plans, or social items.
                </div>
              </div>
            )}
            
            <div id="calendar-agenda-list" className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              
              {/* If date selected, display aggregated events for that specific day */}
              {selectedDate ? (
                <>
                  {/* Creative Briefs for selected day */}
                  {selectedDayBriefs.map((brief) => (
                    <div 
                      key={brief.id} 
                      id={`calendar-brief-${brief.id}`}
                      className={`border p-4 rounded-lg relative hover:border-emerald-500/50 transition-colors ${
                        isDark ? "bg-emerald-950/20 border-emerald-500/30" : "bg-emerald-50/60 border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border uppercase border-emerald-500/40 text-emerald-400 bg-emerald-500/10 flex items-center space-x-1">
                          <FileSpreadsheet className="w-2.5 h-2.5" />
                          <span>Creative Brief</span>
                        </span>
                        <span className="text-[8px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold">
                          {brief.status}
                        </span>
                      </div>
                      <h5 className={`text-xs font-bold mt-2.5 ${isDark ? "text-emerald-300" : "text-emerald-900"}`}>
                        📋 {brief.title}
                      </h5>
                      <p className={`text-[10px] mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        {brief.targetAudience ? `Target: ${brief.targetAudience}` : "Creative brief document"}
                      </p>
                      {(brief.deliverables || brief.formatSpec) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {brief.deliverables && (
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-black/20 border border-white/10 text-slate-300">
                              📦 {brief.deliverables}
                            </span>
                          )}
                          {brief.formatSpec && (
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-black/20 border border-white/10 text-slate-300">
                              📐 {brief.formatSpec}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Internal milestones for selected day */}
                  {selectedDayRoadmap.map((event) => (
                    <div 
                      key={event.id} 
                      id={`calendar-milestone-${event.id}`}
                      className={`border p-4 rounded-lg relative hover:border-slate-350 dark:hover:border-slate-750 transition-colors ${
                        isDark ? "bg-slate-950 border-border" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => deleteCalendarEvent(event.id)}
                        className="absolute top-3.5 right-3.5 p-1 text-slate-500 hover:text-rose-500 transition-colors"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${getTypeStyle(event.type)}`}>
                          {event.type}
                        </span>
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${getEventBadge(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                      <h5 className={`text-xs font-bold mt-2.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>⭐ {event.title}</h5>
                      <p className={`text-[10px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{event.notes || "No extra milestone notes recorded."}</p>

                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-900/40 flex flex-wrap items-center gap-1">
                        <span className="text-[8px] text-slate-500 font-mono mr-1">Status:</span>
                        {(["Draft", "Planned", "Under Review", "Published"] as CalendarEvent["status"][]).map((st) => (
                          <button
                            key={st}
                            onClick={() => updateCalendarEvent(event.id, { status: st })}
                            className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                              event.status === st
                                ? isDark 
                                  ? "bg-slate-800 text-white border-slate-500 font-semibold" 
                                  : "bg-slate-200 text-slate-800 border-slate-400 font-semibold"
                                : isDark 
                                  ? "text-slate-500 border-border hover:text-slate-300 hover:bg-slate-900" 
                                  : "text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Google Calendar events for selected day */}
                  {selectedDayGoogle.map((evt) => (
                    <div 
                      key={evt.id} 
                      className={`border p-4 rounded-lg relative border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-blue-500/30 text-blue-400 bg-blue-500/10 uppercase flex items-center space-x-1">
                          <CalendarDays className="w-2.5 h-2.5" />
                          <span>Google Cal Event</span>
                        </span>
                        {evt.htmlLink && (
                          <a 
                            href={evt.htmlLink} 
                            target="_blank" 
                            referrerPolicy="no-referrer"
                            className="text-slate-400 hover:text-blue-400 transition-colors"
                            title="Open in Google Calendar"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <h5 className="text-xs font-bold mt-2.5 text-blue-400">📅 {evt.summary}</h5>
                      {evt.description && (
                        <p className={`text-[10px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{evt.description}</p>
                      )}
                    </div>
                  ))}

                  {/* Campaign Scheduled Social posts for selected day */}
                  {selectedDayPosts.map((post) => {
                    const style = getPostStatusStyle(post.status);
                    return (
                      <div 
                        key={post.id} 
                        className={`border p-4 rounded-lg hover:border-slate-350 dark:hover:border-slate-750 transition-colors bg-slate-950/20 ${style.border}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border uppercase bg-slate-900 flex items-center space-x-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            {getChannelIcon(post.channel)}
                            <span>{post.channel} Post</span>
                          </span>
                          <span className={`text-[8px] font-mono px-2 py-0.5 rounded border capitalize ${style.bg} ${style.text}`}>
                            {post.status}
                          </span>
                        </div>
                        <h5 className={`text-xs font-bold mt-2.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{post.title}</h5>
                        <p className={`text-[10px] mt-1 line-clamp-3 text-slate-400`}>"{post.content}"</p>

                        <div className="mt-3.5 pt-2 border-t border-slate-200 dark:border-slate-900/40 flex flex-wrap items-center gap-1">
                          <span className="text-[8px] text-slate-500 font-mono mr-1">Status:</span>
                          {(["posted", "waiting posting", "wasn't posted"] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => updateCampaign(post.id, { status: st })}
                              className={`text-[8px] font-mono px-1.5 py-0.5 rounded border capitalize transition-all ${
                                post.status === st
                                  ? isDark 
                                    ? "bg-slate-800 text-white border-slate-500 font-semibold" 
                                    : "bg-slate-200 text-slate-800 border-slate-400 font-semibold"
                                  : isDark 
                                    ? "text-slate-500 border-border hover:text-slate-300 hover:bg-slate-900" 
                                    : "text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {totalSelectedDayItems === 0 && (
                    <div className="text-center py-12 text-slate-400 text-xs font-mono border border-dashed border-border/30 rounded-xl">
                      <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <div>No roadmap events on this date.</div>
                      <p className="text-[10px] text-slate-500 mt-1">Click "Plan Milestone" to schedule a plan for {selectedDate}.</p>
                    </div>
                  )}
                </>
              ) : (
                /* Otherwise, display standard upcoming items list */
                <>
                  {/* Approved Briefs Preview */}
                  {approvedBriefs.slice(0, 3).map((brief) => (
                    <div 
                      key={brief.id} 
                      className={`border p-4 rounded-lg border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 rounded uppercase flex items-center space-x-1">
                          <FileSpreadsheet className="w-2.5 h-2.5" />
                          <span>Approved Brief</span>
                        </span>
                        <span className="text-[8px] font-mono text-emerald-400 font-bold">
                          {brief.date || "Scheduled"}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold mt-2.5 text-emerald-400">📋 {brief.title}</h5>
                      <p className={`text-[10px] mt-1 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        {brief.targetAudience ? `Audience: ${brief.targetAudience}` : "Approved creative brief ready for deployment."}
                      </p>
                    </div>
                  ))}

                  {calendarEvents.map((event) => (
                    <div 
                      key={event.id} 
                      id={`calendar-milestone-${event.id}`}
                      className={`border p-4 rounded-lg relative hover:border-slate-350 dark:hover:border-slate-750 transition-colors ${
                        isDark ? "bg-slate-950 border-border" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => deleteCalendarEvent(event.id)}
                        className="absolute top-3.5 right-3.5 p-1 text-slate-500 hover:text-rose-500 transition-colors animate-in fade-in"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${getTypeStyle(event.type)}`}>
                          {event.type}
                        </span>
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${getEventBadge(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                      <h5 className={`text-xs font-bold mt-2.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>⭐ {event.title}</h5>
                      <p className={`text-[10px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{event.notes || "No extra milestone notes recorded."}</p>

                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-900/40 flex flex-wrap items-center gap-1">
                        <span className="text-[8px] text-slate-500 font-mono mr-1">Status:</span>
                        {(["Draft", "Planned", "Under Review", "Published"] as CalendarEvent["status"][]).map((st) => (
                          <button
                            key={st}
                            onClick={() => updateCalendarEvent(event.id, { status: st })}
                            className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                              event.status === st
                                ? isDark 
                                  ? "bg-slate-800 text-white border-slate-500 font-semibold" 
                                  : "bg-slate-200 text-slate-800 border-slate-400 font-semibold"
                                : isDark 
                                  ? "text-slate-500 border-border hover:text-slate-300 hover:bg-slate-900" 
                                  : "text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                      
                      <div className={`mt-3.5 pt-2.5 border-t flex items-center justify-between text-[9px] font-mono text-slate-400 ${
                        isDark ? "border-slate-900" : "border-slate-100"
                      }`}>
                        <span>Target Date</span>
                        <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{event.date}</span>
                      </div>
                    </div>
                  ))}

                  {/* Add visual list of Google calendar events as upcoming if no date selected */}
                  {googleEvents.slice(0, 5).map((evt) => {
                    const startD = getGoogleEventDate(evt);
                    return (
                      <div 
                        key={evt.id} 
                        className={`border p-4 rounded-lg border-blue-500/10 bg-blue-500/5 hover:border-blue-500/35 transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 border border-blue-500/20 text-blue-400 bg-blue-500/10 rounded uppercase flex items-center space-x-1">
                            <CalendarDays className="w-2.5 h-2.5" />
                            <span>Google Calendar</span>
                          </span>
                          {evt.htmlLink && (
                            <a 
                              href={evt.htmlLink} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="text-slate-400 hover:text-blue-400 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <h5 className="text-xs font-bold mt-2.5 text-blue-400">📅 {evt.summary}</h5>
                        {evt.description && (
                          <p className={`text-[10px] mt-1 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{evt.description}</p>
                        )}
                        <div className="mt-3.5 pt-2.5 border-t border-blue-500/10 flex items-center justify-between text-[9px] font-mono text-slate-400">
                          <span>Event Date</span>
                          <span className="font-semibold text-blue-400">{startD}</span>
                        </div>
                      </div>
                    );
                  })}

                  {(calendarEvents.length === 0 && googleEvents.length === 0 && approvedBriefs.length === 0) && (
                    <div className="text-center py-12 text-slate-400 text-xs font-mono">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <div>No roadmap records or synced Google events.</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 border-t border-slate-150 dark:border-border pt-4 mt-4">
            * Select any calendar day cell to view detail summaries, or click "Plan Milestone" to add items.
          </div>
        </div>
      </div>
      )}

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
