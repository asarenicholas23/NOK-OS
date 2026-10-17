import React, { useEffect, useState } from "react";
import { FileSignature, Plus, Trash2, Save, Eye, Edit3, X, ArrowLeft, Lock, MessageCircle } from "lucide-react";
import { useCms } from "../context/CmsContext";
import {
  Proposal,
  ProposalStatus,
  DiscoveryRequest,
  isWebsiteBuild,
  hasNewClientComments,
  proposalTotals,
  formatGhs
} from "../data/cmsData";
import {
  subscribeToProposals,
  saveProposal,
  deleteProposal,
  createDraftProposal,
  newRowId,
  nextSendVersion,
  markProposalSeen
} from "../lib/proposals";
import { ProposalDocument } from "./ProposalDocument";
import { ProposalSendPanel, ProposalComments, ProposalPaymentsPanel } from "./ProposalStaffPanels";

const STATUS_LABELS: Record<ProposalStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-white/5 text-zinc-300 border-white/10" },
  sent: { label: "Sent", cls: "bg-violet-500/10 text-violet-300 border-violet-500/30" },
  changes_requested: { label: "Changes requested", cls: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
  accepted: { label: "Order confirmed · deposit paid", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
  declined: { label: "Declined", cls: "bg-rose-500/10 text-rose-300 border-rose-500/30" }
};

const input = "w-full px-3 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]";
const label = "block text-[10px] font-mono uppercase text-[#8A8A93] mb-1";

interface ProposalsTabProps {
  // Set when staff click "Create proposal" on a discovery call lead.
  seedLead: DiscoveryRequest | null;
  onSeedConsumed: () => void;
  onNotify: (msg: string) => void;
}

export const ProposalsTab: React.FC<ProposalsTabProps> = ({ seedLead, onSeedConsumed, onNotify }) => {
  const { services, agencyInfo } = useCms();
  const [proposals, setProposals] = useState<Proposal[] | null>(null); // null until first load
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => subscribeToProposals(setProposals), []);

  useEffect(() => {
    if (!seedLead || !proposals) return;
    const existing = proposals.find((p) => p.requestId === seedLead.id);
    setEditing(existing ?? createDraftProposal(services, seedLead));
    setPreview(false);
    onSeedConsumed();
  }, [seedLead, proposals, services, onSeedConsumed]);

  // The saved copy of the open proposal, which also carries server-side
  // updates (client comments, change requests) the local editor state lacks.
  const live = editing ? proposals?.find((p) => p.id === editing.id) : undefined;
  const status = live?.status ?? editing?.status ?? "draft";
  const locked = status === "accepted";

  // Clear the "new comment" badge while staff have the proposal open.
  useEffect(() => {
    if (live && hasNewClientComments(live)) {
      markProposalSeen(live.id).catch((err) => console.warn("Marking proposal seen failed:", err));
    }
  }, [live]);
  const update = (patch: Partial<Proposal>) => setEditing((p) => (p ? { ...p, ...patch } : p));

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.clientName.trim() || !editing.clientEmail.trim() || !editing.title.trim()) {
      onNotify("Add the client's name, email and a proposal title before saving.");
      return;
    }
    setSaving(true);
    try {
      await saveProposal(editing);
      onNotify("Proposal saved");
    } catch (err) {
      console.error("Saving proposal failed:", err);
      onNotify("Couldn't save the proposal. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProposal(id);
      onNotify("Proposal deleted");
    } catch (err) {
      console.error("Deleting proposal failed:", err);
      onNotify("Couldn't delete the proposal. Please try again.");
    }
    setDeletingId(null);
  };

  // ── Editor ───────────────────────────────────────────────────────────────
  if (editing) {
    const { total, deposit, balance } = proposalTotals(editing);
    const minimum = proposalTotals(editing, []).total; // required items only
    const hasOptional = editing.lineItems.some((li) => !li.required);
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setEditing(null)}
            className="px-3 py-2 rounded-xl neu-raised text-xs font-mono text-zinc-300 hover:text-[#F2F0EB] flex items-center space-x-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All proposals</span>
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${STATUS_LABELS[status].cls}`}>
              {STATUS_LABELS[status].label}
              {live?.sentVersion ? ` · client sees v${live.sentVersion}` : ""}
              {live?.hasUnsentChanges ? " · unsent changes" : ""}
            </span>
            <button
              onClick={() => setPreview((v) => !v)}
              className="px-3 py-2 rounded-xl neu-raised text-xs font-mono text-[#B08D57] flex items-center space-x-1.5 cursor-pointer"
            >
              {preview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{preview ? "Edit" : "Preview as client"}</span>
            </button>
            {!locked && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl neu-gold-filled text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving…" : "Save"}</span>
              </button>
            )}
          </div>
        </div>

        {locked && (
          <p className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-200 flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5" />
            <span>
              The client confirmed their order from v{live?.acceptedVersion} by paying the deposit
              {live?.acceptedItemIds && live.acceptedItemIds.length < editing.lineItems.length
                ? ` (${live.acceptedItemIds.length} of ${editing.lineItems.length} items, ${formatGhs(live.acceptedTotal || 0)})`
                : ""}
              , so this proposal is locked. Scope changes need a new proposal.
            </span>
          </p>
        )}

        {preview || locked ? (
          <div className="p-6 sm:p-10 rounded-3xl neu-raised max-w-3xl">
            <ProposalDocument
              proposal={{
                ...editing,
                version: live?.sentVersion && (locked || !live.hasUnsentChanges) ? live.sentVersion : nextSendVersion(editing)
              }}
              agencyName={agencyInfo.name}
              selectedIds={locked ? live?.acceptedItemIds : null}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 space-y-5">
              {/* Client */}
              <section className="p-5 rounded-2xl neu-raised space-y-3">
                <h3 className="text-sm font-bold text-[#F2F0EB]">Client</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={label}>Name *</label>
                    <input className={input} value={editing.clientName} onChange={(e) => update({ clientName: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Email *</label>
                    <input type="email" className={input} value={editing.clientEmail} onChange={(e) => update({ clientEmail: e.target.value })} />
                  </div>
                  <div>
                    <label className={label}>Business</label>
                    <input className={input} value={editing.businessName} onChange={(e) => update({ businessName: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Service</label>
                    <select
                      className={`${input} bg-[#121216]`}
                      value={editing.serviceTier}
                      onChange={(e) => {
                        const service = services.find((s) => s.title === e.target.value);
                        update({ serviceTier: e.target.value, ...(service ? { isWebsiteBuild: isWebsiteBuild(service) } : {}) });
                      }}
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.title}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer sm:pt-5">
                    <input
                      type="checkbox"
                      className="accent-[#B08D57]"
                      checked={editing.isWebsiteBuild}
                      onChange={(e) => update({ isWebsiteBuild: e.target.checked })}
                    />
                    <span>Website / systems build <span className="text-[#8A8A93]">(no NOK OS brand workspace)</span></span>
                  </label>
                </div>
              </section>

              {/* Overview */}
              <section className="p-5 rounded-2xl neu-raised space-y-3">
                <h3 className="text-sm font-bold text-[#F2F0EB]">Proposal</h3>
                <div>
                  <label className={label}>Title *</label>
                  <input className={input} value={editing.title} onChange={(e) => update({ title: e.target.value })} />
                </div>
                <div>
                  <label className={label}>Overview: goals and what we'll do (markdown)</label>
                  <textarea rows={6} className={input} value={editing.overview} onChange={(e) => update({ overview: e.target.value })} />
                </div>
              </section>

              {/* Build plan */}
              <section className="p-5 rounded-2xl neu-raised space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#F2F0EB]">Project build plan</h3>
                  <button
                    onClick={() => update({ phases: [...editing.phases, { id: newRowId(), title: "", duration: "", deliverables: [] }] })}
                    className="px-2.5 py-1.5 rounded-lg neu-raised text-[11px] font-mono text-[#B08D57] flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add phase</span>
                  </button>
                </div>
                {editing.phases.map((phase, i) => (
                  <div key={phase.id} className="p-3 rounded-xl neu-pressed space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-[#B08D57] w-6">{String(i + 1).padStart(2, "0")}</span>
                      <input
                        placeholder="Phase title"
                        className={input}
                        value={phase.title}
                        onChange={(e) => update({ phases: editing.phases.map((p) => (p.id === phase.id ? { ...p, title: e.target.value } : p)) })}
                      />
                      <input
                        placeholder="e.g. Week 1–2"
                        className={`${input} max-w-[9rem]`}
                        value={phase.duration}
                        onChange={(e) => update({ phases: editing.phases.map((p) => (p.id === phase.id ? { ...p, duration: e.target.value } : p)) })}
                      />
                      <button
                        onClick={() => update({ phases: editing.phases.filter((p) => p.id !== phase.id) })}
                        className="p-2 text-rose-400 hover:text-rose-300 cursor-pointer"
                        aria-label="Remove phase"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Deliverables, one per line"
                      className={input}
                      value={phase.deliverables.join("\n")}
                      onChange={(e) => update({ phases: editing.phases.map((p) => (p.id === phase.id ? { ...p, deliverables: e.target.value.split("\n") } : p)) })}
                    />
                  </div>
                ))}
              </section>

              {/* Pricing */}
              <section className="p-5 rounded-2xl neu-raised space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#F2F0EB]">Pricing (GH¢)</h3>
                    <p className="text-[11px] text-[#8A8A93] mt-0.5">The client ticks the items they want. Mark an item required to include it in every order.</p>
                  </div>
                  <button
                    onClick={() => update({ lineItems: [...editing.lineItems, { id: newRowId(), title: "", description: "", amount: 0 }] })}
                    className="px-2.5 py-1.5 rounded-lg neu-raised text-[11px] font-mono text-[#B08D57] flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add line</span>
                  </button>
                </div>
                {editing.lineItems.map((li) => (
                  <div key={li.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <input
                      placeholder="Item"
                      className={input}
                      value={li.title}
                      onChange={(e) => update({ lineItems: editing.lineItems.map((x) => (x.id === li.id ? { ...x, title: e.target.value } : x)) })}
                    />
                    <input
                      placeholder="Description (optional)"
                      className={input}
                      value={li.description || ""}
                      onChange={(e) => update({ lineItems: editing.lineItems.map((x) => (x.id === li.id ? { ...x, description: e.target.value } : x)) })}
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={`${input} sm:max-w-[8rem] text-right`}
                      value={li.amount}
                      onChange={(e) => update({ lineItems: editing.lineItems.map((x) => (x.id === li.id ? { ...x, amount: Number(e.target.value) } : x)) })}
                    />
                    <label className="flex items-center space-x-1.5 text-[11px] font-mono text-zinc-300 cursor-pointer shrink-0" title="Always included; the client can't untick it">
                      <input
                        type="checkbox"
                        className="accent-[#B08D57]"
                        checked={!!li.required}
                        onChange={(e) => update({ lineItems: editing.lineItems.map((x) => (x.id === li.id ? { ...x, required: e.target.checked } : x)) })}
                      />
                      <span>Required</span>
                    </label>
                    <button
                      onClick={() => update({ lineItems: editing.lineItems.filter((x) => x.id !== li.id) })}
                      className="p-2 text-rose-400 hover:text-rose-300 cursor-pointer"
                      aria-label="Remove line"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </section>

              {/* Terms */}
              <section className="p-5 rounded-2xl neu-raised space-y-3">
                <h3 className="text-sm font-bold text-[#F2F0EB]">Terms (markdown)</h3>
                <textarea rows={6} className={input} value={editing.terms} onChange={(e) => update({ terms: e.target.value })} />
              </section>
            </div>

            {/* Summary sidebar */}
            <aside className="space-y-4">
              <div className="p-5 rounded-2xl neu-raised space-y-3 xl:sticky xl:top-4">
                <h3 className="text-sm font-bold text-[#F2F0EB]">Summary</h3>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between"><span className="text-[#8A8A93]">Total (all items)</span><span className="text-[#F2F0EB] font-bold">{formatGhs(total)}</span></div>
                  <div className="flex justify-between"><span className="text-[#B08D57]">Deposit</span><span className="text-[#B08D57] font-bold">{formatGhs(deposit)}</span></div>
                  <div className="flex justify-between"><span className="text-[#8A8A93]">Balance</span><span className="text-zinc-300">{formatGhs(balance)}</span></div>
                  {hasOptional && minimum > 0 && (
                    <div className="flex justify-between pt-1.5 border-t border-white/5"><span className="text-[#8A8A93]">Smallest order</span><span className="text-zinc-300">{formatGhs(minimum)}</span></div>
                  )}
                </div>
                <p className="text-[11px] text-[#8A8A93]">The client pays the deposit on the items they choose. That payment confirms the order.</p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className={label}>Deposit %</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className={input}
                      value={editing.depositPercent}
                      onChange={(e) => update({ depositPercent: Math.min(100, Math.max(1, Number(e.target.value) || 0)) })}
                    />
                  </div>
                  <div>
                    <label className={label}>Valid until</label>
                    <input type="date" className={input} value={editing.validUntil || ""} onChange={(e) => update({ validUntil: e.target.value })} />
                  </div>
                </div>
                {!locked && (
                  <ProposalSendPanel editing={editing} live={live} onSent={setEditing} onNotify={onNotify} />
                )}
              </div>
            </aside>
          </div>
        )}

        {live?.status === "accepted" && <ProposalPaymentsPanel proposal={live} onNotify={onNotify} />}
        {live?.sentVersion && <ProposalComments proposal={live} onNotify={onNotify} />}
      </div>
    );
  }

  // ── List ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold font-display text-[#F2F0EB]">Client Proposals</h2>
          <p className="text-xs text-[#8A8A93] mt-0.5">
            Tailored build plans and pricing sent after a discovery call. Start one from a lead, or from scratch.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(createDraftProposal(services));
            setPreview(false);
          }}
          className="px-4 py-2 rounded-xl neu-gold-filled text-xs font-bold flex items-center space-x-1.5 cursor-pointer w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Proposal</span>
        </button>
      </div>

      <div className="space-y-3">
        {proposals?.map((p) => {
          const total = p.status === "accepted" && p.acceptedTotal ? p.acceptedTotal : proposalTotals(p).total;
          return (
            <div key={p.id} className="p-4 rounded-2xl neu-raised flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/5">
              <button onClick={() => { setEditing(p); setPreview(false); }} className="text-left space-y-1 cursor-pointer flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm text-[#F2F0EB]">{p.title}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_LABELS[p.status].cls}`}>
                    {STATUS_LABELS[p.status].label}
                  </span>
                  {hasNewClientComments(p) && (
                    <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                      <MessageCircle className="w-3 h-3" />
                      <span>New comment</span>
                    </span>
                  )}
                  {p.isWebsiteBuild && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300">Website build</span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-[#8A8A93]">
                  {p.clientName} · {p.businessName} · {formatGhs(total)}
                  {p.sentVersion ? ` · v${p.sentVersion} sent` : ""}
                  {p.amountPaid ? ` · ${formatGhs(p.amountPaid)} paid${p.paymentStatus === "paid_in_full" ? " (in full)" : ""}` : ""}
                  {p.lastViewedAt ? ` · viewed ${p.lastViewedAt.slice(0, 10)}` : ""}
                  {` · updated ${p.updatedAt.slice(0, 10)}`}
                </div>
              </button>
              {p.status !== "accepted" && (deletingId === p.id ? (
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-rose-300">Delete proposal?</span>
                  <button onClick={() => setDeletingId(null)} className="px-2 py-1 rounded neu-raised text-[10px] font-mono text-zinc-400 cursor-pointer">Cancel</button>
                  <button onClick={() => handleDelete(p.id)} className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-mono font-bold cursor-pointer">Delete</button>
                </div>
              ) : (
                <button onClick={() => setDeletingId(p.id)} className="p-2 rounded-xl neu-pressed text-rose-400 hover:text-rose-300 cursor-pointer w-fit" title="Delete proposal">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          );
        })}

        {proposals?.length === 0 && (
          <div className="text-center py-12 rounded-2xl neu-pressed text-[#8A8A93] space-y-2">
            <FileSignature className="w-8 h-8 text-[#B08D57] mx-auto opacity-50" />
            <p className="text-xs font-mono">No proposals yet. Use "Create proposal" on a discovery call lead to start one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalsTab;
