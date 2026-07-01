import React, { useState } from "react";
import { useBrand } from "../context/BrandContext";
import { Plus, FileText, ClipboardList, AlertCircle, Sparkles, UserCheck, Milestone, Loader2, Download, Mail, Send, LogOut, CheckCircle2 } from "lucide-react";
import { generateBriefPDF } from "../utils/pdfGenerator";
import { sendBriefEmail } from "../utils/gmailSender";

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
  const [briefsToEmail, setBriefsToEmail] = useState<any[]>([]);
  const [recipientEmails, setRecipientEmails] = useState<string>("management@brand.com, designer@brand.com");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailBody, setEmailBody] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  const handleOpenEmailModal = (briefList: any[]) => {
    setBriefsToEmail(briefList);
    if (briefList.length === 1) {
      const brief = briefList[0];
      setEmailSubject(`[Approved Creative Brief] ${brief.title}`);
      setEmailBody(
        `Hi,\n\nPlease find attached the fully approved campaign creative brief for "${brief.title}" under the brand "${activeBrand?.name || "Global Standards"}".\n\nObjective:\n${brief.objective}\n\nTarget Audience:\n${brief.targetAudience}\n\nDeliverables:\n${brief.deliverables || "N/A"}\n\nBest regards,\nCreative Briefs Desk`
      );
    } else {
      setEmailSubject(`[Bulk Approved Creative Briefs] ${briefList.length} Campaign Specifications`);
      setEmailBody(
        `Hi,\n\nPlease find attached the ${briefList.length} approved campaign creative briefs under the brand "${activeBrand?.name || "Global Standards"}".\n\nBriefs Included:\n${briefList.map((b, i) => `${i + 1}. ${b.title}`).join("\n")}\n\nBest regards,\nCreative Briefs Desk`
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
        const doc = generateBriefPDF(brief, activeBrand?.name);
        const pdfBase64 = (doc as any).output("base64") as string;
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

      addNotification(
        "Email Transmitted",
        `Successfully sent ${briefsToEmail.length} brief(s) as PDF attachments to ${emails.join(", ")}!`,
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
      const doc = generateBriefPDF(brief, activeBrand?.name);
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

      const response = await fetch("/api/generate-briefs", {
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
          <div className="flex items-center space-x-1.5 border border-slate-800 bg-slate-950/40 px-2 py-1.5 rounded-lg">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Count</span>
            <select
              id="briefs-generation-count-select"
              value={generationCount}
              onChange={(e) => setGenerationCount(Number(e.target.value))}
              className={`text-xs px-1.5 py-0.5 rounded border focus:outline-none focus:ring-1 font-mono cursor-pointer ${
                isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-700"
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
                  ? "bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700"
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
            ? "bg-slate-900/40 border-slate-850" 
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
      {approvedBriefs.length > 0 && (
        <div 
          id="bulk-briefs-operations-bar"
          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-250 ${
            selectedBriefIds.length > 0 
              ? "bg-violet-600/10 border-violet-500/40 animate-in fade-in zoom-in-95" 
              : isDark 
                ? "bg-slate-900/40 border-slate-850" 
                : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg ${selectedBriefIds.length > 0 ? "bg-violet-600 text-white" : "bg-slate-500/10 text-slate-400"}`}>
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold font-mono tracking-wide uppercase flex items-center gap-2">
                Approved Briefs Pipeline Operations
                {selectedBriefIds.length > 0 && (
                  <span className="bg-violet-600 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">
                    {selectedBriefIds.length} Selected
                  </span>
                )}
              </h4>
              <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {selectedBriefIds.length > 0 
                  ? "Select bulk command to execute on chosen creative briefings below." 
                  : "Check individual briefs below, or Select All to perform bulk operations."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-select-all-approved-briefs"
              onClick={() => {
                if (selectedBriefIds.length === approvedBriefs.length) {
                  setSelectedBriefIds([]);
                } else {
                  setSelectedBriefIds(approvedBriefs.map(b => b.id));
                }
              }}
              className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded-lg border transition-all cursor-pointer uppercase ${
                selectedBriefIds.length === approvedBriefs.length
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                  : isDark 
                    ? "border-slate-800 bg-slate-950/40 text-slate-300 hover:text-white hover:bg-slate-900" 
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {selectedBriefIds.length === approvedBriefs.length ? "Deselect All" : "Select All Approved"}
            </button>

            {selectedBriefIds.length > 0 && (
              <>
                <button
                  id="btn-bulk-download-pdf"
                  onClick={() => {
                    const selectedList = briefs.filter(b => selectedBriefIds.includes(b.id));
                    selectedList.forEach(brief => handleDownloadPDF(brief));
                    addNotification(
                      "Bulk Download Issued",
                      `Exported ${selectedList.length} Campaign PDFs sequentially.`,
                      "success"
                    );
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold font-mono bg-violet-600 hover:bg-violet-500 text-white rounded-lg cursor-pointer transition-all shadow-sm uppercase"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Bulk Download ({selectedBriefIds.length})</span>
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
                  <span>Bulk Email ({selectedBriefIds.length})</span>
                </button>

                <button
                  id="btn-bulk-sync-to-pipeline"
                  onClick={async () => {
                    const selectedList = briefs.filter(b => selectedBriefIds.includes(b.id));
                    for (const brief of selectedList) {
                      await sendBriefToQueueAndCalendar(brief);
                    }
                    setSelectedBriefIds([]);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold font-mono bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer transition-all shadow-sm uppercase"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Queue ({selectedBriefIds.length})</span>
                </button>
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
            isDark ? "bg-[#161616] border-slate-800/80" : "bg-white border-slate-200"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
            } catch (err) {
              console.error("Failed to save brief edit:", err);
            }
          };

          const handleApprove = async () => {
            try {
              await updateCreativeBrief(brief.id, { status: "Approved" });
              await sendBriefToQueueAndCalendar(brief);
            } catch (err) {
              console.error("Failed to approve brief:", err);
            }
          };

          const handleDelete = async () => {
            if (window.confirm("Are you sure you want to delete this brief?")) {
              try {
                await deleteCreativeBrief(brief.id);
              } catch (err) {
                console.error("Failed to delete brief:", err);
              }
            }
          };

          const isSelected = selectedBriefIds.includes(brief.id);

          return (
            <div
              key={brief.id}
              className={`border rounded-xl p-6 flex flex-col justify-between transition-all duration-200 shadow-md ${
                isSelected
                  ? "border-violet-500 ring-1 ring-violet-500/20 bg-violet-500/[0.02]"
                  : isDark 
                    ? "bg-[#161616] border-slate-800/80 hover:border-slate-700" 
                    : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              {isEditing ? (
                <div className="space-y-4 w-full">
                  <div className="text-xs font-mono text-slate-400 border-b pb-1.5 uppercase font-bold tracking-wider">
                    Edit Creative Brief
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Brief Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Objective</label>
                      <textarea
                        rows={2}
                        value={editObjective}
                        onChange={(e) => setEditObjective(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Target Audience</label>
                      <textarea
                        rows={2}
                        value={editTargetAudience}
                        onChange={(e) => setEditTargetAudience(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Key Message</label>
                      <textarea
                        rows={2}
                        value={editKeyMessage}
                        onChange={(e) => setEditKeyMessage(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Scope / Deliverables</label>
                      <input
                        type="text"
                        value={editDeliverables}
                        onChange={(e) => setEditDeliverables(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                          className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Date</label>
                        <input
                          type="text"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                          className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Approver</label>
                        <input
                          type="text"
                          value={editApprover}
                          onChange={(e) => setEditApprover(e.target.value)}
                          className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Format & Tech Spec</label>
                      <input
                        type="text"
                        value={editFormatSpec}
                        onChange={(e) => setEditFormatSpec(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Content Outline</label>
                      <textarea
                        rows={2}
                        value={editContentOutline}
                        onChange={(e) => setEditContentOutline(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Call to Action</label>
                      <input
                        type="text"
                        value={editCta}
                        onChange={(e) => setEditCta(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Tone & Visual Reference</label>
                      <input
                        type="text"
                        value={editToneVisualRef}
                        onChange={(e) => setEditToneVisualRef(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Success Metric</label>
                      <input
                        type="text"
                        value={editSuccessMetric}
                        onChange={(e) => setEditSuccessMetric(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 rounded text-[11px] font-mono bg-slate-700 hover:bg-slate-600 text-white font-semibold cursor-pointer uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEditing}
                      className="px-3 py-1.5 rounded text-[11px] font-mono bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer uppercase"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full justify-between">
                  <div>
                    {/* Header Row: Left badges, Right flat solid high-contrast buttons */}
                    <div className="flex justify-between items-center mb-4.5 gap-2">
                      <div className="flex items-center space-x-1.5 overflow-hidden">
                        {brief.status === "Approved" && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBriefIds(prev => [...prev, brief.id]);
                              } else {
                                setSelectedBriefIds(prev => prev.filter(id => id !== brief.id));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-850 text-violet-600 focus:ring-violet-500 cursor-pointer mr-1.5"
                            title="Select brief for bulk actions"
                          />
                        )}
                        <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border bg-violet-500/10 text-violet-500 border-violet-500/20 truncate`}>
                          Brand Brief
                        </span>
                        <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${getStatusBadge(brief.status as any)}`}>
                          {brief.status}
                        </span>
                      </div>

                      {/* Solid, flat actions exactly matching the screenshot style */}
                      <div className="flex items-center space-x-1 shrink-0">
                        {brief.status !== "Approved" && (
                          <button
                            id={`btn-approve-${brief.id}`}
                            onClick={handleApprove}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono px-2 py-1 rounded transition-colors uppercase font-bold cursor-pointer shrink-0"
                            title="Approve brief status"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          id={`btn-edit-${brief.id}`}
                          onClick={startEditing}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono px-2 py-1 rounded transition-colors uppercase font-bold cursor-pointer shrink-0"
                          title="Edit brief details"
                        >
                          Edit
                        </button>
                        <button
                          id={`btn-delete-${brief.id}`}
                          onClick={handleDelete}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono px-2 py-1 rounded transition-colors uppercase font-bold cursor-pointer shrink-0"
                          title="Delete creative brief"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-1.5 mb-3.5 text-[10px] font-mono text-slate-400">
                      <span className="bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
                        Campaign ID: {brief.campaignId || "N/A"}
                      </span>
                      <span className="bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
                        Date: {brief.date || "N/A"}
                      </span>
                      <span className="bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
                        Seq: {brief.sequencePosition || "Campaign 1 of 1"}
                      </span>
                    </div>

                    <h4 className={`text-base font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{brief.title}</h4>
                    
                    <div className="space-y-4 mt-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center">
                          <Milestone className="w-3 h-3 mr-1 text-violet-500" /> Campaign Objective
                        </span>
                        <p className={`leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{brief.objective}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center">
                          <UserCheck className="w-3 h-3 mr-1 text-violet-500" /> Target Audience
                        </span>
                        <p className={`leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{brief.targetAudience}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center">
                          <ClipboardList className="w-3 h-3 mr-1 text-violet-500" /> Core Positioning Copy / Key Message
                        </span>
                        <p className={`leading-relaxed italic ${isDark ? "text-slate-300" : "text-slate-600"} font-medium`}>"{brief.keyMessage}"</p>
                      </div>

                      {brief.proofPoint && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center">
                            ⚖️ Proof Point / Data Source
                          </span>
                          <p className={`leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{brief.proofPoint}</p>
                        </div>
                      )}

                      {brief.formatSpec && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center">
                            📐 Format & Technical Spec
                          </span>
                          <p className={`leading-relaxed font-mono text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>{brief.formatSpec}</p>
                        </div>
                      )}

                      {brief.contentOutline && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center">
                            📝 Content Outline (Beat-by-Beat)
                          </span>
                          <p className={`leading-relaxed whitespace-pre-line ${isDark ? "text-slate-300" : "text-slate-600"}`}>{brief.contentOutline}</p>
                        </div>
                      )}

                      {brief.cta && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center">
                            📣 Call to Action (CTA)
                          </span>
                          <p className={`leading-relaxed font-semibold text-emerald-500`}>{brief.cta}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-dashed border-slate-800/50">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">
                            🎨 Tone & Visual Reference
                          </span>
                          <p className={`text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>{brief.toneVisualRef || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">
                            📈 Success Metric / KPI
                          </span>
                          <p className={`text-[11px] font-mono font-semibold text-violet-400`}>{brief.successMetric || "N/A"}</p>
                        </div>
                      </div>

                      <div className="pt-1 text-[10px] font-mono text-slate-400 flex justify-between items-center bg-slate-900/40 p-2 rounded border border-slate-800/40">
                        <span>Approver: <strong className="text-slate-200">{brief.approver || "Osei"}</strong></span>
                        <span className="text-emerald-500 font-bold">✓ Ready for Execution</span>
                      </div>
                    </div>
                  </div>

                  {/* Campaign brief PDF / Email actions */}
                  <div className={`mt-6 pt-3.5 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono ${
                    isDark ? "border-slate-800/60" : "border-slate-150"
                  }`}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        id={`btn-pdf-download-${brief.id}`}
                        onClick={() => handleDownloadPDF(brief)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded border transition-all cursor-pointer ${
                          isDark 
                            ? "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white" 
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm"
                        }`}
                        title="Download Creative Brief as PDF file"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download PDF</span>
                      </button>

                      {brief.status === "Approved" && (
                        <>
                          <button
                            id={`btn-pdf-email-${brief.id}`}
                            onClick={() => handleOpenEmailModal([brief])}
                            className={`flex items-center space-x-1 px-2 py-1 rounded border transition-all cursor-pointer ${
                              gmailToken 
                                ? "bg-violet-600/10 border-violet-500/20 text-violet-400 hover:bg-violet-600/20" 
                                : "bg-slate-800/40 border-slate-700/30 text-slate-400 hover:bg-slate-800/60"
                            }`}
                            title="Send PDF copy via Gmail API"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Email via Gmail</span>
                          </button>

                          <button
                            id={`btn-pipeline-sync-${brief.id}`}
                            onClick={() => sendBriefToQueueAndCalendar(brief)}
                            className={`flex items-center space-x-1 px-2 py-1 rounded border transition-all cursor-pointer ${
                              isDark 
                                ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20" 
                                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title="Place in campaign queue & content calendar"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send to Queue</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end gap-0.5 text-slate-500 text-[9px]">
                      <span>Deliverables: {brief.deliverables}</span>
                      <span>ID: {brief.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {briefs.length === 0 && (
          <div className="col-span-full text-center py-16 border rounded-xl border-dashed border-slate-800 text-slate-500 text-xs font-mono">
            No creative briefs logged for this brand. Click "Create Brief" to register your first.
          </div>
        )}
      </div>

      {/* Gmail Email Modal */}
      {briefsToEmail.length > 0 && (
        <div 
          id="gmail-email-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div 
            id="gmail-email-modal-content"
            className={`w-full max-w-lg border rounded-xl shadow-2xl p-6 ${
              isDark ? "bg-[#111] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">
                    Recipients (Comma separated) *
                  </label>
                  <input
                    id="email-input-recipients"
                    type="text"
                    className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-1 text-xs font-mono ${
                      isDark 
                        ? "bg-slate-950 border-slate-850 focus:ring-violet-500 text-slate-200" 
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
                        ? "bg-slate-950 border-slate-850 focus:ring-violet-500 text-slate-200" 
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
                        ? "bg-slate-950 border-slate-850 focus:ring-violet-500 text-slate-200" 
                        : "bg-white border-slate-200 focus:ring-violet-500 text-slate-700"
                    }`}
                    placeholder="Enter message body..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-4">
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
    </div>
  );
};
