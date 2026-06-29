import React, { useState } from "react";
import { useBrand } from "../context/BrandContext";
import { Calendar, Plus, ChevronLeft, ChevronRight, Filter, Bookmark, AlertCircle, RefreshCw } from "lucide-react";
import { CalendarEvent } from "../lib/firebase";

export const CalendarPage: React.FC = () => {
  const { activeBrand, calendarEvents, addCalendarEvent, theme, accentColor } = useBrand();
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("2026-06-30");
  const [type, setType] = useState<CalendarEvent["type"]>("Campaign");
  const [status, setStatus] = useState<CalendarEvent["status"]>("Planned");
  const [notes, setNotes] = useState("");

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    try {
      await addCalendarEvent({
        title,
        date,
        type,
        status,
        notes
      });
      setTitle("");
      setNotes("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Error creating calendar event:", err);
    }
  };

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
    
    // Campaign uses brand accent hex
    if (activeColor === "emerald") return "#10b981";
    if (activeColor === "rose") return "#f43f5e";
    if (activeColor === "amber") return "#f59e0b";
    return "#8b5cf6"; // Violet
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

  return (
    <div 
      id="calendar-view" 
      className={`space-y-8 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}
    >
      {/* Header title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Content Roadmap Calendar
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Plan milestones, publication slots, and marketing campaigns in sync with active brand objectives.
          </p>
        </div>
        <button
          id="btn-trigger-add-event"
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-md shadow-md transition-colors font-mono cursor-pointer self-start md:self-auto ${
            showAddForm ? "bg-rose-600 hover:bg-rose-500 text-white" : getBrandBgButton()
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Plan Milestone</span>
        </button>
      </div>

      {/* Quick Event Planning Form (Conditional render) */}
      {showAddForm && (
        <div 
          id="event-form-card" 
          className={`border rounded-xl p-6 shadow-xl animate-in slide-in-from-top-3 duration-200 ${
            isDark ? "bg-[#161616] border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4">
            New Milestone Deployment
          </h3>
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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

      {/* Grid Layout of Months with visual content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar visual layout box (Mocking current month of June/July 2026) */}
        <div 
          id="calendar-grid-card" 
          className={`border rounded-xl p-6 lg:col-span-8 shadow-lg ${
            isDark ? "bg-[#161616] border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className={`w-4 h-4 ${getBrandTextColor()}`} />
              <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>Roadmap Registry Matrix</h3>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
              <button className="p-1 hover:text-slate-600 dark:hover:text-slate-100 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="font-bold">June 2026</span>
              <button className="p-1 hover:text-slate-600 dark:hover:text-slate-100 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Simple grid representation */}
          <div className={`grid grid-cols-7 gap-2 text-center text-[10px] font-mono text-slate-400 font-bold mb-3 border-b pb-2 ${
            isDark ? "border-slate-800" : "border-slate-100"
          }`}>
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          <div id="calendar-days-container" className="grid grid-cols-7 gap-2.5">
            {/* June 2026 starts on Monday. Adding 1 empty day for offset (Sunday is blank) */}
            <div className="aspect-square bg-slate-950/5 rounded-md border border-slate-100 dark:border-slate-900/50 flex flex-col justify-between p-1.5 opacity-30 text-[9px] font-mono text-slate-400">31</div>
            
            {/* Days 1 to 27 */}
            {Array.from({ length: 27 }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `2026-06-${dayNum < 10 ? "0" + dayNum : dayNum}`;
              const dailyEvents = calendarEvents.filter(e => e.date === dateStr);
              
              return (
                <div 
                  key={idx} 
                  id={`calendar-day-${dayNum}`}
                  className={`aspect-square rounded-lg border p-2 flex flex-col justify-between transition-colors cursor-pointer relative group ${
                    isDark ? "bg-slate-950/60 border-slate-850 hover:border-slate-700" : "bg-slate-50/50 border-slate-200 hover:border-slate-350"
                  }`}
                >
                  <span className="text-[10px] font-mono font-semibold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">{dayNum}</span>
                  <div className="space-y-1">
                    {dailyEvents.map((evt) => {
                      const hexColor = getHexForCalendar(evt.type);
                      return (
                        <div 
                          key={evt.id} 
                          className="w-full text-[8px] font-mono font-bold px-1 py-0.5 rounded border leading-tight truncate"
                          title={evt.title}
                          style={{
                            borderColor: `${hexColor}30`,
                            color: hexColor,
                            backgroundColor: `${hexColor}08`
                          }}
                        >
                          {evt.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Days 28 to 30 */}
            {Array.from({ length: 3 }).map((_, idx) => {
              const dayNum = idx + 28;
              const dateStr = `2026-06-${dayNum}`;
              const dailyEvents = calendarEvents.filter(e => e.date === dateStr);
              return (
                <div 
                  key={dayNum} 
                  id={`calendar-day-${dayNum}`}
                  className={`aspect-square rounded-lg border p-2 flex flex-col justify-between transition-colors cursor-pointer relative group ${
                    isDark ? "bg-slate-950/60 border-slate-850 hover:border-slate-700" : "bg-slate-50/50 border-slate-200 hover:border-slate-350"
                  }`}
                >
                  <span className="text-[10px] font-mono font-semibold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">{dayNum}</span>
                  <div className="space-y-1">
                    {dailyEvents.map((evt) => {
                      const hexColor = getHexForCalendar(evt.type);
                      return (
                        <div 
                          key={evt.id} 
                          className="w-full text-[8px] font-mono font-bold px-1 py-0.5 rounded border leading-tight truncate"
                          title={evt.title}
                          style={{
                            borderColor: `${hexColor}30`,
                            color: hexColor,
                            backgroundColor: `${hexColor}08`
                          }}
                        >
                          {evt.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Agenda sidebar */}
        <div className={`border rounded-xl p-6 shadow-lg flex flex-col justify-between lg:col-span-4 ${
          isDark ? "bg-[#161616] border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-4">Milestone Roadmap</h4>
            
            <div id="calendar-agenda-list" className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
              {calendarEvents.map((event) => (
                <div 
                  key={event.id} 
                  id={`calendar-milestone-${event.id}`}
                  className={`border p-4 rounded-lg hover:border-slate-350 dark:hover:border-slate-750 transition-colors ${
                    isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${getTypeStyle(event.type)}`}>
                      {event.type}
                    </span>
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${getEventBadge(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                  <h5 className={`text-xs font-bold mt-2.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{event.title}</h5>
                  <p className={`text-[10px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{event.notes || "No extra milestone notes recorded."}</p>
                  
                  <div className={`mt-3.5 pt-2.5 border-t flex items-center justify-between text-[9px] font-mono text-slate-400 ${
                    isDark ? "border-slate-900" : "border-slate-100"
                  }`}>
                    <span>Target Date</span>
                    <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{event.date}</span>
                  </div>
                </div>
              ))}

              {calendarEvents.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs font-mono">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div>No upcoming roadmap records for this brand.</div>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 border-t border-slate-150 dark:border-slate-800 pt-4 mt-4">
            * Add milestones using the top-right console button.
          </div>
        </div>
      </div>
    </div>
  );
};
