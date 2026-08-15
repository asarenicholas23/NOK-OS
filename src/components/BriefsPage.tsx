import React, { useState } from "react";
import { useBrand } from "../context/BrandContext";
import { apiFetch } from "../lib/apiBase";
import { Plus, FileText, ClipboardList, AlertCircle, Sparkles, UserCheck, Milestone, Loader2, Download, Mail, Send, LogOut, CheckCircle2, Eye, Presentation, Palette } from "lucide-react";
import { generateBriefPDF } from "../utils/pdfGenerator";
import { sendBriefEmail } from "../utils/gmailSender";
import { SlideDeckPreview } from "./SlideDeckPreview";
import { CreativeBriefCard, detectUnconfirmedData } from "./CreativeBriefCard";
import { PushBriefWorkflowModal } from "./PushBriefWorkflowModal";

export const BriefsPage: React.FC = () => {
  const { 
    activeBrand, 
    briefs, 
    directions,
    addCreativeBrief, 
    updateCreativeBrief, 
    deleteCreativeBrief, 
    addNotification,
    theme, 
    accentColor,
    gmailToken,
    gmailUser,
    connectGmail,
    disconnectGmail,
    addCampaign,
    addCalendarEvent
  } = useBrand();
  const [showForm, setShowForm] = useState(false);
  const [previewingSlidesId, setPreviewingSlidesId] = useState<string | null>(null);
  const [globalViewMode, setGlobalViewMode] = useState<"owner" | "designer">("owner");
  
  // Generation & loading states
  const [generatingBriefs, setGeneratingBriefs] = useState(false);
  const [generationCount, setGenerationCount] = useState<number>(5);

  // Form fields
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyMessage, setKeyMessage] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [status, setStatus] = useState<"Draft" | "Approved" | "In Progress">("Draft");
  const [campaignId, setCampaignId] = useState("");
  const [date, setDate] = useState("");
  const [sequencePosition, setSequencePosition] = useState("");
  const [proofPoint, setProofPoint] = useState("");
  const [formatSpec, setFormatSpec] = useState("");
  const [contentOutline, setContentOutline] = useState("");
  const [cta, setCta] = useState("");
  const [toneVisualRef, setToneVisualRef] = useState("");
  const [successMetric, setSuccessMetric] = useState("");
  const [approver, setApprover] = useState("");

  // Inline editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editObjective, setEditObjective] = useState("");
  const [editTargetAudience, setEditTargetAudience] = useState("");
  const [editKeyMessage, setEditKeyMessage] = useState("");
  const [editDeliverables, setEditDeliverables] = useState("");
  const [editCampaignId, setEditCampaignId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSequencePosition, setEditSequencePosition] = useState("");
  const [editProofPoint, setEditProofPoint] = useState("");
  const [editFormatSpec, setEditFormatSpec] = useState("");
  const [editContentOutline, setEditContentOutline] = useState("");
  const [editCta, setEditCta] = useState("");
  const [editToneVisualRef, setEditToneVisualRef] = useState("");
  const [editSuccessMetric, setEditSuccessMetric] = useState("");
  const [editApprover, setEditApprover] = useState("");

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";
  const approvedBriefs = briefs.filter(b => b.status === "Approved");

  // PDF, Gmail & Pipeline states
  const [selectedBriefIds, setSelectedBriefIds] = useState<string[]>([]);
  const [workflowModalBrief, setWorkflowModalBrief] = useState<any | null>(null);
  const [briefsToEmail, setBriefsToEmail] = useState<any[]>([]);
  const [recipientEmails, setRecipientEmails] = useState<string>("management@brand.com, designer@brand.com");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailBody, setEmailBody] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  const handleOpenEmailModal = (briefList: any[]) => {
    setBriefsToEmail(briefList);
    if (briefList.length === 1) {
      const brief = briefList[0];
      if (brief.status !== "Approved") {
        setEmailSubject(`[Approval Request] Creative Brief: ${brief.title}`);
        setEmailBody(
          `Hi ${brief.approver || "Team"},\n\nPlease review and approve the attached creative campaign brief for "${brief.title}" (${brief.status} status) under brand "${activeBrand?.name || "Global Standards"}".\n\nObjective:\n${brief.objective}\n\nTarget Audience:\n${brief.targetAudience}\n\nDeliverables:\n${brief.deliverables || "N/A"}\n\nAssigned Approver:\n${brief.approver || "Design & Marketing Lead"}\n\nPlease reply with your approval or any requested changes so we can finalize execution.\n\nBest regards,\nCreative Briefs Desk`
        );
      } else {
        setEmailSubject(`[Approved Creative Brief] ${brief.title}`);
        setEmailBody(
          `Hi,\n\nPlease find attached the fully approved campaign creative brief for "${brief.title}" under the brand "${activeBrand?.name || "Global Standards"}".\n\nObjective:\n${brief.objective}\n\nTarget Audience:\n${brief.targetAudience}\n\nDeliverables:\n${brief.deliverables || "N/A"}\n\nBest regards,\nCreative Briefs Desk`
        );
      }
    } else {
      const hasUnapproved = briefList.some(b => b.status !== "Approved");
      if (hasUnapproved) {
        setEmailSubject(`[Approval Request Pack] ${briefList.length} Creative Brief Specs for Review`);
        setEmailBody(
          `Hi,\n\nPlease review the attached ${briefList.length} campaign creative briefs under brand "${activeBrand?.name || "Global Standards"}" to grant approval.\n\nBriefs Included:\n${briefList.map((b, i) => `${i + 1}. ${b.title} [Status: ${b.status} | Approver: ${b.approver || "Team"}]`).join("\n")}\n\nPlease review the attached PDF specifications and reply with your approval.\n\nBest regards,\nCreative Briefs Desk`
        );
      } else {
        setEmailSubject(`[Bulk Approved Creative Briefs] ${briefList.length} Campaign Specifications`);
        setEmailBody(
          `Hi,\n\nPlease find attached the ${briefList.length} approved campaign creative briefs under the brand "${activeBrand?.name || "Global Standards"}".\n\nBriefs Included:\n${briefList.map((b, i) => `${i + 1}. ${b.title}`).join("\n")}\n\nBest regards,\nCreative Briefs Desk`
        );
      }
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
        const fileName = `Brief_${brief.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        return { pdfBase64, fileName };
      });

      await sendBriefEmail(
        gmailToken,
        emails,
        emailSubject,
        emailBody,
        attachments
      );

      const hasUnapproved = briefsToEmail.some(b => b.status !== "Approved");

      addNotification(
        hasUnapproved ? "Approval Request Transmitted" : "Email Transmitted",
        hasUnapproved 
          ? `Sent approval request with PDF attachment(s) for ${briefsToEmail.length} brief(s) to ${emails.join(", ")}!`
          : `Successfully sent ${briefsToEmail.length} brief(s) as PDF attachments to ${emails.join(", ")}!`,
        "success"
      );
      
      setBriefsToEmail([]);
      setSelectedBriefIds([]); // Clear selection upon successful send
    } catch (err: any) {
      console.error("Email send error:", err);
      addNotification(
        "Email Dispatch Failed",
        err.message || "Failed to transmit email via Google API.",
        "warning"
      );
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadPDF = (brief: any) => {
    try {
      const doc = generateBriefPDF(brief, activeBrand?.name, activeBrand || undefined);
      const fileName = `Brief_${brief.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      doc.save(fileName);
      addNotification(
        "PDF Downloaded",
        `"${brief.title}" PDF successfully downloaded to your local device.`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      addNotification("Download Failed", "Could not generate local PDF asset.", "warning");
    }
  };

  const sendBriefToQueueAndCalendar = async (brief: any) => {
    try {
      // 1. Create campaign queue item
      const content = `Objective:\n${brief.objective}\n\nTarget Audience:\n${brief.targetAudience}\n\nDeliverables:\n${brief.deliverables || "N/A"}`;
      
      // Schedule it 3 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const dateString = futureDate.toISOString().split('T')[0];
      const scheduledTime = `${dateString}T10:00`;

      await addCampaign({
        title: brief.title,
        channel: "LinkedIn", // Default channel
        status: "scheduled",
        scheduledTime,
        content,
        metrics: {
          estimatedReach: 20000,
          engagementRate: 5.0
        }
      });

      // 2. Create Content Calendar Event
      await addCalendarEvent({
        title: `[Campaign] ${brief.title}`,
        date: dateString,
        type: "Campaign",
        status: "Planned",
        notes: `Creative brief key message: ${brief.keyMessage}`
      });

      addNotification(
        "Synced to Pipeline",
        `"${brief.title}" has been successfully added to the Campaign Queue & Content Calendar!`,
        "success"
      );
    } catch (err) {
      console.error("Failed to sync brief to pipeline:", err);
      addNotification("Sync Failed", `Could not place "${brief.title}" in the campaign pipeline.`, "warning");
    }
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
        status,
        campaignId: campaignId || `MKT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        date: date || new Date().toLocaleDateString(),
        sequencePosition: sequencePosition || "Campaign 1 of 1",
        proofPoint: proofPoint || "PLACEHOLDER — needs real data before publishing",
        formatSpec: formatSpec || "Platform: LinkedIn | Format: Native document post (carousel) | Dimensions: 1080 x 1350 px, portrait (4:5) | Slide Count: 7 slides",
        contentOutline: contentOutline || "1. Cover hook intro | 2. Present core action framework | 3. Closing/CTA slide",
        cta: cta || "Comment 'STRATEGY' below to get the template",
        toneVisualRef: toneVisualRef || "Tone: direct, confident. Visual: solid brand color background with display typography.",
        successMetric: successMetric || ">= 2.5% engagement rate",
        approver: approver || "Osei"
      });
      setTitle("");
      setObjective("");
      setTargetAudience("");
      setKeyMessage("");
      setDeliverables("");
      setCampaignId("");
      setDate("");
      setSequencePosition("");
      setProofPoint("");
      setFormatSpec("");
      setContentOutline("");
      setCta("");
      setToneVisualRef("");
      setSuccessMetric("");
      setApprover("");
      setShowForm(false);
    } catch (err) {
      console.error("Error creating creative brief:", err);
    }
  };

  const handleGenerateBriefsFromDirections = async () => {
    setGeneratingBriefs(true);
    try {
      const approvedDirections = directions.filter(d => d.status === "Approved");
      const sourceDirections = approvedDirections.length > 0 ? approvedDirections : directions;
      if (sourceDirections.length === 0) {
        throw new Error("No brand directions found. Please create or generate brand positioning directions first.");
      }

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
          approvedDirections: sourceDirections,
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
          status: "Draft",
          campaignId: item.campaignId,
          date: item.date,
          sequencePosition: item.sequencePosition,
          proofPoint: item.proofPoint,
          formatSpec: item.formatSpec,
          contentOutline: item.contentOutline,
          cta: item.cta,
          toneVisualRef: item.toneVisualRef,
          successMetric: item.successMetric,
          approver: item.approver
        });
      }

      addNotification(
        "Content Briefs Synthesized",
        `Drafted ${generatedBriefs.length} creative briefs from approved brand directions!`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      addNotification("Synthesis Interrupted", err.message || "Failed to communicate with AI generation pipeline.", "warning");
    } finally {
      setGeneratingBriefs(false);
    }
  };

  const getStatusBadge = (st: typeof status) => {
    switch (st) {
      case "Approved":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "In Progress":
        if (activeColor === "emerald") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        if (activeColor === "rose") return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
        if (activeColor === "amber") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
      case "Draft":
        return "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700";
    }
  };

  return (
    <div 
      id="briefs-view" 
      className={`space-y-8 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 gap-4">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Creative Briefs Desk
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Author and manage active creative campaign requirements for <strong className={getBrandTextColor()}>{activeBrand ? activeBrand.name : "active brand"}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-auto">
          {/* Generation count selector */}
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

          {/* AI Generator Button */}
          <button
            id="btn-generate-briefs-from-directions"
            onClick={handleGenerateBriefsFromDirections}
            disabled={generatingBriefs}
            className={`px-4 py-2 border rounded-lg font-mono text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              generatingBriefs
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
                  Generate Briefs from Directions 
                  {directions.filter(d => d.status === "Approved").length > 0 
                    ? ` (${directions.filter(d => d.status === "Approved").length} Approved)` 
                    : " (All)"}
                </span>
              </>
            )}
          </button>

          <button
            id="btn-trigger-add-brief"
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-md shadow-md transition-colors font-mono cursor-pointer ${
              showForm ? "bg-rose-600 hover:bg-rose-500 text-white" : getBrandBgButton()
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showForm ? "Cancel Brief" : "Create Brief"}</span>
          </button>
        </div>
      </div>

      {/* Gmail Authorization Status Banner */}
      <div 
        id="gmail-connection-banner"
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
          isDark 
            ? "bg-slate-900/40 border-border" 
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${gmailToken ? "bg-emerald-500/10 text-emerald-500" : "bg-violet-500/10 text-violet-500"}`}>
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono tracking-wide uppercase">
              Gmail Dispatch Integration
            </h4>
            <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {gmailToken 
                ? `Authorized as ${gmailUser?.email || "Google User"}. Approved briefs can be transmitted directly as PDFs.`
                : "Authorize your Gmail account to enable sending approved briefs to your management and design team."}
            </p>
            {!gmailToken && typeof window !== "undefined" && window.self !== window.top && (
              <p className="text-[10px] text-amber-500 font-medium mt-1.5 flex items-center gap-1 bg-amber-500/10 p-1 px-2 rounded border border-amber-500/20 max-w-xl">
                <span>⚠️ Preview Mode Notice: If the authorization popup fails, please open this app in a <strong>New Tab</strong> (using the top-right icon) to sign in safely.</span>
              </p>
            )}
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

      {/* Bulk Operations Bar */}
      {briefs.length > 0 && (
        <div 
          id="bulk-briefs-operations-bar"
          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-250 ${
            selectedBriefIds.length > 0 
              ? "bg-violet-600/10 border-violet-500/40 animate-in fade-in zoom-in-95" 
              : isDark 
                ? "bg-slate-900/40 border-border" 
                : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg ${selectedBriefIds.length > 0 ? "bg-violet-600 text-white" : "bg-slate-500/10 text-slate-400"}`}>
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold font-mono tracking-wide uppercase flex items-center gap-2">
                Creative Briefs Dispatch & Approval Pipeline
                {selectedBriefIds.length > 0 && (
                  <span className="bg-violet-600 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">
                    {selectedBriefIds.length} Selected
                  </span>
                )}
              </h4>
              <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {selectedBriefIds.length > 0 
                  ? selectedBriefIds.length === 1 
                    ? "1 brief selected. You can download its PDF, send via Gmail, or perform actions below."
                    : `${selectedBriefIds.length} briefs selected. Choose a bulk action to export, email, or sync.`
                  : "Click 'Select' on any brief card below to choose individual briefs, or use 'Select All'."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-select-all-briefs"
              onClick={() => {
                if (selectedBriefIds.length === briefs.length) {
                  setSelectedBriefIds([]);
                } else {
                  setSelectedBriefIds(briefs.map(b => b.id));
                }
              }}
              className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded-lg border transition-all cursor-pointer uppercase ${
                selectedBriefIds.length === briefs.length
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                  : isDark 
                    ? "border-border bg-slate-950/40 text-slate-300 hover:text-white hover:bg-slate-900" 
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {selectedBriefIds.length === briefs.length ? "Deselect All" : `Select All (${briefs.length})`}
            </button>

            {selectedBriefIds.length > 0 && selectedBriefIds.length < briefs.length && (
              <button
                id="btn-clear-selected-briefs"
                onClick={() => setSelectedBriefIds([])}
                className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded-lg border transition-all cursor-pointer uppercase ${
                  isDark 
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" 
                    : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                Clear Selection
              </button>
            )}

            {selectedBriefIds.length > 0 && (
              <>
                <button
                  id="btn-bulk-download-pdf"
                  onClick={() => {
                    const selectedList = briefs.filter(b => selectedBriefIds.includes(b.id));
                    selectedList.forEach(brief => handleDownloadPDF(brief));
                    addNotification(
                      "Download Issued",
                      selectedList.length === 1
                        ? `Exported PDF for "${selectedList[0].title}".`
                        : `Exported ${selectedList.length} Campaign PDFs sequentially.`,
                      "success"
                    );
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold font-mono bg-violet-600 hover:bg-violet-500 text-white rounded-lg cursor-pointer transition-all shadow-sm uppercase"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{selectedBriefIds.length === 1 ? "Download PDF" : `Bulk Download (${selectedBriefIds.length})`}</span>
                </button>

                <button
                  id="btn-bulk-email-pdf"
                  onClick={() => {
                    const selectedList = briefs.filter(b => selectedBriefIds.includes(b.id));
                    handleOpenEmailModal(selectedList);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold font-mono bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer transition-all shadow-sm uppercase"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>
                    {briefs.filter(b => selectedBriefIds.includes(b.id)).some(b => b.status !== "Approved")
                      ? `Request Approval / Email (${selectedBriefIds.length})`
                      : selectedBriefIds.length === 1 ? "Email PDF" : `Bulk Email (${selectedBriefIds.length})`}
                  </span>
                </button>

                {briefs.filter(b => selectedBriefIds.includes(b.id)).some(b => b.status === "Approved") && (
                  <button
                    id="btn-bulk-sync-to-pipeline"
                    onClick={async () => {
                      const selectedList = briefs.filter(b => selectedBriefIds.includes(b.id) && b.status === "Approved");
                      for (const brief of selectedList) {
                        await sendBriefToQueueAndCalendar(brief);
                      }
                      setSelectedBriefIds([]);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold font-mono bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer transition-all shadow-sm uppercase"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Approved to Queue</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Brief creation form */}
      {showForm && (
        <div 
          id="brief-form-card" 
          className={`border rounded-xl p-6 shadow-xl animate-in slide-in-from-top-3 duration-200 ${
            isDark ? "bg-card border-border/80" : "bg-white border-slate-200"
          }`}
        >
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center">
            <Sparkles className={`w-3.5 h-3.5 mr-2 ${getBrandTextColor()}`} />
            Initialize Creative Brief Spec
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
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Status Level</label>
                <select
                  id="brief-input-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="Draft">Draft Mode</option>
                  <option value="In Progress">In Progress Pipeline</option>
                  <option value="Approved">Approved for Release</option>
                </select>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Deliverables Scope</label>
                <textarea
                  id="brief-input-deliverables"
                  rows={2}
                  placeholder="e.g., 3x LinkedIn graphics, 1x brand performance report..."
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Campaign ID</label>
                <input
                  type="text"
                  placeholder="e.g., KNTENEVA-R1"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Campaign Date</label>
                <input
                  type="text"
                  placeholder="e.g., 7/1/2026"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Sequence Position</label>
                <input
                  type="text"
                  placeholder="e.g., Campaign 2 of 5"
                  value={sequencePosition}
                  onChange={(e) => setSequencePosition(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Proof Point / Data Source</label>
                <textarea
                  rows={2}
                  placeholder="Provide research case or check 'PLACEHOLDER — needs real data before publishing' if unsure..."
                  value={proofPoint}
                  onChange={(e) => setProofPoint(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Format & Technical Spec</label>
                <textarea
                  rows={2}
                  placeholder="Platform, file aspect ratio, slide count limits, duration limits..."
                  value={formatSpec}
                  onChange={(e) => setFormatSpec(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Content Outline (Beat-by-Beat)</label>
                <textarea
                  rows={2}
                  placeholder="slide 1: ... | slide 2: ... | slide 3: ... (one line per slide/beat)"
                  value={contentOutline}
                  onChange={(e) => setContentOutline(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Call to Action (CTA)</label>
                <textarea
                  rows={2}
                  placeholder="Comment 'STRATEGY' below to get template link..."
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Tone & Visual Reference</label>
                <input
                  type="text"
                  placeholder="e.g., Bold, direct, contrarian. 1080x1350px slate background"
                  value={toneVisualRef}
                  onChange={(e) => setToneVisualRef(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Success Metric / Target</label>
                <input
                  type="text"
                  placeholder="e.g., >= 2.5% engagement rate"
                  value={successMetric}
                  onChange={(e) => setSuccessMetric(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Approver Sign-Off</label>
                <input
                  type="text"
                  placeholder="e.g., Osei"
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="brief-submit-action"
                type="submit"
                className={`px-4 py-2 text-xs font-semibold rounded-md shadow-md font-mono cursor-pointer ${getBrandBgButton()}`}
              >
                Execute Brief Registry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Global View Mode Switcher */}
      <div 
        id="global-view-mode-panel"
        className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all ${
          isDark ? "bg-[#15151A] border-white/10" : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${
            globalViewMode === "owner" 
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
              : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
          }`}>
            {globalViewMode === "owner" ? <UserCheck className="w-5 h-5" /> : <Palette className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-xs font-bold font-mono tracking-wide uppercase">
                {globalViewMode === "owner" ? "Owner View: Rapid 10-Second Approval" : "Designer View: Technical Execution Specs"}
              </h4>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase">
                Global Brief Template
              </span>
            </div>
            <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {globalViewMode === "owner"
                ? "Showing plain language objective, core message, placement, and unconfirmed data flags. Hidden: technical specs, personas & proof points."
                : "Showing exact approved copy, dimensions, beat layout, and brand style guides. Hidden: strategic rationale & persona narrative."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider hidden sm:inline">
            Default View:
          </span>
          <div className={`p-1 rounded-xl border flex items-center ${
            isDark ? "bg-[#101014] border-white/10" : "bg-slate-100 border-slate-300"
          }`}>
            <button
              id="btn-global-view-owner"
              onClick={() => setGlobalViewMode("owner")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                globalViewMode === "owner"
                  ? isDark 
                    ? "bg-[#252530] text-amber-300 shadow-xs border border-amber-400/30" 
                    : "bg-white text-amber-800 shadow-xs border border-amber-300"
                  : isDark 
                    ? "text-slate-400 hover:text-slate-200" 
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Owner View</span>
            </button>
            <button
              id="btn-global-view-designer"
              onClick={() => setGlobalViewMode("designer")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                globalViewMode === "designer"
                  ? isDark 
                    ? "bg-[#252530] text-violet-300 shadow-xs border border-violet-400/30" 
                    : "bg-white text-violet-800 shadow-xs border border-violet-300"
                  : isDark 
                    ? "text-slate-400 hover:text-slate-200" 
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Designer View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of existing briefs */}
      <div id="briefs-list-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {briefs.map((brief) => {
          const isEditing = editingId === brief.id;

          const startEditing = () => {
            setEditingId(brief.id);
            setEditTitle(brief.title);
            setEditObjective(brief.objective);
            setEditTargetAudience(brief.targetAudience);
            setEditKeyMessage(brief.keyMessage);
            setEditDeliverables(brief.deliverables);
            setEditCampaignId(brief.campaignId || "");
            setEditDate(brief.date || "");
            setEditSequencePosition(brief.sequencePosition || "");
            setEditProofPoint(brief.proofPoint || "");
            setEditFormatSpec(brief.formatSpec || "");
            setEditContentOutline(brief.contentOutline || "");
            setEditCta(brief.cta || "");
            setEditToneVisualRef(brief.toneVisualRef || "");
            setEditSuccessMetric(brief.successMetric || "");
            setEditApprover(brief.approver || "");
          };

          const cancelEditing = () => {
            setEditingId(null);
          };

          const saveEditing = async () => {
            if (!editTitle || !editObjective || !editTargetAudience || !editKeyMessage) return;
            try {
              await updateCreativeBrief(brief.id, {
                title: editTitle,
                objective: editObjective,
                targetAudience: editTargetAudience,
                keyMessage: editKeyMessage,
                deliverables: editDeliverables,
                campaignId: editCampaignId,
                date: editDate,
                sequencePosition: editSequencePosition,
                proofPoint: editProofPoint,
                formatSpec: editFormatSpec,
                contentOutline: editContentOutline,
                cta: editCta,
                toneVisualRef: editToneVisualRef,
                successMetric: editSuccessMetric,
                approver: editApprover
              });
              setEditingId(null);
              addNotification("Brief Updated", `Successfully saved changes to "${editTitle}".`, "success");
            } catch (err) {
              console.error("Failed to save brief edit:", err);
            }
          };

          const handleApprove = async () => {
            try {
              await updateCreativeBrief(brief.id, { status: "Approved" });
              await sendBriefToQueueAndCalendar(brief);
              addNotification("Brief Approved", `"${brief.title}" has been approved for execution.`, "success");
            } catch (err) {
              console.error("Failed to approve brief:", err);
            }
          };

          const handleRequestChanges = async (briefToChange: any, notes: string) => {
            try {
              await updateCreativeBrief(briefToChange.id, { status: "Draft" });
              addNotification(
                "Change Request Logged",
                `Feedback for "${briefToChange.title}": ${notes}`,
                "warning"
              );
            } catch (err) {
              console.error("Failed to update brief status:", err);
            }
          };

          const handleDelete = async () => {
            if (window.confirm(`Are you sure you want to delete "${brief.title}"?`)) {
              try {
                await deleteCreativeBrief(brief.id);
                addNotification("Brief Deleted", `"${brief.title}" was removed.`, "info");
              } catch (err) {
                console.error("Failed to delete brief:", err);
              }
            }
          };

          const isSelected = selectedBriefIds.includes(brief.id);

          if (isEditing) {
            return (
              <div
                key={brief.id}
                className={`border rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-md ${
                  isDark ? "bg-[#1C1C22] border-violet-500/40" : "bg-white border-violet-300"
                }`}
              >
                <div className="space-y-4 w-full">
                  <div className="text-xs font-mono text-violet-400 border-b border-violet-500/20 pb-2 uppercase font-bold tracking-wider flex items-center justify-between">
                    <span>Edit Creative Brief Metadata</span>
                    <span className="text-[10px] text-slate-400">ID: {brief.id.substring(0, 8)}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Brief Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Objective (What this asset is for)</label>
                      <textarea
                        rows={2}
                        value={editObjective}
                        onChange={(e) => setEditObjective(e.target.value)}
                        className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Target Audience</label>
                      <textarea
                        rows={2}
                        value={editTargetAudience}
                        onChange={(e) => setEditTargetAudience(e.target.value)}
                        className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Core Message (Approved Copy)</label>
                      <textarea
                        rows={2}
                        value={editKeyMessage}
                        onChange={(e) => setEditKeyMessage(e.target.value)}
                        className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Scope / Deliverables</label>
                      <input
                        type="text"
                        value={editDeliverables}
                        onChange={(e) => setEditDeliverables(e.target.value)}
                        className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Campaign ID</label>
                        <input
                          type="text"
                          value={editCampaignId}
                          onChange={(e) => setEditCampaignId(e.target.value)}
                          className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Date</label>
                        <input
                          type="text"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Sequence Position</label>
                        <input
                          type="text"
                          value={editSequencePosition}
                          onChange={(e) => setEditSequencePosition(e.target.value)}
                          className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Approver</label>
                        <input
                          type="text"
                          value={editApprover}
                          onChange={(e) => setEditApprover(e.target.value)}
                          className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Proof Point / Data Source</label>
                      <textarea
                        rows={1}
                        value={editProofPoint}
                        onChange={(e) => setEditProofPoint(e.target.value)}
                        className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Format & Tech Spec</label>
                      <input
                        type="text"
                        value={editFormatSpec}
                        onChange={(e) => setEditFormatSpec(e.target.value)}
                        className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Content Outline</label>
                      <textarea
                        rows={2}
                        value={editContentOutline}
                        onChange={(e) => setEditContentOutline(e.target.value)}
                        className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Call to Action (CTA)</label>
                      <input
                        type="text"
                        value={editCta}
                        onChange={(e) => setEditCta(e.target.value)}
                        className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Tone & Visual Reference</label>
                      <input
                        type="text"
                        value={editToneVisualRef}
                        onChange={(e) => setEditToneVisualRef(e.target.value)}
                        className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Success Metric</label>
                      <input
                        type="text"
                        value={editSuccessMetric}
                        onChange={(e) => setEditSuccessMetric(e.target.value)}
                        className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-white/10">
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 rounded-xl text-xs font-mono bg-slate-750 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEditing}
                      className="px-4 py-2 rounded-xl text-xs font-mono bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer uppercase shadow-md"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <CreativeBriefCard
              key={brief.id}
              brief={brief}
              activeBrand={activeBrand}
              theme={theme}
              activeColor={activeColor}
              isSelected={isSelected}
              onToggleSelect={(id, selected) => {
                if (selected) {
                  setSelectedBriefIds(prev => [...prev, id]);
                } else {
                  setSelectedBriefIds(prev => prev.filter(item => item !== id));
                }
              }}
              onApprove={handleApprove}
              onRequestChanges={handleRequestChanges}
              onEdit={startEditing}
              onDelete={handleDelete}
              onDownloadPDF={handleDownloadPDF}
              onEmailModal={(b) => handleOpenEmailModal([b])}
              onSlideDeckPreview={(id) => setPreviewingSlidesId(id)}
              onSyncToPipeline={(briefToPush) => {
                setWorkflowModalBrief(briefToPush);
              }}
              gmailToken={gmailToken}
              globalViewMode={globalViewMode}
            />
          );
        })}

        {briefs.length === 0 && (
          <div className="col-span-full text-center py-16 border rounded-xl border-dashed border-border text-slate-500 text-xs font-mono">
            No creative briefs logged for this brand. Click "Create Brief" to register your first.
          </div>
        )}
      </div>

      {/* Push Creative Brief to Workflow Modal (Campaign / Weekly / Hybrid) */}
      {workflowModalBrief && (
        <PushBriefWorkflowModal
          brief={workflowModalBrief}
          activeBrand={activeBrand}
          theme={theme}
          activeColor={activeColor}
          onClose={() => setWorkflowModalBrief(null)}
          onSuccess={() => {
            setWorkflowModalBrief(null);
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
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider">
                    Dispatch Creative Brief via Gmail
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    MIME Multi-part PDF Attachment Pack
                  </p>
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
                {typeof window !== "undefined" && window.self !== window.top && (
                  <p className="text-[11px] text-amber-500 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 max-w-sm mx-auto leading-relaxed">
                    ⚠️ Notice: Browser security restricts login popups inside preview iframes. If the popup fails, please open the app in a <strong>New Tab</strong> using the top-right preview icon to sign in.
                  </p>
                )}
                <button
                  id="btn-modal-connect-gmail"
                  onClick={() => {
                    connectGmail();
                  }}
                  className="flex items-center space-x-2 mx-auto px-4 py-2 text-xs font-bold font-mono bg-violet-600 hover:bg-violet-500 text-white rounded-lg cursor-pointer transition-all uppercase"
                >
                  <Mail className="w-4 h-4" />
                  <span>Authorize Google Account</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {briefsToEmail.some(b => b.status !== "Approved") ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-center space-x-2 text-[11px] text-amber-400 font-mono">
                    <UserCheck className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Approval Request Mode: Transmitting unapproved brief(s) with PDF specs attached for sign-off.</span>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 flex items-center space-x-2 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Approved Spec Dispatch: Transmitting finalized creative brief PDF(s) to team.</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">
                    Recipients (Comma separated) *
                  </label>
                  <input
                    id="email-input-recipients"
                    type="text"
                    className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-1 text-xs font-mono ${
                      isDark 
                        ? "bg-slate-950 border-border focus:ring-violet-500 text-slate-200" 
                        : "bg-white border-slate-200 focus:ring-violet-500 text-slate-700"
                    }`}
                    placeholder="e.g., manager@brand.com, designer@brand.com"
                    value={recipientEmails}
                    onChange={(e) => setRecipientEmails(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">
                    Email Subject Line *
                  </label>
                  <input
                    id="email-input-subject"
                    type="text"
                    required
                    className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-1 text-xs ${
                      isDark 
                        ? "bg-slate-950 border-border focus:ring-violet-500 text-slate-200" 
                        : "bg-white border-slate-200 focus:ring-violet-500 text-slate-700"
                    }`}
                    placeholder="Brief Status update"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">
                    Email Body Copy
                  </label>
                  <textarea
                    id="email-input-body"
                    rows={6}
                    className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-1 text-xs leading-relaxed ${
                      isDark 
                        ? "bg-slate-950 border-border focus:ring-violet-500 text-slate-200" 
                        : "bg-white border-slate-200 focus:ring-violet-500 text-slate-700"
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
                      onClick={() => {
                        handleSendEmail();
                      }}
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

      {/* Visual Slide Deck Modal Preview */}
      {previewingSlidesId && (() => {
        const briefToPreview = briefs.find(b => b.id === previewingSlidesId);
        if (!briefToPreview) return null;
        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className={`relative max-w-4xl w-full rounded-2xl border flex flex-col max-h-[90vh] shadow-2xl ${
              isDark ? "bg-[#101012] border-border" : "bg-white border-slate-200"
            }`}>
              {/* Modal Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Presentation className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Visual Slide Deck Preview
                  </span>
                </div>
                <button
                  onClick={() => setPreviewingSlidesId(null)}
                  className="text-xs font-mono text-slate-500 hover:text-slate-200 cursor-pointer p-1"
                >
                  ✕ Close
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="mb-4">
                  <span className="text-[9px] font-mono uppercase bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/15">
                    {briefToPreview.campaignId || "CAMPAIGN-PREVIEW"}
                  </span>
                  <h3 className="text-base font-bold text-slate-200 mt-1.5 leading-snug">
                    {briefToPreview.title}
                  </h3>
                </div>
                
                <div className="border border-border/60 rounded-xl overflow-hidden bg-slate-950/20 p-4">
                  <SlideDeckPreview 
                    brief={briefToPreview}
                    brandName={activeBrand?.name || "Client Brand"}
                    brandColor={activeColor}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border flex justify-end">
                <button
                  onClick={() => setPreviewingSlidesId(null)}
                  className="px-4 py-2 bg-slate-900 border border-border hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
