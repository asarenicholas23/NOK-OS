import React, { useEffect, useMemo, useState } from "react";
import { X, CheckCircle2, Send, MessageSquare, CalendarClock, Loader2, AlertTriangle } from "lucide-react";
import { useCms } from "../context/CmsContext";
import { db, subscribeToTakenSlots } from "../lib/firebase";
import {
  generateSlotIds,
  slotDateKey,
  formatSlotDay,
  formatSlotTime,
  formatSlotFull,
  viewerIsOffGmt
} from "../utils/discoverySlots";

interface ServiceItem {
  title: string;
  ghsPrice: string;
}

interface DiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTier: string;
  services: ServiceItem[];
}

export const DiscoveryModal: React.FC<DiscoveryModalProps> = ({
  isOpen,
  onClose,
  serviceTier,
  services,
}) => {
  const { addDiscoveryRequest, agencyInfo, callAvailability } = useCms();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    serviceTier: serviceTier || "Growth Retainer",
    notes: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    return subscribeToTakenSlots(setTakenSlots);
  }, [isOpen]);

  // Open slots grouped by Accra calendar day, in order.
  const slotsByDay = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const id of generateSlotIds(callAvailability)) {
      if (takenSlots.has(id)) continue;
      const key = slotDateKey(id);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(id);
    }
    return groups;
  }, [callAvailability, takenSlots]);

  const days = Array.from(slotsByDay.keys());
  const activeDay = selectedDay && slotsByDay.has(selectedDay) ? selectedDay : days[0] ?? null;
  const noSlotsAvailable = days.length === 0;
  const showLocalTime = viewerIsOffGmt();

  // If someone else books the selected time while this modal is open, drop it.
  // Skipped while submitting: Firestore reports our own pending write as taken.
  useEffect(() => {
    if (selectedSlot && takenSlots.has(selectedSlot) && !submitting && !submitted) {
      setSelectedSlot(null);
      setError("Sorry, that time was just booked by someone else. Please pick another.");
    }
  }, [takenSlots, selectedSlot, submitting, submitted]);

  if (!isOpen) return null;

  const isSlotTakenOnServer = async (slotId: string) => {
    try {
      const { doc, getDocFromServer } = await import("firebase/firestore");
      return (await getDocFromServer(doc(db, "discoverySlots", slotId))).exists();
    } catch {
      return false;
    }
  };

  const closeModal = () => {
    onClose();
    setSubmitted(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.businessName) return;
    if (!selectedSlot && !noSlotsAvailable) {
      setError("Please choose a time for your call.");
      return;
    }

    setSubmitting(true);
    setError(null);
    // Offline, Firestore queues the write and never settles, so don't spin forever.
    let timedOut = false;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => {
        timedOut = true;
        reject(new Error("timeout"));
      }, 20000)
    );
    try {
      const save = addDiscoveryRequest({
        name: formData.name,
        email: formData.email,
        businessName: formData.businessName,
        serviceTier: formData.serviceTier,
        notes: formData.notes,
        ...(selectedSlot ? { slotStart: selectedSlot } : {})
      });
      await Promise.race([save, timeout]);
      setSubmitted(true);
    } catch (err) {
      console.error("Discovery call booking failed:", err);
      if (timedOut) {
        setError("This is taking longer than usual. Your connection may be down. Your booking may still go through once you're back online; if you don't hear from us, message us on WhatsApp.");
      } else if (selectedSlot && (await isSlotTakenOnServer(selectedSlot))) {
        setSelectedSlot(null);
        setError("Sorry, that time was just booked by someone else. Please pick another.");
      } else {
        setError("We couldn't save your booking. Please check your connection and try again, or message us on WhatsApp.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsappUrl = (booked: boolean) => {
    const rawPhone = (agencyInfo.whatsapp || "+233235337886").replace(/[^0-9]/g, "");
    const intro = booked
      ? "Hello NOK Social! I just booked a Discovery Call on your website."
      : "Hello NOK Social! I tried to book a Discovery Call on your website but it didn't go through.";
    const time = selectedSlot ? `\n*Call time:* ${formatSlotFull(selectedSlot)}` : "";
    const message = `${intro}\n\n*Name:* ${formData.name}\n*Brand:* ${formData.businessName}\n*Email:* ${formData.email}\n*Service Tier:* ${formData.serviceTier}${time}\n*Goals:* ${formData.notes || "N/A"}`;
    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl neu-raised-lg p-6 sm:p-8 relative space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 p-2 rounded-xl neu-raised text-zinc-200 hover:text-[#F2F0EB] cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl neu-pressed text-[#B08D57] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#B08D57]" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#F2F0EB]">
              {selectedSlot ? "Discovery Call Booked!" : "Request Received!"}
            </h3>
            <p className="text-xs text-zinc-200 max-w-sm mx-auto leading-relaxed">
              Thank you, <span className="text-[#F2F0EB] font-semibold">{formData.name}</span>.{" "}
              {selectedSlot ? (
                <>
                  Your call is booked for{" "}
                  <span className="text-[#B08D57] font-semibold">{formatSlotFull(selectedSlot)}</span>
                  {showLocalTime && <> ({formatSlotTime(selectedSlot, Intl.DateTimeFormat().resolvedOptions().timeZone)} your time)</>}.
                  We'll send the call details to {formData.email}.
                </>
              ) : (
                <>We'll reach out to {formData.email} to arrange a time for your call.</>
              )}
            </p>

            <div className="p-4 rounded-2xl neu-pressed bg-[#111115] border border-emerald-500/20 text-left space-y-2">
              <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                <span>✓ Instant WhatsApp Connect</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Want an immediate response? Connect directly with our lead strategist on WhatsApp right now:
              </p>
              <a
                href={getWhatsappUrl(true)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer mt-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Directly on WhatsApp</span>
              </a>
            </div>

            <button
              onClick={closeModal}
              className="neu-gold-btn px-6 py-2.5 rounded-xl text-xs font-bold font-mono cursor-pointer mt-2"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="text-xs font-mono text-[#B08D57] uppercase tracking-wider font-semibold">NOK Social Agency</div>
              <h3 className="font-display text-xl font-bold text-[#F2F0EB]">Book a Discovery Call</h3>
              <p className="text-xs text-zinc-200 mt-1">
                A free {callAvailability.slotMinutes}-minute call to understand your brand. We'll follow up with a tailored proposal.
              </p>
            </div>

            {/* Call time picker */}
            <div className="space-y-2 pt-2">
              <label className="flex items-center space-x-1.5 text-[10px] font-mono uppercase text-zinc-200">
                <CalendarClock className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>Choose a Call Time * <span className="normal-case text-zinc-400">(Ghana time, GMT)</span></span>
              </label>

              {noSlotsAvailable ? (
                <p className="p-3 rounded-xl neu-pressed text-[11px] text-zinc-300">
                  No call times are open right now. Send your details and we'll reach out to arrange one.
                </p>
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {days.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={`px-3 py-2 rounded-xl text-[11px] font-mono font-semibold shrink-0 cursor-pointer transition-all ${
                          activeDay === day ? "bg-[#B08D57] text-[#111115]" : "neu-raised text-zinc-200 hover:text-[#F2F0EB]"
                        }`}
                      >
                        {formatSlotDay(slotsByDay.get(day)![0])}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {activeDay && slotsByDay.get(activeDay)!.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(id);
                          setError(null);
                        }}
                        className={`py-2 rounded-xl text-[11px] font-mono font-semibold cursor-pointer transition-all ${
                          selectedSlot === id ? "bg-[#B08D57] text-[#111115]" : "neu-pressed-deep text-[#F2F0EB] hover:ring-1 hover:ring-[#B08D57]"
                        }`}
                      >
                        {formatSlotTime(id)}
                      </button>
                    ))}
                  </div>
                  {selectedSlot && (
                    <p className="text-[11px] text-[#B08D57] font-mono">
                      Selected: {formatSlotFull(selectedSlot)}
                      {showLocalTime && (
                        <span className="text-zinc-400"> · {formatSlotTime(selectedSlot, Intl.DateTimeFormat().resolvedOptions().timeZone)} your time</span>
                      )}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ama Osei"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ama@brand.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Business or Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Osu Vintage Kicks"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Service You're Interested In</label>
                <select
                  value={formData.serviceTier}
                  onChange={(e) => setFormData({ ...formData, serviceTier: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] bg-[#121216] outline-none focus:ring-1 focus:ring-[#B08D57]"
                >
                  {services.map((s, i) => (
                    <option key={i} value={s.title}>{s.title} ({s.ghsPrice})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Primary Goal / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your target channels or campaign goals..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-[11px] text-rose-200 space-y-2">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {formData.name && formData.email && (
                  <a
                    href={getWhatsappUrl(false)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-emerald-300 hover:text-emerald-200 font-semibold"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send your details on WhatsApp instead</span>
                  </a>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl neu-gold-filled text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-md mt-4 disabled:opacity-60 disabled:cursor-wait"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{submitting ? "Booking…" : selectedSlot || noSlotsAvailable ? "Book My Discovery Call" : "Choose a Time Above"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DiscoveryModal;
