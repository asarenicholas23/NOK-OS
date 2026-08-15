import React, { useState } from "react";
import { X, Mail, Send, Loader2, CheckCircle2, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Brand, CreativeBrief, CalendarEvent, CampaignQueue } from "../lib/firebase";
import { GoogleCalendarEvent } from "../utils/googleCalendar";
import { getCalendarExcelBase64, downloadCalendarExcel } from "../utils/calendarExporter";
import { sendBriefEmail } from "../utils/gmailSender";

interface CalendarEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand | null;
  briefs: CreativeBrief[];
  calendarEvents: CalendarEvent[];
  queues: CampaignQueue[];
  googleEvents?: GoogleCalendarEvent[];
  monthName?: string;
  year?: number;
  gmailToken: string | null;
  gmailUser: any | null;
  connectGmail: () => Promise<void> | Promise<string | null>;
  addNotification: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void;
  isDark?: boolean;
}

export const CalendarEmailModal: React.FC<CalendarEmailModalProps> = ({
  isOpen,
  onClose,
  brand,
  briefs,
  calendarEvents,
  queues,
  googleEvents = [],
  monthName,
  year,
  gmailToken,
  gmailUser,
  connectGmail,
  addNotification,
  isDark = true,
}) => {
  const brandName = brand?.name || "Active Brand";
  const approvedBriefs = briefs.filter(b => b.status === "Approved");

  const [recipientEmails, setRecipientEmails] = useState<string>(() => {
    return brand?.domain ? `team@${brand.domain}` : "";
  });
  const [subject, setSubject] = useState<string>(() => {
    return `[${brandName}] Master Content Calendar & Approved Briefs Roadmap (${monthName || "2026"} ${year || ""})`;
  });
  const [bodyText, setBodyText] = useState<string>(() => {
    return `Hello Team,\n\nHere is the synchronized Master Content Calendar and Approved Creative Briefs roadmap for ${brandName}.\n\nExecutive Overview:\n• Approved Creative Briefs: ${approvedBriefs.length} assets ready for execution\n• Scheduled Multi-Channel Posts: ${queues.length} queue items\n• Operational Milestones: ${calendarEvents.length} roadmap events\n\nAttached is the styled, multi-tab Microsoft Excel & Google Sheets compatible workbook (.xlsx) containing complete campaign objectives, slide beat outlines, channel formatting specs, and delivery schedules.\n\nBest regards,\n${brandName} Marketing Operations`;
  });
  const [isSending, setIsSending] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const fileNamePreview = `Content_Calendar_${brandName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.xlsx`;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = recipientEmails
      .split(",")
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes("@"));

    if (emails.length === 0) {
      addNotification("Invalid Recipients", "Please provide at least one valid recipient email address.", "warning");
      return;
    }

    let activeToken = gmailToken || (typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null);
    if (!activeToken) {
      setIsConnecting(true);
      try {
        await connectGmail();
        activeToken = gmailToken || (typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null);
      } catch (err: any) {
        setIsConnecting(false);
        addNotification("Authorization Failed", "Could not connect to Gmail account.", "warning");
        return;
      }
      setIsConnecting(false);
    }

    if (!activeToken) {
      addNotification("Gmail Not Connected", "Please connect your Google account to send calendar emails.", "warning");
      return;
    }

    setIsSending(true);
    try {
      // 1. Build Base64 of styled Excel workbook
      const attachment = await getCalendarExcelBase64({
        brand,
        briefs,
        calendarEvents,
        queues,
        googleEvents,
        monthName,
        year
      });

      // 2. Dispatch via Gmail API
      await sendBriefEmail(
        activeToken,
        emails,
        subject,
        bodyText,
        [attachment]
      );

      addNotification(
        "Calendar Shared via Email",
        `Successfully emailed styled Content Calendar to ${emails.join(", ")}.`,
        "success"
      );
      onClose();
    } catch (err: any) {
      console.error("Failed to email calendar:", err);
      addNotification("Dispatch Failed", err.message || "Could not transmit calendar email via Gmail API.", "warning");
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadCopy = async () => {
    try {
      await downloadCalendarExcel({
        brand,
        briefs,
        calendarEvents,
        queues,
        googleEvents,
        monthName,
        year
      });
      addNotification("Excel Downloaded", "Content Calendar .xlsx downloaded to your device.", "success");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div 
      id="calendar-email-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        id="calendar-email-modal-card"
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? "bg-[#15151A] border-white/10 text-slate-100" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono uppercase tracking-wide">
                Share Content Calendar via Email
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Transmit styled Excel / Google Sheets workbook to team members or stakeholders.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/5 hover:border-white/20 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSendEmail} className="p-6 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
              Recipient Email(s) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. client@company.com, designer@studio.com"
              value={recipientEmails}
              onChange={(e) => setRecipientEmails(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-emerald-500 font-sans text-xs ${
                isDark ? "bg-[#111115] border-white/10 text-slate-100" : "bg-slate-50 border-slate-300 text-slate-900"
              }`}
            />
            <p className="text-[10px] text-slate-400 mt-1 font-sans">Separate multiple emails with commas.</p>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
              Email Subject Line
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-emerald-500 font-sans text-xs ${
                isDark ? "bg-[#111115] border-white/10 text-slate-100" : "bg-slate-50 border-slate-300 text-slate-900"
              }`}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
              Message Notes / Body Summary
            </label>
            <textarea
              rows={5}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-emerald-500 font-sans text-xs resize-none leading-relaxed ${
                isDark ? "bg-[#111115] border-white/10 text-slate-100" : "bg-slate-50 border-slate-300 text-slate-900"
              }`}
            />
          </div>

          {/* Attached Spreadsheet Preview Card */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
              Attached Styled Spreadsheet
            </label>
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isDark ? "bg-[#111115] border-emerald-500/30" : "bg-emerald-50/50 border-emerald-300"
            }`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs flex items-center space-x-1.5">
                    <span>{fileNamePreview}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                      Styled XLSX
                    </span>
                  </div>
                  <div className={`text-[10px] mt-0.5 font-sans ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Multi-tab: Approved Briefs, Social Queue, Operational Roadmap & KPI Matrix
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadCopy}
                className="text-[10px] px-2.5 py-1 rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-colors"
                title="Download local copy to check format"
              >
                Preview / Download
              </button>
            </div>
          </div>

          {/* Gmail API Authentication Status banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-[11px] ${
            gmailToken 
              ? isDark ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-800"
              : isDark ? "bg-amber-500/5 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            <div className="flex items-center space-x-2">
              {gmailToken ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
              <span>
                {gmailToken 
                  ? `Authenticated via Gmail (${gmailUser?.email || "Connected Account"})` 
                  : "Google OAuth token required to transmit emails directly"}
              </span>
            </div>
            {!gmailToken && (
              <button
                type="button"
                onClick={async () => {
                  setIsConnecting(true);
                  try {
                    await connectGmail();
                  } finally {
                    setIsConnecting(false);
                  }
                }}
                disabled={isConnecting}
                className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] cursor-pointer"
              >
                {isConnecting ? "Connecting..." : "Connect Google"}
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 text-slate-400 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSending || isConnecting}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Calendar & Spreadsheets</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
