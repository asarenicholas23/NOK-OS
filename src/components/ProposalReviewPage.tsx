import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, MessageSquare, Send, PenLine, AlertTriangle, CheckCircle2, Info, ShieldCheck, CheckCheck } from "lucide-react";
import { API_BASE_URL } from "../lib/apiBase";
import { useCms } from "../context/CmsContext";
import { ProposalSnapshot, ProposalComment, ProposalStatus, PaymentKind, proposalTotals, selectedLineItems, formatGhs } from "../data/cmsData";
import { withCurrentServiceNames } from "../content/services";
import { ProposalDocument } from "./ProposalDocument";
import { SEO } from "./SEO";

const GENERAL = "General";

interface PaymentSummary {
  acceptedVersion: number | null;
  acceptedTotal: number;
  acceptedItemIds: string[] | null;
  amountPaid: number;
  paymentStatus: "deposit_paid" | "paid_in_full" | null;
  balanceRequested: boolean;
}

const PAY_ERRORS: Record<string, string> = {
  expired: "This proposal has passed its valid-until date. Leave a comment below and we'll send you an updated one.",
  not_payable: "This payment isn't available right now. Please refresh the page.",
  no_items: "Tick at least one item to go ahead.",
  nothing_due: "There's nothing left to pay. Thank you!",
  missing_email: "We're missing your email address for the receipt. Please message us and we'll fix it.",
  payments_unavailable: "Online payment isn't switched on yet. Please message us on WhatsApp to go ahead."
};

