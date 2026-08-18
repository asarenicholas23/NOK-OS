import React, { useState, useEffect } from "react";
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Mail, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  CalendarDays,
  RefreshCw,
  AlertTriangle,
  Send,
  Loader2,
  Clock,
  Eye,
  ShieldAlert,
  Paperclip,
  CheckCheck,
  LogIn,
  Layers,
  MessageSquare
} from "lucide-react";
import { 
  Brand, 
  CreativeBrief, 
  CalendarShareLink,
  getOrCreateCalendarShareLink,
  revokeCalendarShareLink,
  regenerateCalendarShareLink,
  recordShareLinkEmailSent
} from "../lib/firebase";
import { getCalendarPdfBase64, downloadCalendarPDF } from "../utils/pdfGenerator";
import { sendBriefEmail, buildApprovalEmailHtml } from "../utils/gmailSender";

interface ShareCalendarReviewModalProps {
  activeBrand: Brand | null;
  theme: string;
  briefs: CreativeBrief[];
  monthName: string;
  year: number;
  onClose: () => void;
  onOpenEmailModal?: () => void;
  gmailToken?: string | null;
  gmailUser?: any | null;
  connectGmail?: () => Promise<void> | Promise<string | null>;
  addNotification?: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void;
}

export const ShareCalendarReviewModal: React.FC<ShareCalendarReviewModalProps> = ({
  activeBrand,
  theme,
  briefs,
  monthName,
  year,
  onClose,
  gmailToken,
  gmailUser,
  connectGmail,
  addNotification
}) => {
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<"link" | "email">("link");

  // Share link state from Firestore
  const [shareLink, setShareLink] = useState<CalendarShareLink | null>(null);
  const [loadingLink, setLoadingLink] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Email form state
  const [recipientEmail, setRecipientEmail] = useState(
    activeBrand?.domain ? `client@${activeBrand.domain}` : ""
  );
  const [emailSubject, setEmailSubject] = useState(
    `${activeBrand?.name || "Brand"} — Content Calendar Review & Approval (${monthName} ${year})`
  );
  const [customNote, setCustomNote] = useState(
    "Hi there! Please review our upcoming social media and campaign content briefs. You can approve individual days or request revisions with one click."
  );
  const [attachPdf, setAttachPdf] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const monthIndex = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ].indexOf(monthName.toLowerCase());
  const actualMonth = monthIndex >= 0 ? monthIndex : new Date().getMonth();

  // Load or generate share token
  useEffect(() => {
    let isMounted = true;
    async function loadLink() {
      if (!activeBrand) return;
      try {
        setLoadingLink(true);
        setLinkError(null);
        const link = await getOrCreateCalendarShareLink(
          activeBrand.id,
          actualMonth,
          year,
          "month",
          undefined,
          `${monthName} ${year}`,
          activeBrand.name
        );
        if (isMounted) {
          setShareLink(link);
        }
      } catch (err: any) {
        console.error("Error loading share link:", err);
        if (isMounted) {
          setShareLink(null);
          setLinkError(
            err?.message || "Could not create the review link. Please try again or contact support."
          );
        }
      } finally {
        if (isMounted) setLoadingLink(false);
      }
    }

    loadLink();
    return () => {
      isMounted = false;
    };
  }, [activeBrand, actualMonth, year, monthName]);

  const handleRetryLoadLink = async () => {
    if (!activeBrand) return;
    try {
      setLoadingLink(true);
      setLinkError(null);
      const link = await getOrCreateCalendarShareLink(
        activeBrand.id,
        actualMonth,
        year,
        "month",
        undefined,
        `${monthName} ${year}`,
        activeBrand.name
      );
      setShareLink(link);
    } catch (err: any) {
      console.error("Error loading share link:", err);
      setShareLink(null);
      setLinkError(
        err?.message || "Could not create the review link. Please try again or contact support."
      );
    } finally {
      setLoadingLink(false);
    }
  };

  const shareUrl = shareLink ? `${window.location.origin}/review/${shareLink.token}` : "";

  const proposedCount = briefs.filter((b) => b.status === "Proposed").length;
  const approvedCount = briefs.filter((b) => b.status === "Approved").length;
  const changesRequestedCount = briefs.filter((b) => b.status === "Changes Requested").length;

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyEmailDraft = () => {
    if (!shareUrl) return;
    const draftText = `Subject: ${emailSubject}\n\nHi there,\n\n${customNote}\n\nReview and approve the content schedule in the live portal:\n${shareUrl}\n\n• 1-Click approvals on scheduled dates\n• Leave revision notes directly on posts\n• Zero login required\n\nBest regards,\n${activeBrand?.name || "Creative Team"}`;
    navigator.clipboard.writeText(draftText);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  const handleOpenDefaultMailer = () => {
    if (!shareUrl) return;
    const body = `Hi there,\n\n${customNote}\n\nReview & Approve Content Calendar:\n${shareUrl}\n\nBest regards,\n${activeBrand?.name || "Creative Team"}`;
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleRevoke = async () => {
    if (!shareLink) return;
    if (!window.confirm("Are you sure you want to revoke this approval link? Anyone with this URL will lose access immediately.")) {
      return;
    }

    try {
      setIsRevoking(true);
      await revokeCalendarShareLink(shareLink.id);
      setShareLink({
        ...shareLink,
        revoked: true,
        revokedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error revoking share link:", err);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRegenerate = async () => {
    if (!activeBrand || !shareLink) return;
    if (!window.confirm("Regenerating will revoke the current link and create a brand new unguessable URL. Continue?")) {
      return;
    }

    try {
      setIsRegenerating(true);
      setLinkError(null);
      const newLink = await regenerateCalendarShareLink(
        shareLink.id,
        activeBrand.id,
        actualMonth,
        year,
        "month",
        undefined,
        `${monthName} ${year}`,
        activeBrand.name
      );
      setShareLink(newLink);
      setCopied(false);
    } catch (err: any) {
      console.error("Error regenerating share link:", err);
      setLinkError(
        err?.message || "Could not regenerate the review link. The previous link was already revoked — please try again."
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleConnectGoogle = async () => {
    if (!connectGmail) return;
    setIsConnectingGoogle(true);
    try {
      await connectGmail();
    } catch (err: any) {
      console.error("Failed to connect Google account:", err);
      if (addNotification) {
        addNotification("Google Auth Failed", err.message || "Could not sign in with Google.", "warning");
      }
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleSendViaGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !shareLink) return;

    const emails = recipientEmail
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes("@"));

    if (emails.length === 0) {
      setEmailSendStatus({
        type: "error",
        message: "Please provide a valid client recipient email address."
      });
      return;
    }

    let activeToken = gmailToken || (typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null);

    if (!activeToken && connectGmail) {
      setIsConnectingGoogle(true);
      try {
        await connectGmail();
        activeToken = gmailToken || (typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null);
      } catch (err: any) {
        setIsConnectingGoogle(false);
        setEmailSendStatus({
          type: "error",
          message: "Google account connection was cancelled or failed."
        });
        return;
      }
      setIsConnectingGoogle(false);
    }

    if (!activeToken) {
      setEmailSendStatus({
        type: "error",
        message: "Please connect your Google Workspace / Gmail account to dispatch emails."
      });
      return;
    }

    try {
      setIsSendingEmail(true);
      setEmailSendStatus(null);

      // Generate base64 PDF if requested
      const attachments = [];
      const pdfFileName = `${(activeBrand?.name || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "_")}_calendar_${monthName.toLowerCase()}_${year}.pdf`;
      
      if (attachPdf) {
        try {
          const pdfBase64 = await getCalendarPdfBase64({
            brand: activeBrand,
            briefs,
            monthName,
            year,
            shareUrl
          });
          if (pdfBase64) {
            attachments.push({
              pdfBase64,
              fileName: pdfFileName,
              mimeType: "application/pdf"
            });
          }
        } catch (pdfErr) {
          console.warn("Could not generate PDF attachment:", pdfErr);
        }
      }

      // Build rich HTML email template
      const htmlBody = buildApprovalEmailHtml({
        brandName: activeBrand?.name || "Brand Workspace",
        periodLabel: `${monthName} ${year}`,
        shareUrl,
        customNote,
        pdfFileName: attachPdf ? pdfFileName : undefined
      });

      const plainText = `Hi there,\n\n${customNote}\n\nReview & Approve Content Calendar:\n${shareUrl}\n\nBest regards,\n${activeBrand?.name || "Creative Team"}`;

      // Send via official Google Workspace Gmail API
      await sendBriefEmail(
        activeToken,
        emails,
        emailSubject,
        plainText,
        attachments,
        htmlBody
      );

      // Record email sent in Firestore
      await recordShareLinkEmailSent(shareLink.id, emails.join(", "));
      
      setShareLink(prev => prev ? {
        ...prev,
        lastEmailSentAt: new Date().toISOString(),
        emailRecipient: emails.join(", "),
        emailSentCount: (prev.emailSentCount || 0) + 1
      } : null);

      setEmailSendStatus({
        type: "success",
        message: `Dispatched via Google Workspace to ${emails.join(", ")}!`
      });

      if (addNotification) {
        addNotification(
          "Approval Email Sent",
          `Content calendar review invitation dispatched to ${emails.join(", ")}.`,
          "success"
        );
      }
    } catch (err: any) {
      console.error("Gmail dispatch error:", err);
      setEmailSendStatus({
        type: "error",
        message: err.message || "Failed to send email via Google Gmail API."
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const effectiveGoogleUser = gmailUser || (typeof window !== "undefined" && localStorage.getItem("gmail_user_email") ? { email: localStorage.getItem("gmail_user_email") } : null);
  const isGoogleConnected = Boolean(gmailToken || (typeof window !== "undefined" && localStorage.getItem("gmail_access_token")));

  return (
    <div 
      id="share-calendar-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="share-calendar-dialog"
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
          isDark ? "bg-[#16171d] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? "border-slate-800 bg-[#101115]" : "border-slate-100 bg-slate-50"
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold tracking-tight">
                  Client Content Approval Portal
                </h3>
                {shareLink && !shareLink.revoked && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                    Active Token Link
                  </span>
                )}
                {shareLink?.revoked && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Revoked
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {activeBrand?.name || "Active Brand"} • {monthName} {year} Content Roadmap
              </p>
            </div>
          </div>

          <button
            id="close-share-calendar-btn"
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark ? "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b text-xs font-mono font-semibold ${
          isDark ? "border-slate-800 bg-[#13141a]" : "border-slate-200 bg-slate-100/60"
        }`}>
          <button
            id="tab-share-link"
            onClick={() => setActiveTab("link")}
            className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "link"
                ? "border-violet-500 text-violet-400 bg-violet-500/5 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Unguessable Share Link & Tracking</span>
          </button>

          <button
            id="tab-send-email"
            onClick={() => setActiveTab("email")}
            className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "email"
                ? "border-violet-500 text-violet-400 bg-violet-500/5 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send via Google Workspace</span>
            {shareLink?.emailSentCount && shareLink.emailSentCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
                {shareLink.emailSentCount} sent
              </span>
            ) : null}
          </button>
        </div>

        {/* Tab 1: Share Link & Live Tracking */}
        {activeTab === "link" && (
          <div className="p-6 space-y-5">
            {linkError && (
              <div className="p-3.5 rounded-xl border text-xs flex items-start justify-between space-x-2.5 bg-rose-950/40 border-rose-500/30 text-rose-300">
                <div className="flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Link Not Saved</span>
                    <span className="text-[11px] opacity-90">{linkError}</span>
                  </div>
                </div>
                {!shareLink && (
                  <button
                    type="button"
                    onClick={handleRetryLoadLink}
                    disabled={loadingLink}
                    className="shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-200 hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingLink ? "animate-spin" : ""}`} />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            )}

            {/* Approval Progress Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border ${
                isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Proposed</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-lg font-bold text-blue-400">{proposedCount}</span>
                  <span className="text-[10px] text-slate-400">awaiting review</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Approved</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-lg font-bold text-emerald-400">{approvedCount}</span>
                  <span className="text-[10px] text-slate-400">ready for queue</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Revisions</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-lg font-bold text-amber-400">{changesRequestedCount}</span>
                  <span className="text-[10px] text-slate-400">notes left</span>
                </div>
              </div>
            </div>

            {/* Tokenized Link Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center space-x-1.5">
                  <span>Unique Unguessable Review Link</span>
                  {shareLink?.token && (
                    <span className="text-[10px] text-slate-500 font-normal">
                      (ID: {shareLink.token.substring(0, 10)}...)
                    </span>
                  )}
                </label>
                {shareLink?.revoked && (
                  <span className="text-[11px] font-mono font-bold text-rose-400 flex items-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Link Inactive</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div className={`flex-1 flex items-center px-3 py-2.5 rounded-xl border text-xs font-mono truncate ${
                  shareLink?.revoked
                    ? "bg-rose-950/20 border-rose-800/40 text-rose-300 line-through opacity-70"
                    : isDark 
                    ? "bg-slate-950 border-slate-800 text-slate-300" 
                    : "bg-slate-100 border-slate-200 text-slate-700"
                }`}>
                  {loadingLink ? (
                    <span className="text-slate-500 flex items-center space-x-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating secure cryptographic token...</span>
                    </span>
                  ) : linkError ? (
                    <span className="truncate text-rose-300">Link unavailable — see error above</span>
                  ) : (
                    <span className="truncate">{shareUrl}</span>
                  )}
                </div>

                <button
                  id="btn-copy-share-url"
                  onClick={handleCopyLink}
                  disabled={loadingLink || !shareUrl || shareLink?.revoked}
                  className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all disabled:opacity-40 ${
                    copied
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : isDark
                      ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                      : "bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300"
                  }`}
                  title="Copy link to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>

                <a
                  id="btn-preview-portal"
                  href={shareUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-1 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    !shareUrl || shareLink?.revoked
                      ? "pointer-events-none opacity-40"
                      : isDark
                      ? "bg-violet-600/20 border-violet-500/40 text-violet-300 hover:bg-violet-600/30"
                      : "bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100"
                  }`}
                  title="Open live client portal in new tab"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Business owners can open this tokenized link to review the weekly calendar grid, click <strong>Approve</strong> or <strong>Request Changes</strong>, and inspect full creative briefs without logging into NOK OS.
              </p>
            </div>

            {/* Live Sync & Audit History Panel */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Audit & Synchronization</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Zero Refresh Lag</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                <div>
                  <strong className="text-slate-300">Last Client Access:</strong>{" "}
                  {shareLink?.lastAccessedAt 
                    ? new Date(shareLink.lastAccessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : "No client views yet"}
                </div>
                <div>
                  <strong className="text-slate-300">Last Action Taken:</strong>{" "}
                  {shareLink?.lastActionSummary 
                    ? shareLink.lastActionSummary 
                    : "Awaiting review"}
                </div>
                <div>
                  <strong className="text-slate-300">Google Workspace Dispatches:</strong>{" "}
                  {shareLink?.emailSentCount ? `${shareLink.emailSentCount} delivered` : "Not sent yet"}
                </div>
                <div>
                  <strong className="text-slate-300">Created:</strong>{" "}
                  {shareLink?.createdAt ? new Date(shareLink.createdAt).toLocaleDateString() : "Just now"}
                </div>
              </div>
            </div>

            {/* Token Management Controls (Revoke / Regenerate) */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
              <div className="flex items-center space-x-2">
                {shareLink && !shareLink.revoked ? (
                  <button
                    id="btn-revoke-share-link"
                    type="button"
                    onClick={handleRevoke}
                    disabled={isRevoking}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{isRevoking ? "Revoking..." : "Revoke Link"}</span>
                  </button>
                ) : null}

                {shareLink && (
                  <button
                    id="btn-regenerate-share-link"
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 border border-violet-500/20 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                    <span>{isRegenerating ? "Regenerating..." : "Regenerate New Link"}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Send via Google Workspace / Gmail */}
        {activeTab === "email" && (
          <form onSubmit={handleSendViaGmail} className="p-6 space-y-4">
            {/* Google Connection Status Banner */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              isGoogleConnected 
                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                : "bg-violet-950/20 border-violet-500/30 text-violet-300"
            }`}>
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-white/10 text-white">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block">
                    {isGoogleConnected ? "Google Workspace Connected" : "Google Workspace Integration"}
                  </span>
                  <span className="text-[11px] opacity-80">
                    {isGoogleConnected 
                      ? `Ready to dispatch from ${effectiveGoogleUser?.email || "your Google account"}`
                      : "Authorize Gmail to dispatch invitations with PDF attachments directly from your account"}
                  </span>
                </div>
              </div>

              {!isGoogleConnected && connectGmail && (
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={isConnectingGoogle}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isConnectingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                  <span>Connect Google</span>
                </button>
              )}
            </div>

            {emailSendStatus && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                emailSendStatus.type === "success"
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-950/40 border-rose-500/30 text-rose-300"
              }`}>
                {emailSendStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">
                    {emailSendStatus.type === "success" ? "Email Dispatched" : "Delivery Notice"}
                  </span>
                  <span className="text-[11px] opacity-90">{emailSendStatus.message}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                Client Recipient Email
              </label>
              <input
                id="input-client-email"
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="owner@brand.com"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-violet-500/40 ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-100 border-slate-200 text-slate-800"
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                Subject Line
              </label>
              <input
                id="input-email-subject"
                type="text"
                required
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-violet-500/40 ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-100 border-slate-200 text-slate-800"
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                Personalized Note to Client (Optional)
              </label>
              <textarea
                id="input-custom-note"
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-violet-500/40 ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-100 border-slate-200 text-slate-800"
                }`}
                placeholder="Add special notes, context, or instructions..."
              />
            </div>

            {/* Attachment Toggle */}
            <div className={`flex items-center justify-between p-3 rounded-xl border ${
              isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center space-x-2.5">
                <Paperclip className="w-4 h-4 text-violet-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Attach Executive Landscape PDF Backup
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Auto-generated PDF document ({briefs.length} scheduled briefs)
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                id="checkbox-attach-pdf"
                checked={attachPdf}
                onChange={(e) => setAttachPdf(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-950 border-slate-700"
              />
            </div>

            {/* Quick Actions (Copy Draft / Default Mailto) */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleCopyEmailDraft}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                  copiedDraft
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : isDark
                    ? "border-slate-800 text-slate-300 hover:bg-slate-800"
                    : "border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {copiedDraft ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDraft ? "Draft Copied!" : "Copy Email Text"}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenDefaultMailer}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? "border-slate-800 text-slate-300 hover:bg-slate-800"
                    : "border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
                <span>Open in Mail App</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
              <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Workspace Gmail API</span>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("link")}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    isDark ? "border-slate-800 text-slate-400 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Back to Link
                </button>

                <button
                  id="btn-submit-send-email"
                  type="submit"
                  disabled={isSendingEmail || !recipientEmail}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isSendingEmail ? "Sending via Gmail..." : "Send via Google Workspace"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
