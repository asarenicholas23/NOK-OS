import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  Calendar as CalendarIcon,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Lock,
  Layers,
  HelpCircle,
  Eye
} from "lucide-react";
import {
  db,
  auth,
  CreativeBrief,
  Brand,
  CalendarShareLink,
  recordShareLinkAccess,
  recordShareLinkAction
} from "../lib/firebase";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { API_BASE_URL } from "../lib/apiBase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { WeeklyContentPlannerGrid } from "./WeeklyContentPlannerGrid";
import { RequestChangesModal } from "./RequestChangesModal";
import { BriefDetailModal } from "./BriefDetailModal";
import { downloadCalendarPDF } from "../utils/pdfGenerator";

export const ClientCalendarApprovalView: React.FC = () => {
  const { token: paramToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const token = paramToken || searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [shareLink, setShareLink] = useState<CalendarShareLink | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [briefs, setBriefs] = useState<CreativeBrief[]>([]);
  const [errorStatus, setErrorStatus] = useState<"not_found" | "revoked" | null>(null);

  // Active view filters
  const [activeWeekTab, setActiveWeekTab] = useState<number | "all">("all");

  // Interaction Modals
  const [selectedBriefForChanges, setSelectedBriefForChanges] = useState<CreativeBrief | null>(null);
  const [selectedBriefForDetail, setSelectedBriefForDetail] = useState<CreativeBrief | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: "success" | "warning" | "info" } | null>(null);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const showToast = (title: string, desc: string, type: "success" | "warning" | "info" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch and Validate Share Token Link
  useEffect(() => {
    let isMounted = true;

    async function loadShareLink() {
      if (!token) {
        if (isMounted) {
          setErrorStatus("not_found");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        // Validate the raw token server-side (trusted Admin SDK access) and
        // exchange it for a Firebase custom auth token scoped to this brand/link,
        // so subsequent Firestore reads/writes are authorized by security rules.
        const exchangeResp = await fetch(`${API_BASE_URL}/api/calendar-review/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });

        if (exchangeResp.status === 404) {
          if (isMounted) {
            setErrorStatus("not_found");
            setLoading(false);
          }
          return;
        }

        if (exchangeResp.status === 403) {
          const body = await exchangeResp.json().catch(() => ({}));
          if (isMounted) {
            if (body.shareLink) setShareLink(body.shareLink as CalendarShareLink);
            setErrorStatus("revoked");
            setLoading(false);
          }
          return;
        }

        if (!exchangeResp.ok) {
          throw new Error("Failed to validate review link.");
        }

        const { customToken, shareLink: linkData } = await exchangeResp.json();

        await signOut(auth).catch(() => {});
        await signInWithCustomToken(auth, customToken);

        if (isMounted) {
          setShareLink(linkData);
          setErrorStatus(null);
        }

        // Record access metadata
        recordShareLinkAccess(linkData.id);

        // Fetch brand details
        try {
          const brandDoc = await getDoc(doc(db, "brands", linkData.brandId));
          if (brandDoc.exists()) {
            if (isMounted) {
              setBrand({ id: brandDoc.id, ...(brandDoc.data() as Omit<Brand, "id">) });
            }
          } else {
            // Check by querying domain or fallback
            const brandQuery = query(collection(db, "brands"), where("id", "==", linkData.brandId));
            const brandSnap = await getDocs(brandQuery);
            if (!brandSnap.empty && isMounted) {
              const b = brandSnap.docs[0];
              setBrand({ id: b.id, ...(b.data() as Omit<Brand, "id">) });
            } else if (isMounted) {
              setBrand({
                id: linkData.brandId,
                name: linkData.brandName || "Brand Client Workspace",
                domain: "brand.com",
                industry: "Marketing & Strategy",
                primaryColor: "violet",
                logoText: linkData.brandName?.substring(0, 2).toUpperCase() || "NOK",
                voiceTone: "Authoritative & Strategic",
                tagline: "Content & Campaigns Operations"
              });
            }
          }
        } catch (err) {
          console.warn("Could not load brand details:", err);
          if (isMounted) {
            setBrand({
              id: linkData.brandId,
              name: linkData.brandName || "Brand Client Workspace",
              domain: "brand.com",
              industry: "Marketing",
              primaryColor: "violet",
              logoText: "NOK",
              voiceTone: "Authoritative",
              tagline: "Content & Campaigns Operations"
            });
          }
        }
      } catch (err) {
        console.error("Error validating share link:", err);
        if (isMounted) setErrorStatus("not_found");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadShareLink();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // 2. Subscribe to Real-Time Brief Updates for this Brand
  useEffect(() => {
    if (!shareLink || shareLink.revoked) return;

    const briefsRef = collection(db, "briefs");
    const q = query(briefsRef, where("brandId", "==", shareLink.brandId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CreativeBrief[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<CreativeBrief, "id">) });
        });

        // Filter for this share link's target period
        const filtered = list.filter((brief) => {
          // If specific week-scoped link
          if (shareLink.periodType === "week" && shareLink.weekNumber !== undefined) {
            return (brief.weekNumber || 1) === shareLink.weekNumber;
          }
          return true;
        });

        setBriefs(filtered);
      },
      (error) => {
        console.error("Real-time briefs subscription error:", error);
      }
    );

    return () => unsubscribe();
  }, [shareLink]);

  // Handler: 1-Click Approve a Single Day
  const handleApproveBrief = async (brief: CreativeBrief) => {
    try {
      const briefRef = doc(db, "briefs", brief.id);
      await updateDoc(briefRef, {
        status: "Approved",
        approver: "Client (Verified Portal)"
      });

      if (shareLink) {
        recordShareLinkAction(
          shareLink.id,
          `Approved "${brief.title}" (${brief.dayOfWeek || "Day"})`
        );
      }

      showToast(
        "Day Approved",
        `"${brief.title}" has been approved and moved to the production queue.`,
        "success"
      );
    } catch (err: any) {
      console.error("Error approving brief:", err);
      showToast("Action Failed", err.message || "Could not record approval.", "warning");
    }
  };

  // Handler: Request Changes for a Day
  const handleSubmitChanges = async (briefId: string, notes: string) => {
    try {
      const briefRef = doc(db, "briefs", briefId);
      await updateDoc(briefRef, {
        status: "Changes Requested",
        revisionNotes: notes
      });

      if (shareLink && selectedBriefForChanges) {
        recordShareLinkAction(
          shareLink.id,
          `Changes requested for "${selectedBriefForChanges.title}"`
        );
      }

      showToast(
        "Revision Notes Sent",
        "Your feedback has been logged directly for the creative team.",
        "info"
      );
      setSelectedBriefForChanges(null);
    } catch (err: any) {
      console.error("Error submitting changes:", err);
      showToast("Error", err.message || "Failed to submit revision notes.", "warning");
    }
  };

  // Handler: Approve All in a Week
  const handleApproveAllWeek = async (weekNumber: number, briefIds: string[]) => {
    const proposed = briefs.filter((b) => briefIds.includes(b.id) && b.status === "Proposed");
    if (proposed.length === 0) {
      showToast("All Ready", "All proposed items in this week are already approved.", "info");
      return;
    }

    try {
      setIsBulkApproving(true);
      const batch = writeBatch(db);

      proposed.forEach((b) => {
        const ref = doc(db, "briefs", b.id);
        batch.update(ref, {
          status: "Approved",
          approver: "Client (Verified Portal)"
        });
      });

      await batch.commit();

      if (shareLink) {
        recordShareLinkAction(
          shareLink.id,
          `Approved all Week ${weekNumber} (${proposed.length} briefs)`
        );
      }

      showToast(
        "Week Approved",
        `Successfully approved all ${proposed.length} proposed items for Week ${weekNumber}.`,
        "success"
      );
    } catch (err: any) {
      console.error("Bulk approve error:", err);
      showToast("Batch Failed", err.message || "Could not complete bulk approval.", "warning");
    } finally {
      setIsBulkApproving(false);
    }
  };

  // Handler: Approve All Proposed Content Globally for the Entire Period
  const handleApproveAllProposedGlobal = async () => {
    const proposed = briefs.filter((b) => b.status === "Proposed");
    if (proposed.length === 0) {
      showToast("All Approved", "There are no pending proposed briefs left to approve.", "info");
      return;
    }

    if (!window.confirm(`Are you sure you want to approve all ${proposed.length} proposed campaign items for ${shareLink?.periodLabel || "this calendar"}?`)) {
      return;
    }

    try {
      setIsBulkApproving(true);
      const batch = writeBatch(db);

      proposed.forEach((b) => {
        const ref = doc(db, "briefs", b.id);
        batch.update(ref, {
          status: "Approved",
          approver: "Client (Verified Portal)"
        });
      });

      await batch.commit();

      if (shareLink) {
        recordShareLinkAction(
          shareLink.id,
          `Master Approved all ${proposed.length} proposed briefs`
        );
      }

      showToast(
        "Master Approval Complete",
        `All ${proposed.length} proposed campaign briefs have been approved and queued!`,
        "success"
      );
    } catch (err: any) {
      console.error("Global approve error:", err);
      showToast("Error", err.message || "Could not complete approval.", "warning");
    } finally {
      setIsBulkApproving(false);
    }
  };

  const handleDownloadBackupPDF = () => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = shareLink ? monthNames[shareLink.month] : "Calendar";
    const year = shareLink ? shareLink.year : new Date().getFullYear();
    const currentUrl = window.location.href;

    downloadCalendarPDF(brand, briefs, monthName, year, currentUrl);
    showToast("PDF Downloaded", "Static calendar backup copy saved to your device.", "success");
  };

  // ----------------------------------------------------
  // RENDER: Loading State
  // ----------------------------------------------------
  if (loading) {
    return (
      <div 
        id="client-portal-loading" 
        className="min-h-screen bg-[#0d0e12] flex flex-col items-center justify-center font-sans text-slate-300 p-6"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#181920] border border-slate-800 flex items-center justify-center shadow-xl shadow-black/40 mb-4 animate-pulse">
          <CalendarIcon className="w-6 h-6 text-[#b08d57]" />
        </div>
        <div className="w-6 h-6 border-2 border-t-[#b08d57] border-slate-800 rounded-full animate-spin mb-3" />
        <h2 className="text-sm font-semibold text-slate-200">Loading Content Approval Matrix...</h2>
        <p className="text-xs text-slate-500 font-mono mt-1">Verifying secure token credentials</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: Invalid or Revoked State
  // ----------------------------------------------------
  if (errorStatus === "revoked" || errorStatus === "not_found") {
    return (
      <div 
        id="client-portal-error" 
        className="min-h-screen bg-[#0d0e12] flex flex-col items-center justify-center font-sans text-slate-300 p-6"
      >
        <div className="w-full max-w-md bg-[#16171e] border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-base font-bold text-slate-100 mb-1.5">
            {errorStatus === "revoked" ? "Approval Link Revoked" : "Link Not Found or Expired"}
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            {errorStatus === "revoked"
              ? "This approval link has been revoked or regenerated by your marketing strategy team. Please contact your account manager to receive the updated review link."
              : "We could not find an active calendar review associated with this link. Please verify the URL or request a fresh link from your brand workspace team."}
          </p>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1 text-left">
            <div><strong>Workspace:</strong> {shareLink?.brandName || "NOK OS"}</div>
            <div><strong>Period:</strong> {shareLink?.periodLabel || "Content Review"}</div>
            <div><strong>Security Status:</strong> Inactive / Revoked</div>
          </div>
        </div>
      </div>
    );
  }

  // Summary counts
  const totalCount = briefs.length;
  const approvedCount = briefs.filter((b) => b.status === "Approved").length;
  const proposedCount = briefs.filter((b) => b.status === "Proposed").length;
  const changesCount = briefs.filter((b) => b.status === "Changes Requested").length;
  const percentApproved = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const activeMonthName = shareLink ? monthNames[shareLink.month] : "Calendar";
  const activeYear = shareLink ? shareLink.year : new Date().getFullYear();

  // Filter briefs based on active week tab
  const displayedBriefs = activeWeekTab === "all" 
    ? briefs 
    : briefs.filter((b) => (b.weekNumber || 1) === activeWeekTab);

  return (
    <div 
      id="client-calendar-portal" 
      className="min-h-screen bg-[#0c0d11] text-[#f2f0eb] font-sans antialiased select-none pb-24"
    >
      {/* Top Navigation & Brand Header Bar */}
      <header 
        id="client-portal-header"
        className="sticky top-0 z-30 bg-[#121318]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 transition-all"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand Identity & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-600/20 text-sm tracking-wider font-mono">
              {brand?.logoText || "NOK"}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  {brand?.name || "Brand"} Content Calendar
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#b08d57]/15 text-[#e5c07b] border border-[#b08d57]/30">
                  <ShieldCheck className="w-3 h-3 mr-1 text-[#b08d57]" />
                  Client Review Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {shareLink?.periodLabel || `${activeMonthName} ${activeYear}`} Roadmap • Real-Time Direct Approval
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              id="btn-download-pdf-backup"
              onClick={handleDownloadBackupPDF}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-xs cursor-pointer"
              title="Download high-resolution PDF backup of this calendar"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Download PDF Copy</span>
            </button>

            {proposedCount > 0 && (
              <button
                id="btn-approve-all-global"
                onClick={handleApproveAllProposedGlobal}
                disabled={isBulkApproving}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isBulkApproving ? "Approving..." : `Approve All (${proposedCount} Proposed)`}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Review Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Progress & Quick Stats Card */}
        <section 
          id="client-approval-summary-card"
          className="bg-[#14151b] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Overview & Instructions */}
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Sign-Off Workflow</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Review your upcoming content schedule for {shareLink?.periodLabel || `${activeMonthName} ${activeYear}`}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click <strong>Approve</strong> on any scheduled day to greenlight its production and staging, or click <strong>Request Changes</strong> to leave revision notes. All actions sync directly with our strategy team in real time.
              </p>
            </div>

            {/* Right: Interactive Stats & Progress Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:min-w-[340px]">
              <div className="flex-1 bg-[#0f1015] border border-slate-800/80 rounded-xl p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Proposed</span>
                <span className="text-lg font-extrabold text-blue-400">{proposedCount}</span>
                <span className="text-[10px] text-slate-400 block">awaiting review</span>
              </div>

              <div className="flex-1 bg-[#0f1015] border border-slate-800/80 rounded-xl p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Approved</span>
                <span className="text-lg font-extrabold text-emerald-400">{approvedCount}</span>
                <span className="text-[10px] text-slate-400 block">in queue</span>
              </div>

              <div className="flex-1 bg-[#0f1015] border border-slate-800/80 rounded-xl p-3 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Revisions</span>
                <span className="text-lg font-extrabold text-amber-400">{changesCount}</span>
                <span className="text-[10px] text-slate-400 block">changes requested</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5 pt-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-400">Campaign Approval Progress</span>
              <span className="font-bold text-emerald-400">{percentApproved}% Complete ({approvedCount}/{totalCount} Assets)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${percentApproved}%` }}
              />
            </div>
          </div>
        </section>

        {/* Filter Week Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-1.5 bg-[#14151b] p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveWeekTab("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeWeekTab === "all"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              All Weeks ({briefs.length})
            </button>
            {[1, 2, 3, 4].map((w) => {
              const count = briefs.filter((b) => (b.weekNumber || 1) === w).length;
              if (count === 0 && activeWeekTab !== w) return null;
              return (
                <button
                  key={w}
                  onClick={() => setActiveWeekTab(w)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeWeekTab === w
                      ? "bg-violet-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  Week 0{w} ({count})
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Synchronized with Creative Team</span>
          </div>
        </div>

        {/* The Full Weekly Content Planner Matrix */}
        <WeeklyContentPlannerGrid
          briefs={displayedBriefs}
          activeBrand={brand}
          theme="dark"
          activeColor="violet"
          monthName={activeMonthName}
          year={activeYear}
          onApproveDay={handleApproveBrief}
          onRequestChanges={(brief) => setSelectedBriefForChanges(brief)}
          onApproveAllWeek={handleApproveAllWeek}
          onOpenBriefDetail={(brief) => setSelectedBriefForDetail(brief)}
        />
      </main>

      {/* Floating Toast Feedback */}
      {toastMessage && (
        <div 
          id="client-portal-toast"
          className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          <div className={`flex items-start space-x-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md max-w-sm ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100"
              : toastMessage.type === "warning"
              ? "bg-amber-950/90 border-amber-500/40 text-amber-100"
              : "bg-slate-900/90 border-slate-700 text-slate-100"
          }`}>
            {toastMessage.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toastMessage.type === "warning" && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            {toastMessage.type === "info" && <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />}
            
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold">{toastMessage.title}</h4>
              <p className="text-[11px] opacity-90 leading-snug">{toastMessage.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {selectedBriefForChanges && (
        <RequestChangesModal
          brief={selectedBriefForChanges}
          activeBrand={brand}
          theme="dark"
          onClose={() => setSelectedBriefForChanges(null)}
          onSubmit={handleSubmitChanges}
        />
      )}

      {/* Brief Full Detail Modal (Client view) */}
      {selectedBriefForDetail && (
        <BriefDetailModal
          brief={selectedBriefForDetail}
          activeBrand={brand}
          theme="dark"
          activeColor="violet"
          onClose={() => setSelectedBriefForDetail(null)}
          onApprove={async (brief) => {
            await handleApproveBrief(brief);
            setSelectedBriefForDetail(null);
          }}
          onRequestChanges={(brief) => {
            setSelectedBriefForDetail(null);
            setSelectedBriefForChanges(brief);
          }}
        />
      )}
    </div>
  );
};
