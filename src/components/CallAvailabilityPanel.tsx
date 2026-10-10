import React, { useEffect, useState } from "react";
import { CalendarClock, ChevronDown, ChevronUp, Save, X, Plus } from "lucide-react";
import { useCms } from "../context/CmsContext";
import { CallAvailability } from "../data/cmsData";
import { generateSlotIds } from "../utils/discoverySlots";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// CMS editor for when visitors can book discovery calls. Times are Ghana time (GMT).
export const CallAvailabilityPanel: React.FC<{ onSaved: (msg: string) => void }> = ({ onSaved }) => {
  const { callAvailability, updateCallAvailability } = useCms();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CallAvailability>(callAvailability);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pick up the live settings until staff start editing.
  useEffect(() => {
    if (!open) setForm(callAvailability);
  }, [callAvailability, open]);

  const setDay = (index: number, patch: Partial<CallAvailability["weekly"][number]>) => {
    setForm((prev) => ({
      ...prev,
      weekly: prev.weekly.map((d, i) => (i === index ? { ...d, ...patch } : d))
    }));
  };

  const addBlockedDate = () => {
    if (!newBlockedDate || form.blockedDates.includes(newBlockedDate)) return;
    setForm((prev) => ({ ...prev, blockedDates: [...prev.blockedDates, newBlockedDate].sort() }));
    setNewBlockedDate("");
  };

  const handleSave = async () => {
    const badDay = form.weekly.findIndex((d) => d.enabled && d.start >= d.end);
    if (badDay !== -1) {
      setError(`${WEEKDAYS[badDay]}: end time must be after start time.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Drop blocked dates that have already passed.
      const today = new Date().toISOString().slice(0, 10);
      await updateCallAvailability({ ...form, blockedDates: form.blockedDates.filter((d) => d >= today) });
      onSaved("Call availability saved");
      setOpen(false);
    } catch (err) {
      console.error("Saving call availability failed:", err);
      setError("Couldn't save availability. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const openSlotCount = generateSlotIds(open ? form : callAvailability).length;
  const numberInput = "w-20 px-3 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]";

  return (
    <div className="rounded-2xl neu-raised border border-white/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full p-4 flex items-center justify-between gap-3 cursor-pointer"
      >
        <div className="flex items-center space-x-2 text-left">
          <CalendarClock className="w-4 h-4 text-[#B08D57] shrink-0" />
          <div>
            <div className="text-sm font-bold text-[#F2F0EB]">Call Availability</div>
            <div className="text-[11px] font-mono text-[#8A8A93]">
              {openSlotCount} bookable slots over the next {callAvailability.daysAhead} days (before bookings) · Ghana time (GMT)
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#8A8A93]" /> : <ChevronDown className="w-4 h-4 text-[#8A8A93]" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-5 border-t border-white/5 pt-4">
          <div className="flex flex-wrap gap-4 text-xs">
            <label className="space-y-1">
              <span className="block text-[10px] font-mono uppercase text-[#8A8A93]">Call length (mins)</span>
              <input
                type="number"
                min={10}
                step={5}
                value={form.slotMinutes}
                onChange={(e) => setForm({ ...form, slotMinutes: Number(e.target.value) })}
                className={numberInput}
              />
            </label>
            <label className="space-y-1">
              <span className="block text-[10px] font-mono uppercase text-[#8A8A93]">Min notice (hours)</span>
              <input
                type="number"
                min={0}
                value={form.minNoticeHours}
                onChange={(e) => setForm({ ...form, minNoticeHours: Number(e.target.value) })}
                className={numberInput}
              />
            </label>
            <label className="space-y-1">
              <span className="block text-[10px] font-mono uppercase text-[#8A8A93]">Book up to (days ahead)</span>
              <input
                type="number"
                min={1}
                max={90}
                value={form.daysAhead}
                onChange={(e) => setForm({ ...form, daysAhead: Number(e.target.value) })}
                className={numberInput}
              />
            </label>
          </div>

          <div className="space-y-2">
            <span className="block text-[10px] font-mono uppercase text-[#8A8A93]">Weekly hours</span>
            {form.weekly.map((day, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center space-x-2 w-28 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => setDay(i, { enabled: e.target.checked })}
                    className="accent-[#B08D57]"
                  />
                  <span className={day.enabled ? "text-[#F2F0EB]" : "text-[var(--fin-sub)]"}>{WEEKDAYS[i]}</span>
                </label>
                {day.enabled ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={day.start}
                      onChange={(e) => setDay(i, { start: e.target.value })}
                      className="px-2 py-1.5 rounded-lg neu-pressed-deep text-xs text-[#F2F0EB] outline-none"
                    />
                    <span className="text-[#8A8A93]">to</span>
                    <input
                      type="time"
                      value={day.end}
                      onChange={(e) => setDay(i, { end: e.target.value })}
                      className="px-2 py-1.5 rounded-lg neu-pressed-deep text-xs text-[#F2F0EB] outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-[11px] font-mono text-[var(--fin-sub)]">Unavailable</span>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <span className="block text-[10px] font-mono uppercase text-[#8A8A93]">Days off (holidays, leave)</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className="px-2 py-1.5 rounded-lg neu-pressed-deep text-xs text-[#F2F0EB] outline-none"
              />
              <button
                type="button"
                onClick={addBlockedDate}
                className="px-3 py-1.5 rounded-lg neu-raised text-[11px] font-mono text-[#B08D57] flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
            {form.blockedDates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.blockedDates.map((d) => (
                  <span key={d} className="px-2.5 py-1 rounded-lg neu-pressed text-[11px] font-mono text-zinc-300 flex items-center space-x-1.5">
                    <span>{d}</span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, blockedDates: form.blockedDates.filter((x) => x !== d) })}
                      className="text-rose-400 hover:text-rose-300 cursor-pointer"
                      aria-label={`Remove ${d}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-[11px] text-rose-300">{error}</p>}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3.5 py-2 rounded-xl neu-raised text-xs font-mono text-zinc-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl neu-gold-filled text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving…" : "Save Availability"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallAvailabilityPanel;
