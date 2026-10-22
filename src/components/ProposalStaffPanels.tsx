import React, { useEffect, useState } from "react";
import { Send, Copy, Mail, MessageSquare, Eye, Loader2, PenLine, Wallet, Receipt, RotateCcw } from "lucide-react";
import { auth } from "../lib/firebase";
import { apiFetch } from "../lib/apiBase";
import { Proposal, ProposalComment, ProposalPayment, PROPOSAL_CONTENT_FIELDS, proposalTotals, formatGhs } from "../data/cmsData";
import {
  sendProposal,
  nextSendVersion,
  proposalLink,
  subscribeToProposalComments,
  subscribeToProposalPayments,
  setBalanceRequested,
  addStaffReply
} from "../lib/proposals";

const input = "w-full px-3 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]";

const contentKey = (p: Proposal) =>
  JSON.stringify([...PROPOSAL_CONTENT_FIELDS.filter((k) => k !== "version").map((k) => p[k]), p.clientEmail]);

const formatWhen = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null;

// Send / send-update controls and the client's private link.
export const ProposalSendPanel: React.FC<{
  editing: Proposal;
  live?: Proposal; // the saved copy, including server-side updates
  onSent: (sent: Proposal) => void;
  onNotify: (msg: string) => void;
}> = ({ editing, live, onSent, onNotify }) => {
  const [changeNote, setChangeNote] = useState("");
  const [sending, setSending] = useState(false);

  const sentVersion = live?.sentVersion;
  const dirty = !live || contentKey(editing) !== contentKey(live);
  const needsSend = !sentVersion || !!live?.hasUnsentChanges || dirty;
  const link = proposalLink(editing);

  const handleSend = async () => {
    const { total } = proposalTotals(editing);
    if (!editing.clientName.trim() || !editing.clientEmail.trim() || !editing.title.trim()) {
      onNotify("Add the client's name, email and a proposal title before sending.");
      return;
    }
    if (total <= 0) {
      onNotify("Add pricing before sending: the total is GH¢ 0.");
      return;
    }
    setSending(true);
    try {
      const sent = await sendProposal(editing, sentVersion ? changeNote : undefined);
      onSent(sent);
      setChangeNote("");
      onNotify(sentVersion ? `Update sent: the client now sees v${sent.version}` : "Proposal sent. Share the link with your client.");
    } catch (err) {
      console.error("Sending proposal failed:", err);
      onNotify("Couldn't send the proposal. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const shareText = `Hello ${editing.clientName}! Here's your proposal from N.O.K Social: ${link}\n\nYou can leave comments or request changes right on the page.`;

  return (
    <div className="space-y-3 pt-3 border-t border-white/5">
      {needsSend && (
        <div className="space-y-2">
          {sentVersion && (
            <textarea
              rows={2}
              placeholder="What changed? (shown to the client, optional)"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              className={input}
            />
          )}
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full py-2.5 rounded-xl neu-gold-filled text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{sentVersion ? `Send update (v${nextSendVersion(editing)})` : "Send to client"}</span>
          </button>
          <p className="text-[11px] text-[#8A8A93] leading-relaxed">
            {sentVersion
              ? `The client still sees v${sentVersion} until you send this update.`
              : "Saves this version and creates the client's private link."}
          </p>
        </div>
      )}

      {sentVersion && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase text-[#8A8A93]">Client link (v{sentVersion})</div>
          <div className="flex items-center gap-1.5">
            <input readOnly value={link} className={`${input} font-mono text-[10px]`} onFocus={(e) => e.target.select()} />
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  onNotify("Link copied");
                } catch {
                  onNotify("Couldn't copy. Select the link and copy it manually.");
                }
              }}
              className="p-2 rounded-lg neu-raised text-[#B08D57] cursor-pointer shrink-0"
              title="Copy link"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center space-x-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            <a
              href={`mailto:${editing.clientEmail}?subject=${encodeURIComponent(`Your proposal: ${editing.title}`)}&body=${encodeURIComponent(shareText)}`}
              className="flex-1 py-2 rounded-lg neu-raised text-[11px] font-semibold text-[#F2F0EB] flex items-center justify-center space-x-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Email</span>
            </a>
          </div>
          <p className="text-[11px] font-mono text-[#8A8A93] flex items-center space-x-1.5">
            <Eye className="w-3 h-3" />
            <span>{live?.lastViewedAt ? `Client last viewed ${formatWhen(live.lastViewedAt)}` : "Not opened by the client yet"}</span>
          </p>
        </div>
      )}
    </div>
  );
};

