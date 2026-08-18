import React, { useState } from "react";
import {
  Plus,
  Sparkles,
  Loader2,
  Mail,
  LogOut,
  Send,
  Download,
  CheckCircle2,
  UserCheck,
  Layers,
  ChevronRight
} from "lucide-react";
import { CreativeBrief, Brand, BrandDirection, CampaignQueue, CalendarEvent } from "../lib/firebase";
import { generateBriefPDF, downloadSingleBriefPDF } from "../utils/pdfGenerator";
import { sendBriefEmail } from "../utils/gmailSender";
import { apiFetch } from "../lib/apiBase";
import { PushBriefWorkflowModal } from "./PushBriefWorkflowModal";

interface CreativeBriefsStudioProps {
  briefs: CreativeBrief[];
  directions: BrandDirection[];
  activeBrand: Brand | null;
  theme: string;
  activeColor: string;
  currentMonthName: string;
  currentYear: number;
  addCreativeBrief: (brief: Omit<CreativeBrief, "id" | "brandId">) => Promise<void>;
  updateCreativeBrief: (id: string, brief: Partial<CreativeBrief>) => Promise<void>;
  addCampaign: (campaign: Omit<CampaignQueue, "id" | "brandId">) => Promise<void>;
  addCalendarEvent: (event: Omit<CalendarEvent, "id" | "brandId">) => Promise<void>;
  gmailToken: string | null;
  gmailUser: any;
  connectGmail: () => void;
  disconnectGmail: () => void;
  addNotification: (title: string, message: string, type?: "info" | "success" | "warning") => void;
}

