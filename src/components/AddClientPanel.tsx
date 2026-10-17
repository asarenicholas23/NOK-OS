import React, { useState } from "react";
import { UserPlus, X, Save, FileSignature, Loader2 } from "lucide-react";
import { useCms } from "../context/CmsContext";
import { DiscoveryRequest } from "../data/cmsData";

const input = "w-full px-3 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]";
const label = "block text-[10px] font-mono uppercase text-[#8A8A93] mb-1";

const STATUSES: DiscoveryRequest["status"][] = ["New", "Contacted", "Scheduled", "Converted", "Closed"];

// Lets staff add a client who didn't come through the public booking form.
// They join the Inbound Discovery Calls list like any other request.
export const AddClientPanel: React.FC<{
  onNotify: (msg: string) => void;
  onCreateProposal: (client: DiscoveryRequest) => void;
}> = ({ onNotify, onCreateProposal }) => {
  const { services, addManualClient } = useCms();
  const blank = { name: "", email: "", businessName: "", phone: "", serviceTier: services[0]?.title || "", notes: "", status: "Contacted" as DiscoveryRequest["status"] };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState<"save" | "proposal" | null>(null);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const save = async (thenProposal: boolean) => {
    if (!form.name.trim() || !form.email.trim() || !form.businessName.trim()) {
      onNotify("Add the client's name, email and business before saving.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      onNotify("That email address doesn't look right.");
      return;
    }
    setSaving(thenProposal ? "proposal" : "save");
    try {
      const client = await addManualClient({
        name: form.name.trim(),
        email: form.email.trim(),
        businessName: form.businessName.trim(),
        serviceTier: form.serviceTier,
        status: form.status,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {})
      });
      onNotify(`${client.name} added`);
      setForm(blank);
      setOpen(false);
      if (thenProposal) onCreateProposal(client);
    } catch (err) {
      console.error("Adding client failed:", err);
      onNotify("Couldn't add the client. Please check you're still logged in and try again.");
    } finally {
      setSaving(null);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl neu-gold-filled text-xs font-bold flex items-center space-x-1.5 cursor-pointer w-fit"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>Add Client</span>
      </button>
    );
  }

  return (
    <section className="p-5 rounded-2xl neu-raised space-y-3 border border-[#B08D57]/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#F2F0EB] flex items-center space-x-2">
          <UserPlus className="w-4 h-4 text-[#B08D57]" />
          <span>Add a client manually</span>
        </h3>
        <button onClick={() => setOpen(false)} className="p-1.5 text-[#8A8A93] hover:text-[#F2F0EB] cursor-pointer" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className={label}>Name *</label>
          <input className={input} value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div>
          <label className={label}>Email *</label>
          <input type="email" className={input} value={form.email} onChange={(e) => set({ email: e.target.value })} />
        </div>
        <div>
          <label className={label}>Business *</label>
          <input className={input} value={form.businessName} onChange={(e) => set({ businessName: e.target.value })} />
        </div>
        <div>
          <label className={label}>WhatsApp / phone</label>
          <input type="tel" placeholder="+233…" className={input} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        </div>
        <div>
          <label className={label}>Service</label>
          <select className={`${input} bg-[#121216]`} value={form.serviceTier} onChange={(e) => set({ serviceTier: e.target.value })}>
            {services.map((s) => <option key={s.id} value={s.title}>{s.title}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Status</label>
          <select className={`${input} bg-[#121216]`} value={form.status} onChange={(e) => set({ status: e.target.value as DiscoveryRequest["status"] })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={label}>Notes / goals</label>
        <textarea rows={3} className={input} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => save(false)}
          disabled={saving !== null}
          className="px-4 py-2 rounded-xl neu-gold-filled text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
        >
          {saving === "save" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Save client</span>
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving !== null}
          className="px-4 py-2 rounded-xl neu-raised text-xs font-bold text-[#B08D57] flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
        >
          {saving === "proposal" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSignature className="w-3.5 h-3.5" />}
          <span>Save & create proposal</span>
        </button>
      </div>
    </section>
  );
};

export default AddClientPanel;