// The comment thread with the client, with staff replies.
export const ProposalComments: React.FC<{ proposal: Proposal; onNotify: (msg: string) => void }> = ({ proposal, onNotify }) => {
  const [comments, setComments] = useState<ProposalComment[]>([]);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => subscribeToProposalComments(proposal.id, setComments), [proposal.id]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setPosting(true);
    try {
      const user = auth.currentUser;
      const name = user?.displayName || user?.email?.split("@")[0] || "N.O.K Social team";
      await addStaffReply(proposal, name, reply.trim());
      setReply("");
    } catch (err) {
      console.error("Posting reply failed:", err);
      onNotify("Couldn't post your reply. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="p-5 rounded-2xl neu-raised space-y-4 max-w-3xl">
      <h3 className="text-sm font-bold text-[#F2F0EB]">Conversation with {proposal.clientName}</h3>
      {comments.length === 0 && <p className="text-xs text-[#8A8A93]">No comments yet. The client can comment from their proposal page.</p>}
      <ul className="space-y-2.5">
        {comments.map((c) => (
          <li key={c.id} className={`p-3 rounded-xl neu-pressed text-xs space-y-1 ${c.author === "staff" ? "border-l-2 border-[#B08D57]" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#8A8A93]">
              <span className={c.author === "staff" ? "text-[#C5A065] font-semibold" : "text-[#F2F0EB] font-semibold"}>{c.name}</span>
              <span>{formatWhen(c.createdAt)}</span>
              <span>· v{c.version}</span>
              {c.kind === "change_request" && (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <PenLine className="w-3 h-3" />
                  <span>Change request</span>
                </span>
              )}
              {c.section && <span className="px-2 py-0.5 rounded-full bg-white/5 text-zinc-300">{c.section}</span>}
            </div>
            <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">{c.message}</p>
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <textarea
          rows={3}
          placeholder="Reply to the client (they'll see it on their proposal page)…"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className={input}
        />
        <button
          onClick={handleReply}
          disabled={posting || !reply.trim()}
          className="px-4 py-2 rounded-xl neu-raised text-xs font-bold text-[#B08D57] flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>Post reply</span>
        </button>
      </div>
    </section>
  );
};

// Payments on an accepted proposal, and the switch that lets the client pay the balance.
export const ProposalPaymentsPanel: React.FC<{ proposal: Proposal; onNotify: (msg: string) => void }> = ({ proposal, onNotify }) => {
  const [payments, setPayments] = useState<ProposalPayment[]>([]);
  const [updating, setUpdating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const retryZohoSync = async () => {
    setSyncing(true);
    try {
      const resp = await apiFetch("/api/zoho/sync-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: proposal.id })
      });
      const data = await resp.json().catch(() => ({}));
      if (data.result === "synced") onNotify("Synced to Zoho Invoice");
      else if (data.result === "not_configured") onNotify("Zoho isn't connected yet: add the ZOHO_* settings on Render.");
      else onNotify(`Zoho sync failed: ${data.error || "unknown error"}`);
    } catch (err) {
      console.error("Zoho sync request failed:", err);
      onNotify("Couldn't reach the server. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => subscribeToProposalPayments(proposal.id, setPayments), [proposal.id]);

  const total = proposal.acceptedTotal || 0;
  const paid = proposal.amountPaid || 0;
  const balance = Math.max(0, Math.round((total - paid) * 100) / 100);
  const paidInFull = proposal.paymentStatus === "paid_in_full";
  const link = proposalLink(proposal);
  const balanceText = `Hello ${proposal.clientName}! Your project is ready for handover. You can pay the remaining balance of ${formatGhs(balance)} here: ${link}`;

  const toggleBalance = async (requested: boolean) => {
    setUpdating(true);
    try {
      await setBalanceRequested(proposal.id, requested);
      onNotify(requested ? "Balance payment opened: the client now sees a Pay balance button" : "Balance payment closed");
    } catch (err) {
      console.error("Updating balance request failed:", err);
      onNotify("Couldn't update the balance request. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const successful = payments.filter((p) => p.status === "success");

  return (
    <section className="p-5 rounded-2xl neu-raised space-y-4 max-w-3xl">
      <h3 className="flex items-center space-x-2 text-sm font-bold text-[#F2F0EB]">
        <Wallet className="w-4 h-4 text-[#B08D57]" />
        <span>Payments</span>
      </h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[["Total", total], ["Paid", paid], ["Balance", balance]].map(([label, value]) => (
          <div key={label as string} className="p-3 rounded-xl neu-pressed">
            <div className="text-[10px] font-mono uppercase text-[#8A8A93]">{label}</div>
            <div className="text-sm font-bold font-mono text-[#F2F0EB] mt-1">{formatGhs(value as number)}</div>
          </div>
        ))}
      </div>

      {successful.length > 0 && (
        <ul className="space-y-1.5 text-xs">
          {successful.map((p) => (
            <li key={p.reference} className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg neu-pressed">
              <span className="text-[#F2F0EB] font-semibold capitalize">{p.kind}{p.duplicate ? " (duplicate: refund due)" : ""}</span>
              <span className="font-mono text-[#8A8A93]">{p.paidAt?.slice(0, 10)} · {p.channel?.replace("_", " ") || "—"}</span>
              <span className="font-mono text-[#F2F0EB]">{formatGhs(p.amount)}</span>
              <span className="w-full font-mono text-[10px] text-[var(--fin-sub)]">Ref: {p.reference}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl neu-pressed text-xs">
        <span className="flex items-center space-x-2">
          <Receipt className="w-3.5 h-3.5 text-[#B08D57]" />
          {proposal.zohoSyncError ? (
            <span className="text-rose-300">Zoho sync failed: {proposal.zohoSyncError}</span>
          ) : proposal.zohoInvoiceId ? (
            <span className="text-[#F2F0EB]">
              Zoho invoice {proposal.zohoInvoiceNumber || proposal.zohoInvoiceId}
              {successful.some((p) => !p.duplicate && !p.zohoPaymentId) ? " · syncing payments…" : " · payments recorded"}
            </span>
          ) : (
            <span className="text-[#8A8A93]">Not in Zoho Invoice yet</span>
          )}
        </span>
        {(proposal.zohoSyncError || !proposal.zohoInvoiceId || successful.some((p) => !p.duplicate && !p.zohoPaymentId)) && (
          <button
            onClick={retryZohoSync}
            disabled={syncing}
            className="px-2.5 py-1 rounded-lg neu-raised text-[11px] font-mono text-[#B08D57] flex items-center space-x-1 cursor-pointer disabled:opacity-50"
          >
            {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
            <span>{proposal.zohoInvoiceId || proposal.zohoSyncError ? "Retry Zoho sync" : "Send to Zoho"}</span>
          </button>
        )}
      </div>

      {paidInFull ? (
        <p className="text-xs text-emerald-300">Paid in full.</p>
      ) : proposal.balanceRequested ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-300">
            The client can now pay the {formatGhs(balance)} balance from their proposal link. Send them a reminder:
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(balanceText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center space-x-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            <a
              href={`mailto:${proposal.clientEmail}?subject=${encodeURIComponent(`Balance payment: ${proposal.title}`)}&body=${encodeURIComponent(balanceText)}`}
              className="px-3 py-2 rounded-lg neu-raised text-[11px] font-semibold text-[#F2F0EB] flex items-center space-x-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Email</span>
            </a>
            <button
              onClick={() => toggleBalance(false)}
              disabled={updating}
              className="px-3 py-2 rounded-lg neu-raised text-[11px] font-mono text-zinc-400 cursor-pointer disabled:opacity-50"
            >
              Close balance payment
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <button
            onClick={() => toggleBalance(true)}
            disabled={updating || balance <= 0}
            className="px-4 py-2 rounded-xl neu-gold-filled text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
          >
            {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
            <span>Request balance ({formatGhs(balance)})</span>
          </button>
          <p className="text-[11px] text-[#8A8A93]">Adds a Pay balance button to the client's proposal page. Do this at delivery.</p>
        </div>
      )}
    </section>
  );
};