export const CreativeBriefsStudio: React.FC<CreativeBriefsStudioProps> = ({
  briefs,
  directions,
  activeBrand,
  theme,
  activeColor,
  currentMonthName,
  currentYear,
  addCreativeBrief,
  updateCreativeBrief,
  addCampaign,
  addCalendarEvent,
  gmailToken,
  gmailUser,
  connectGmail,
  disconnectGmail,
  addNotification
}) => {
  const isDark = theme === "dark";

  // AI generation state
  const [generatingBriefs, setGeneratingBriefs] = useState(false);
  const [generationCount, setGenerationCount] = useState<number>(5);

  // Manual creation form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyMessage, setKeyMessage] = useState("");
  const [deliverables, setDeliverables] = useState("");

  // Push-to-calendar workflow state
  const [briefToPush, setBriefToPush] = useState<CreativeBrief | null>(null);
  const [showPushModal, setShowPushModal] = useState(false);

  // Bulk select / email state (scoped to unscheduled briefs)
  const [selectedBriefIds, setSelectedBriefIds] = useState<string[]>([]);
  const [briefsToEmail, setBriefsToEmail] = useState<CreativeBrief[]>([]);
  const [recipientEmails, setRecipientEmails] = useState<string>("management@brand.com, designer@brand.com");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailBody, setEmailBody] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  const approvedDirections = directions.filter(d => d.status === "Approved");
  const unscheduledBriefs = briefs.filter(b => !b.weekNumber);

  const getBrandBgButton = () => {
    if (activeColor === "emerald") return "bg-emerald-600 hover:bg-emerald-500 text-white";
    if (activeColor === "rose") return "bg-rose-600 hover:bg-rose-500 text-white";
    if (activeColor === "amber") return "bg-amber-600 hover:bg-amber-500 text-white";
    return "bg-violet-600 hover:bg-violet-500 text-white";
  };

  const handleGenerateBriefsFromDirections = async () => {
    if (approvedDirections.length === 0) {
      addNotification("Approval Required", "Approve at least one brand direction before generating creative briefs.", "warning");
      return;
    }
    setGeneratingBriefs(true);
    try {
      const response = await apiFetch("/api/generate-briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: activeBrand?.tagline || "Global Standards",
          voiceTone: activeBrand?.voiceTone || "Professional, Authoritative",
          brandGuide: {
            contentPillars: activeBrand?.contentPillars || "",
            audiencePersonas: activeBrand?.audiencePersonas || "",
            competitorContext: activeBrand?.competitorContext || "",
            platformNotes: activeBrand?.platformNotes || ""
          },
          approvedDirections,
          count: generationCount
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate creative briefs via Gemini service");
      }

      const generatedBriefs = await response.json();

      for (const item of generatedBriefs) {
        await addCreativeBrief({
          title: item.title,
          objective: item.objective,
          targetAudience: item.targetAudience,
          keyMessage: item.keyMessage,
          deliverables: item.deliverables,
          status: "Proposed",
          campaignId: item.campaignId,
          date: item.date,
          sequencePosition: item.sequencePosition,
          proofPoint: item.proofPoint,
          formatSpec: item.formatSpec,
          contentOutline: item.contentOutline,
          cta: item.cta,
          toneVisualRef: item.toneVisualRef,
          successMetric: item.successMetric,
          approver: item.approver,
          // Calendar spreadsheet fields — keeps generated briefs fully populated in the grid
          platform: item.platform,
          mainFocus: item.mainFocus,
          topicIdea: item.topicIdea,
          contentPillar: item.contentPillar,
          postType: item.postType,
          progressTracking: item.progressTracking,
          visualReference: item.visualReference,
          visualCopyDetail: item.visualCopyDetail,
          copywritingCaption: item.copywritingCaption,
          hashtags: item.hashtags
        });
      }

      addNotification(
        "Content Briefs Synthesized",
        `Drafted ${generatedBriefs.length} creative briefs from approved brand directions! Slot them onto the calendar below.`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      addNotification("Synthesis Interrupted", err.message || "Failed to communicate with AI generation pipeline.", "warning");
    } finally {
      setGeneratingBriefs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !objective || !targetAudience || !keyMessage) return;
    try {
      await addCreativeBrief({
        title,
        objective,
        targetAudience,
        keyMessage,
        deliverables: deliverables || "N/A",
        status: "Proposed"
      });
      setTitle("");
      setObjective("");
      setTargetAudience("");
      setKeyMessage("");
      setDeliverables("");
      setShowForm(false);
    } catch (err) {
      console.error("Error creating creative brief:", err);
    }
  };

  const handleDownloadPDF = (brief: CreativeBrief) => {
    try {
      const doc = generateBriefPDF(brief, activeBrand?.name, activeBrand || undefined);
      const fileName = `Brief_${brief.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      doc.save(fileName);
      addNotification("PDF Downloaded", `"${brief.title}" PDF successfully downloaded to your local device.`, "success");
    } catch (err: any) {
      console.error(err);
      addNotification("Download Failed", "Could not generate local PDF asset.", "warning");
    }
  };

  const handleOpenEmailModal = (briefList: CreativeBrief[]) => {
    setBriefsToEmail(briefList);
    if (briefList.length === 1) {
      const brief = briefList[0];
      setEmailSubject(`[Approval Request] Creative Brief: ${brief.title}`);
      setEmailBody(
        `Hi Team,\n\nPlease review and approve the attached creative campaign brief for "${brief.title}" under brand "${activeBrand?.name || "Global Standards"}".\n\nObjective:\n${brief.objective}\n\nTarget Audience:\n${brief.targetAudience}\n\nDeliverables:\n${brief.deliverables || "N/A"}\n\nPlease reply with your approval or any requested changes so we can finalize execution.\n\nBest regards,\nCreative Briefs Desk`
      );
    } else {
      setEmailSubject(`[Approval Request Pack] ${briefList.length} Creative Brief Specs for Review`);
      setEmailBody(
        `Hi,\n\nPlease review the attached ${briefList.length} campaign creative briefs under brand "${activeBrand?.name || "Global Standards"}" to grant approval.\n\nBriefs Included:\n${briefList.map((b, i) => `${i + 1}. ${b.title}`).join("\n")}\n\nPlease review the attached PDF specifications and reply with your approval.\n\nBest regards,\nCreative Briefs Desk`
      );
    }
  };

  const handleSendEmail = async () => {
    if (!gmailToken) {
      addNotification("Auth Required", "Please connect your Google account to send emails.", "warning");
      return;
    }
    if (briefsToEmail.length === 0) return;

    const emails = recipientEmails
      .split(",")
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes("@"));

    if (emails.length === 0) {
      addNotification("Invalid Recipients", "Please enter at least one valid recipient email address.", "warning");
      return;
    }

    setSendingEmail(true);
    try {
      const attachments = briefsToEmail.map(brief => {
        const doc = generateBriefPDF(brief, activeBrand?.name, activeBrand || undefined);
        const pdfArrayBuffer = doc.output("arraybuffer");
        const bytes = new Uint8Array(pdfArrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const pdfBase64 = btoa(binary);
        const fileName = `Brief_${brief.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
        return { pdfBase64, fileName };
      });

      await sendBriefEmail(gmailToken, emails, emailSubject, emailBody, attachments);

      addNotification(
        "Approval Request Transmitted",
        `Sent approval request with PDF attachment(s) for ${briefsToEmail.length} brief(s) to ${emails.join(", ")}!`,
        "success"
      );

      setBriefsToEmail([]);
      setSelectedBriefIds([]);
    } catch (err: any) {
      console.error("Email send error:", err);
      addNotification("Email Dispatch Failed", err.message || "Failed to transmit email via Google API.", "warning");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div id="creative-briefs-studio" className="space-y-4">
      {/* Gmail Authorization Status Banner */}
      <div
        id="gmail-connection-banner"
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
          isDark ? "bg-slate-900/40 border-border" : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${gmailToken ? "bg-emerald-500/10 text-emerald-500" : "bg-violet-500/10 text-violet-500"}`}>
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono tracking-wide uppercase">Gmail Dispatch Integration</h4>
            <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {gmailToken
                ? `Authorized as ${gmailUser?.email || "Google User"}. Draft briefs can be transmitted directly as PDFs for approval.`
                : "Authorize your Gmail account to enable sending draft briefs to your management and design team."}
            </p>
          </div>
        </div>
        <div>
          {gmailToken ? (
            <button
              id="btn-disconnect-gmail"
              onClick={disconnectGmail}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold font-mono border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg cursor-pointer transition-all uppercase"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect Gmail</span>
            </button>
          ) : (
            <button
              id="btn-connect-gmail"
              onClick={connectGmail}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold font-mono border border-violet-500 bg-violet-600 hover:bg-violet-500 text-white rounded-lg cursor-pointer transition-all shadow-sm uppercase"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Authorize Gmail Send</span>
            </button>
          )}
        </div>
      </div>

      {/* Authoring Toolbar */}
      <div
        className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDark ? "bg-[#18191E] border-slate-800 shadow-xl" : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div>
          <h3 className={`text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Creative Briefs Studio</h3>
          <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Generate or draft briefs here, then slot them onto the calendar below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 border border-border bg-slate-950/40 px-2 py-1.5 rounded-lg">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Count</span>
            <select
              id="briefs-generation-count-select"
              value={generationCount}
              onChange={(e) => setGenerationCount(Number(e.target.value))}
              className={`text-xs px-1.5 py-0.5 rounded border focus:outline-none focus:ring-1 font-mono cursor-pointer ${
                isDark ? "bg-slate-950 border-border text-slate-200" : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <button
            id="btn-generate-briefs-from-directions"
            onClick={handleGenerateBriefsFromDirections}
            disabled={generatingBriefs || approvedDirections.length === 0}
            title={approvedDirections.length === 0 ? "Approve at least one direction first" : undefined}
            className={`px-4 py-2 border rounded-lg font-mono text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              generatingBriefs || approvedDirections.length === 0
                ? "bg-slate-800 border-slate-750 text-slate-500 cursor-not-allowed"
                : isDark
                  ? "bg-slate-900 border-border text-slate-200 hover:border-slate-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
            }`}
          >
            {generatingBriefs ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating briefs...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <span>
                  Generate from Directions
                  {approvedDirections.length > 0 ? ` (${approvedDirections.length} Approved)` : " (Approve Directions First)"}
                </span>
              </>
            )}
          </button>

          <button
            id="btn-trigger-add-brief"
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg shadow-md transition-colors font-mono cursor-pointer ${
              showForm ? "bg-rose-600 hover:bg-rose-500 text-white" : getBrandBgButton()
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showForm ? "Cancel Brief" : "Create Brief"}</span>
          </button>
        </div>
      </div>

      {/* Manual Brief Creation Form */}
      {showForm && (
        <div
          id="brief-form-card"
          className={`border rounded-xl p-6 shadow-xl animate-in slide-in-from-top-3 duration-200 ${
            isDark ? "bg-card border-border/80" : "bg-white border-slate-200"
          }`}
        >
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-2 text-violet-500" />
            Draft a Brief Manually
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Brief Title *</label>
                <input
                  id="brief-input-title"
                  type="text"
                  required
                  placeholder="e.g., Q3 Cloud Migration Campaign Pack"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Deliverables Scope</label>
                <input
                  id="brief-input-deliverables"
                  type="text"
                  placeholder="e.g., 3x LinkedIn graphics, 1x brand performance report..."
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Core Campaign Objective *</label>
                <textarea
                  id="brief-input-objective"
                  required
                  rows={2}
                  placeholder="Define primary marketing, branding, or user acquisition goals..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Target Audience Segment *</label>
                <textarea
                  id="brief-input-audience"
                  required
                  rows={2}
                  placeholder="Describe demographic, technical background, or segment archetype..."
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Key Marketing Message *</label>
              <textarea
                id="brief-input-message"
                required
                rows={2}
                placeholder="Primary core copy line or positioning statement..."
                value={keyMessage}
                onChange={(e) => setKeyMessage(e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                  isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                }`}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="brief-submit-action"
                type="submit"
                className={`px-4 py-2 text-xs font-semibold rounded-md shadow-md font-mono cursor-pointer ${getBrandBgButton()}`}
              >
                Save Draft Brief
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Unscheduled Briefs Strip */}
      <div
        id="unscheduled-briefs-panel"
        className={`border rounded-xl p-5 shadow-lg ${isDark ? "bg-card border-border" : "bg-white border-slate-200"}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-violet-600/10 text-violet-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                Unscheduled Briefs ({unscheduledBriefs.length})
              </h4>
              <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Generated or drafted briefs waiting for a day on the calendar.
              </p>
            </div>
          </div>

          {unscheduledBriefs.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  setSelectedBriefIds(prev =>
                    prev.length === unscheduledBriefs.length ? [] : unscheduledBriefs.map(b => b.id)
                  )
                }
                className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded-lg border transition-all cursor-pointer uppercase ${
                  isDark ? "border-border bg-slate-950/40 text-slate-300 hover:text-white hover:bg-slate-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {selectedBriefIds.length === unscheduledBriefs.length ? "Deselect All" : `Select All (${unscheduledBriefs.length})`}
              </button>
              {selectedBriefIds.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      const selectedList = unscheduledBriefs.filter(b => selectedBriefIds.includes(b.id));
                      selectedList.forEach(brief => handleDownloadPDF(brief));
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold font-mono bg-violet-600 hover:bg-violet-500 text-white rounded-lg cursor-pointer transition-all shadow-sm uppercase"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ({selectedBriefIds.length})</span>
                  </button>
                  <button
                    onClick={() => handleOpenEmailModal(unscheduledBriefs.filter(b => selectedBriefIds.includes(b.id)))}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold font-mono bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer transition-all shadow-sm uppercase"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Request Approval ({selectedBriefIds.length})</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {unscheduledBriefs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-mono border border-dashed border-border/40 rounded-xl bg-slate-950/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
            <div>Every brief is slotted onto the calendar.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {unscheduledBriefs.map((brief) => (
              <div
                key={brief.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isDark ? "bg-slate-950/40 border-border" : "bg-slate-50 border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedBriefIds.includes(brief.id)}
                  onChange={(e) =>
                    setSelectedBriefIds(prev => (e.target.checked ? [...prev, brief.id] : prev.filter(id => id !== brief.id)))
                  }
                  className="shrink-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{brief.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{brief.topicIdea || brief.keyMessage}</p>
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">
                  {brief.status || "Proposed"}
                </span>
                <button
                  onClick={() => handleDownloadPDF(brief)}
                  className="p-1.5 rounded-lg border border-border text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                  title="Download brief PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setBriefToPush(brief);
                    setShowPushModal(true);
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-violet-600/15 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 transition-all cursor-pointer shrink-0"
                >
                  <span>Push to Calendar</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Push Brief Workflow Modal */}
      {showPushModal && briefToPush && (
        <PushBriefWorkflowModal
          brief={briefToPush}
          activeBrand={activeBrand}
          theme={theme}
          activeColor={activeColor}
          currentMonthName={currentMonthName}
          currentYear={currentYear}
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

      {/* Gmail Email Modal */}
      {briefsToEmail.length > 0 && (
        <div
          id="gmail-email-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            id="gmail-email-modal-content"
            className={`w-full max-w-lg border rounded-xl shadow-2xl p-6 ${
              isDark ? "bg-sidebar border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-violet-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider">Dispatch Creative Brief via Gmail</h3>
                  <p className="text-[11px] text-slate-400 font-mono">MIME Multi-part PDF Attachment Pack</p>
                </div>
              </div>
              <button
                id="btn-close-email-modal"
                onClick={() => setBriefsToEmail([])}
                className="text-slate-400 hover:text-slate-200 text-lg font-mono px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!gmailToken ? (
              <div className="space-y-4 py-4 text-center">
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  You are not currently authenticated with Google Gmail send scope. Please authorize your Google account first to enable secure email transmission.
                </p>
                <button
                  id="btn-modal-connect-gmail"
                  onClick={() => connectGmail()}
                  className="flex items-center space-x-2 mx-auto px-4 py-2 text-xs font-bold font-mono bg-violet-600 hover:bg-violet-500 text-white rounded-lg cursor-pointer transition-all uppercase"
                >
                  <Mail className="w-4 h-4" />
                  <span>Authorize Google Account</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-center space-x-2 text-[11px] text-amber-400 font-mono">
                  <UserCheck className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Approval Request Mode: Transmitting brief(s) with PDF specs attached for sign-off.</span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">
                    Recipients (Comma separated) *
                  </label>
                  <input
                    id="email-input-recipients"
                    type="text"
                    className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-1 text-xs font-mono ${
                      isDark ? "bg-slate-950 border-border focus:ring-violet-500 text-slate-200" : "bg-white border-slate-200 focus:ring-violet-500 text-slate-700"
                    }`}
                    placeholder="e.g., manager@brand.com, designer@brand.com"
                    value={recipientEmails}
                    onChange={(e) => setRecipientEmails(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Email Subject Line *</label>
                  <input
                    id="email-input-subject"
                    type="text"
                    required
                    className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-1 text-xs ${
                      isDark ? "bg-slate-950 border-border focus:ring-violet-500 text-slate-200" : "bg-white border-slate-200 focus:ring-violet-500 text-slate-700"
                    }`}
                    placeholder="Brief Status update"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Email Body Copy</label>
                  <textarea
                    id="email-input-body"
                    rows={6}
                    className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-1 text-xs leading-relaxed ${
                      isDark ? "bg-slate-950 border-border focus:ring-violet-500 text-slate-200" : "bg-white border-slate-200 focus:ring-violet-500 text-slate-700"
                    }`}
                    placeholder="Enter message body..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 mt-4">
                  <div className="flex items-center text-[10px] text-emerald-500 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    <span>Attachment: {briefsToEmail.length} PDF brief(s) auto-packaged</span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      id="btn-cancel-send-email"
                      onClick={() => setBriefsToEmail([])}
                      className="px-3 py-1.5 rounded text-[10px] font-bold font-mono bg-slate-850 hover:bg-slate-800 text-slate-300 cursor-pointer uppercase transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-confirm-send-email"
                      disabled={sendingEmail}
                      onClick={() => handleSendEmail()}
                      className="flex items-center space-x-1.5 px-4 py-1.5 rounded text-[10px] font-bold font-mono bg-violet-600 hover:bg-violet-500 disabled:bg-violet-850 disabled:text-slate-400 text-white cursor-pointer uppercase transition-all shadow-sm"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Transmitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Transmit Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