// The client's private proposal page. Loaded through the API (which checks the
// token), so it works without any login.
export const ProposalReviewPage: React.FC = () => {
  const { token } = useParams();
  const { agencyInfo } = useCms();
  const [proposal, setProposal] = useState<ProposalSnapshot | null>(null);
  const [status, setStatus] = useState<ProposalStatus | null>(null);
  const [comments, setComments] = useState<ProposalComment[]>([]);
  const [payment, setPayment] = useState<PaymentSummary | null>(null);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "slow" | "ready" | "not_found" | "error">("loading");
  const [paying, setPaying] = useState<PaymentKind | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"checking" | "confirmed" | "pending" | null>(null);
  // Line items the client has ticked. Everything starts ticked.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [message, setMessage] = useState("");
  const [section, setSection] = useState(GENERAL);
  const [posting, setPosting] = useState<"comment" | "changes" | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  const apiPost = (path: string, body: object) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...body })
    });

  // Returns false if the proposal couldn't be loaded.
  const load = async () => {
    const resp = await apiPost("/api/proposals/view", {});
    if (resp.status === 404) {
      setLoadState("not_found");
      return false;
    }
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    setProposal(withCurrentServiceNames(data.proposal));
    setSelectedIds(data.proposal.lineItems.map((li: { id: string }) => li.id));
    setStatus(data.status);
    setPayment(data.payment);
    setPaymentsEnabled(!!data.paymentsEnabled);
    setComments(data.comments);
    setLoadState("ready");
    return true;
  };

  useEffect(() => {
    let cancelled = false;
    // The API host can take up to a minute to wake from sleep.
    const slowTimer = setTimeout(() => !cancelled && setLoadState((s) => (s === "loading" ? "slow" : s)), 5000);
    // Paystack sends the client back here with ?reference=… after checkout.
    const reference = new URLSearchParams(window.location.search).get("reference");
    (async () => {
      try {
        if (!(await load()) || cancelled || !reference) return;
        window.history.replaceState(null, "", window.location.pathname);
        setConfirming("checking");
        const resp = await apiPost("/api/proposals/verify-payment", { reference });
        const result = resp.ok ? (await resp.json()).result : null;
        if (cancelled) return;
        if (result === "recorded" || result === "already_recorded") {
          await load();
          setConfirming("confirmed");
        } else {
          setConfirming("pending");
        }
      } catch (err) {
        console.error("Loading proposal failed:", err);
        if (!cancelled) setLoadState((s) => (s === "ready" ? s : "error"));
      } finally {
        clearTimeout(slowTimer);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const startPayment = async (kind: PaymentKind) => {
    setPaying(kind);
    setPayError(null);
    try {
      const resp = await apiPost("/api/proposals/pay", kind === "deposit" ? { kind, itemIds: selectedIds } : { kind });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.authorizationUrl) {
        throw new Error(PAY_ERRORS[data.error] || "We couldn't start the payment. Please try again in a moment.");
      }
      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      setPayError(err.message);
      setPaying(null);
    }
  };

  const postComment = async (requestChanges: boolean) => {
    if (!message.trim()) {
      setPostError(requestChanges ? "Tell us what you'd like changed." : "Write a comment first.");
      return;
    }
    setPosting(requestChanges ? "changes" : "comment");
    setPostError(null);
    try {
      const resp = await apiPost("/api/proposals/comment", {
        message: message.trim(),
        section: section === GENERAL ? "" : section,
        requestChanges
      });
      if (resp.status === 429) throw new Error("Too many messages in a short time. Please wait a minute and try again.");
      if (resp.status === 409) throw new Error("This proposal is closed, so changes can no longer be requested here. Message us on WhatsApp instead.");
      if (!resp.ok) throw new Error("We couldn't send your message. Please try again.");
      const data = await resp.json();
      setComments((prev) => [...prev, data.comment]);
      setStatus(data.status);
      setMessage("");
      setSection(GENERAL);
    } catch (err: any) {
      setPostError(err.message || "We couldn't send your message. Please try again.");
    } finally {
      setPosting(null);
    }
  };

  const whatsappUrl = () => {
    const rawPhone = (agencyInfo.whatsapp || "+233235337886").replace(/[^0-9]/g, "");
    const chosen = proposal ? selectedLineItems(proposal.lineItems, selectedIds) : [];
    const items = proposal && chosen.length < proposal.lineItems.length
      ? ` with these items: ${chosen.map((li) => li.title).join(", ")}`
      : "";
    const text = `Hello N.O.K Social! I'm looking at my proposal "${proposal?.title || ""}" and I'm ready to go ahead${items}.`;
    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`;
  };

  const canOrder = status !== "accepted" && status !== "declined";
  const orderTotals = proposal
    ? { ...proposalTotals(proposal, selectedIds), count: selectedLineItems(proposal.lineItems, selectedIds).length }
    : null;

  const sections = proposal
    ? [GENERAL, "Project build plan", ...proposal.phases.map((p) => p.title).filter(Boolean), "Pricing", "Terms"]
    : [GENERAL];

  return (
    <div className="min-h-screen bg-[#15151A] text-[#F2F0EB] font-sans">
      <SEO title="Your Proposal | N.O.K Social" description="Your private proposal from N.O.K Social." path={`/proposal/${token}`} noindex />

      <header className="px-4 sm:px-8 py-5 max-w-4xl mx-auto flex items-center justify-between">
        <span className="font-display font-bold text-lg">{agencyInfo.name || "N.O.K Social"}</span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A93]">Private proposal</span>
      </header>

      <main className="px-4 sm:px-8 pb-20 max-w-4xl mx-auto space-y-8">
        {(loadState === "loading" || loadState === "slow") && (
          <div className="py-24 text-center space-y-3 text-sm text-zinc-300">
            <Loader2 className="w-6 h-6 animate-spin text-[#B08D57] mx-auto" />
            <p>Loading your proposal…</p>
            {loadState === "slow" && <p className="text-xs text-[#8A8A93]">This can take up to a minute the first time. Thanks for your patience.</p>}
          </div>
        )}

        {loadState === "not_found" && (
          <div className="py-24 text-center space-y-3">
            <AlertTriangle className="w-7 h-7 text-amber-400 mx-auto" />
            <h1 className="font-display text-xl font-bold">We couldn't find this proposal</h1>
            <p className="text-sm text-zinc-300">The link may be incomplete or no longer active. Please check it, or contact us and we'll resend it.</p>
          </div>
        )}

        {loadState === "error" && (
          <div className="py-24 text-center space-y-3">
            <AlertTriangle className="w-7 h-7 text-rose-400 mx-auto" />
            <h1 className="font-display text-xl font-bold">Something went wrong</h1>
            <p className="text-sm text-zinc-300">We couldn't load your proposal. Please refresh the page to try again.</p>
          </div>
        )}

        {loadState === "ready" && proposal && (
          <>
            {confirming === "checking" && (
              <div className="p-4 rounded-2xl neu-pressed text-sm text-zinc-200 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#B08D57]" />
                <span>Confirming your payment with Paystack…</span>
              </div>
            )}
            {confirming === "pending" && (
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-sm text-amber-200 flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>We haven't received confirmation of a completed payment yet. If you were charged, it will show here shortly. Refresh in a minute, or message us on WhatsApp.</span>
              </div>
            )}
            {status === "accepted" && (
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-200 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {confirming === "confirmed" ? "Payment received! " : ""}
                  {payment?.paymentStatus === "paid_in_full"
                    ? "This project is paid in full. Thank you!"
                    : `Your order from version ${payment?.acceptedVersion ?? proposal.version} of this proposal is confirmed and the deposit is paid. Thank you, we're on it! A receipt is on its way to your email from Paystack.`}
                </span>
              </div>
            )}
            {status === "changes_requested" && (
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-sm text-amber-200 flex items-start space-x-2">
                <PenLine className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Thanks, we've got your change request. We'll update the proposal and this page will show the new version.</span>
              </div>
            )}
            {proposal.changeNote && proposal.version > 1 && (
              <div className="p-4 rounded-2xl neu-pressed text-sm text-zinc-200 flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#B08D57]" />
                <span><span className="font-semibold text-[#F2F0EB]">What's changed in version {proposal.version}:</span> {proposal.changeNote}</span>
              </div>
            )}

            <div className="p-6 sm:p-10 rounded-3xl neu-raised">
              {canOrder ? (
                <ProposalDocument
                  proposal={proposal}
                  agencyName={agencyInfo.name}
                  selectedIds={selectedIds}
                  onToggleItem={(id) => setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))}
                  onSelectAll={() => setSelectedIds(proposal.lineItems.map((li) => li.id))}
                />
              ) : (
                <ProposalDocument
                  proposal={proposal}
                  agencyName={agencyInfo.name}
                  // After acceptance, show what was ordered (only if they accepted this version).
                  selectedIds={status === "accepted" && payment?.acceptedVersion === proposal.version ? payment.acceptedItemIds : null}
                />
              )}
            </div>

            {payError && (
              <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-sm text-rose-200 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{payError}</span>
              </div>
            )}

            {status !== "accepted" && status !== "declined" && (
              <section className="p-6 rounded-3xl neu-raised space-y-4">
                <h2 className="font-display text-lg font-bold">Ready to go ahead?</h2>
                {paymentsEnabled ? (
                  <>
                    <p className="text-sm text-zinc-300">
                      {!orderTotals || orderTotals.count === 0
                        ? "You haven't chosen any items yet. Tick the ones you'd like in the pricing above, or accept all items."
                        : <>
                            {orderTotals.count < proposal.lineItems.length
                              ? `You've chosen ${orderTotals.count} of ${proposal.lineItems.length} items (${formatGhs(orderTotals.total)}). `
                              : `You've accepted all items (${formatGhs(orderTotals.total)}). `}
                            Paying the {proposal.depositPercent}% deposit on them confirms your order and books your project in. The balance is due on delivery.
                          </>}
                    </p>
                    {orderTotals && orderTotals.count < proposal.lineItems.length && (
                      <button
                        onClick={() => setSelectedIds(proposal.lineItems.map((li) => li.id))}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl neu-raised text-sm font-bold text-[#C5A065] inline-flex items-center justify-center space-x-2 cursor-pointer mb-3 sm:mb-0 sm:mr-3"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Accept all items ({formatGhs(proposalTotals(proposal).total)})</span>
                      </button>
                    )}
                    <button
                      onClick={() => startPayment("deposit")}
                      disabled={paying !== null || !orderTotals || orderTotals.total <= 0}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-xl neu-gold-filled text-sm font-bold inline-flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                    >
                      {paying === "deposit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>Confirm order & pay {formatGhs(orderTotals?.deposit || 0)} deposit</span>
                    </button>
                    <p className="text-xs text-zinc-400">
                      Secure payment by Mobile Money or card through Paystack. Questions first?{" "}
                      <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">Message us on WhatsApp</a>{" "}
                      or leave a comment below.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-zinc-300">
                      Message us on WhatsApp and we'll send you the deposit details to get started. If anything needs adjusting first, leave a comment below.
                    </p>
                    <a
                      href={whatsappUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>I'm ready: message us on WhatsApp</span>
                    </a>
                  </>
                )}
              </section>
            )}

            {status === "accepted" && payment && (
              <section className="p-6 rounded-3xl neu-raised space-y-4">
                <h2 className="font-display text-lg font-bold">Payments</h2>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    ["Project total", formatGhs(payment.acceptedTotal)],
                    ["Paid", formatGhs(payment.amountPaid)],
                    ["Balance", formatGhs(Math.max(0, payment.acceptedTotal - payment.amountPaid))]
                  ].map(([label, value]) => (
                    <div key={label} className="p-3 rounded-xl neu-pressed">
                      <div className="text-[10px] font-mono uppercase text-[#8A8A93]">{label}</div>
                      <div className="text-sm font-bold font-mono mt-1">{value}</div>
                    </div>
                  ))}
                </div>
                {payment.balanceRequested && payment.paymentStatus !== "paid_in_full" && paymentsEnabled && (
                  <button
                    onClick={() => startPayment("balance")}
                    disabled={paying !== null}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl neu-gold-filled text-sm font-bold inline-flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                  >
                    {paying === "balance" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>Pay balance of {formatGhs(Math.max(0, payment.acceptedTotal - payment.amountPaid))}</span>
                  </button>
                )}
              </section>
            )}

            {/* Comments & change requests */}
            <section className="p-6 rounded-3xl neu-raised space-y-5">
              <div>
                <h2 className="font-display text-lg font-bold">Questions, comments & changes</h2>
                <p className="text-xs text-zinc-400 mt-1">Only you and the N.O.K Social team can see this conversation.</p>
              </div>

              {comments.length > 0 && (
                <ul className="space-y-3">
                  {comments.map((c) => (
                    <li
                      key={c.id}
                      className={`p-4 rounded-2xl text-sm space-y-1.5 ${c.author === "staff" ? "neu-pressed border-l-2 border-[#B08D57]" : "neu-pressed"}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#8A8A93]">
                        <span className={c.author === "staff" ? "text-[#C5A065] font-semibold" : "text-[#F2F0EB] font-semibold"}>
                          {c.author === "staff" ? `${c.name} · N.O.K Social` : c.name}
                        </span>
                        <span>{new Date(c.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        <span>· v{c.version}</span>
                        {c.kind === "change_request" && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">Change request</span>
                        )}
                        {c.section && <span className="px-2 py-0.5 rounded-full bg-white/5 text-zinc-300">{c.section}</span>}
                      </div>
                      <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">{c.message}</p>
                    </li>
                  ))}
                </ul>
              )}

              {status !== "declined" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="sm:col-span-1">
                      <span className="block text-[10px] font-mono uppercase text-[#8A8A93] mb-1">About</span>
                      <select
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] bg-[#121216] outline-none focus:ring-1 focus:ring-[#B08D57]"
                      >
                        {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    placeholder="Ask a question, or tell us what you'd like changed…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl neu-pressed-deep text-sm text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                  />
                  {postError && (
                    <p className="text-xs text-rose-300 flex items-start space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{postError}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => postComment(false)}
                      disabled={posting !== null}
                      className="px-4 py-2.5 rounded-xl neu-raised text-xs font-bold text-[#F2F0EB] hover:text-[#B08D57] flex items-center space-x-2 cursor-pointer disabled:opacity-60"
                    >
                      {posting === "comment" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send comment</span>
                    </button>
                    {status !== "accepted" && (
                      <button
                        onClick={() => postComment(true)}
                        disabled={posting !== null}
                        className="px-4 py-2.5 rounded-xl neu-gold-filled text-xs font-bold flex items-center space-x-2 cursor-pointer disabled:opacity-60"
                      >
                        {posting === "changes" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />}
                        <span>Request these changes</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ProposalReviewPage;
