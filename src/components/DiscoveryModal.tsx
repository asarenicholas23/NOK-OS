import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { X, CheckCircle2, Send, MessageSquare, CalendarClock, Loader2, AlertTriangle } from "lucide-react";
import { useCms } from "../context/CmsContext";
import { booking as t } from "../content/siteContent";
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
  featured?: boolean;
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
    // Default to the "most picked" package when nothing is preselected.
    serviceTier: serviceTier || (services.find((s) => s.featured) ?? services[0])?.title || "",
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
      setError(t.errors.slotTaken);
    }
  }, [takenSlots, selectedSlot, submitting, submitted]);

  // Dialog behaviour: Escape closes, focus moves into the dialog on open and
  // back to whatever opened it on close.
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const fid = useId();
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
      setError(t.errors.chooseTime);
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
        setError(t.errors.timeout);
      } else if (selectedSlot && (await isSlotTakenOnServer(selectedSlot))) {
        setSelectedSlot(null);
        setError(t.errors.slotTaken);
      } else {
        setError(t.errors.failed);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsappUrl = (booked: boolean) => {
    const rawPhone = (agencyInfo.whatsapp || "+233235337886").replace(/[^0-9]/g, "");
    const intro = booked ? t.whatsappMessage.booked : t.whatsappMessage.failed;
    const time = selectedSlot ? `\n*Call time:* ${formatSlotFull(selectedSlot)}` : "";
    const message = `${intro}\n\n*Name:* ${formData.name}\n*Brand:* ${formData.businessName}\n*Email:* ${formData.email}\n*Service Tier:* ${formData.serviceTier}${time}\n*Goals:* ${formData.notes || "N/A"}`;
    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
  };

  const field =
    "w-full rounded-frame bg-site-paper px-4 py-3 text-base text-site-graphite placeholder:text-site-slate/70 outline-none ring-site-cyanotype focus-visible:ring-2";
  const label = "mb-1.5 block text-[15px] font-semibold text-site-ink";
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const req = <span className="text-site-slate font-normal"> ({t.required})</span>;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-site-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-card bg-white p-6 font-site text-site-graphite outline-none sm:rounded-card sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none"
      >
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-site-paper text-site-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
          aria-label={t.close}
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-site-amber text-site-ink">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 id={titleId} className="text-2xl font-bold text-site-ink">
              {selectedSlot ? t.done.titleBooked : t.done.titleRequested}
            </h2>
            <p className="mx-auto max-w-sm text-base leading-relaxed text-site-slate">
              {t.done.thanks} <span className="font-semibold text-site-ink">{formData.name}</span>.{" "}
              {selectedSlot ? (
                <>
                  {t.done.bookedFor} <span className="font-semibold text-site-ink">{formatSlotFull(selectedSlot)}</span>
                  {showLocalTime && <> ({formatSlotTime(selectedSlot, localTz)} {t.yourTime})</>}. {t.done.detailsTo} {formData.email}.
                </>
              ) : (
                <>
                  {t.done.willReachOut} {formData.email} {t.done.willReachOutEnd}
                </>
              )}
            </p>

            <div className="rounded-frame bg-site-paper p-4 text-left">
              <p className="font-semibold text-site-ink">{t.done.whatsappTitle}</p>
              <p className="mt-1 text-[15px] text-site-slate">{t.done.whatsappBody}</p>
              <a
                href={getWhatsappUrl(true)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-site-ink px-5 py-3 font-semibold text-site-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype focus-visible:ring-offset-2"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                {t.done.whatsappButton}
              </a>
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="rounded-full bg-site-paper px-6 py-3 font-semibold text-site-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
            >
              {t.done.closeButton}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="pr-12">
              <h2 id={titleId} className="text-2xl font-bold leading-tight text-site-ink sm:text-[28px]">
                {t.title}
              </h2>
              <p className="mt-1.5 text-base leading-normal text-site-slate">{t.intro(callAvailability.slotMinutes)}</p>
            </div>

            {/* Call time picker */}
            <fieldset className="min-w-0 space-y-2.5">
              <legend className={`${label} flex items-center gap-1.5`}>
                <CalendarClock className="h-4 w-4 text-site-cyanotype" aria-hidden="true" />
                <span>
                  {t.timeLabel} <span className="font-normal text-site-slate">· {t.timeZoneNote}</span>
                </span>
              </legend>

              {noSlotsAvailable ? (
                <p className="rounded-frame bg-site-paper p-3 text-[15px] text-site-slate">{t.noSlots}</p>
              ) : (
                <>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {days.map((day) => (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={activeDay === day}
                        onClick={() => setSelectedDay(day)}
                        className={`shrink-0 rounded-full px-4 py-2 font-mono text-[13px] cursor-pointer transition-colors duration-300 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype ${
                          activeDay === day ? "bg-site-ink text-site-paper" : "bg-site-paper text-site-ink hover:bg-[#ece6d8]"
                        }`}
                      >
                        {formatSlotDay(slotsByDay.get(day)![0])}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {activeDay &&
                      slotsByDay.get(activeDay)!.map((id) => (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={selectedSlot === id}
                          onClick={() => {
                            setSelectedSlot(id);
                            setError(null);
                          }}
                          className={`rounded-full py-2 font-mono text-[13px] cursor-pointer transition-colors duration-300 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype ${
                            selectedSlot === id ? "bg-site-amber text-site-ink" : "bg-site-paper text-site-ink hover:bg-[#ece6d8]"
                          }`}
                        >
                          {formatSlotTime(id)}
                        </button>
                      ))}
                  </div>
                  {selectedSlot && (
                    <p className="text-[15px] text-site-ink" aria-live="polite">
                      {t.selected} <span className="font-mono text-sm">{formatSlotFull(selectedSlot)}</span>
                      {showLocalTime && (
                        <span className="text-site-slate">
                          {" "}
                          · {formatSlotTime(selectedSlot, localTz)} {t.yourTime}
                        </span>
                      )}
                    </p>
                  )}
                </>
              )}
            </fieldset>

            <div className="space-y-4">
              <div>
                <label htmlFor={`${fid}-name`} className={label}>
                  {t.nameLabel}
                  {req}
                </label>
                <input
                  id={`${fid}-name`}
                  type="text"
                  required
                  autoComplete="name"
                  placeholder={t.namePlaceholder}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={field}
                />
              </div>

              <div>
                <label htmlFor={`${fid}-email`} className={label}>
                  {t.emailLabel}
                  {req}
                </label>
                <input
                  id={`${fid}-email`}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t.emailPlaceholder}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={field}
                />
              </div>

              <div>
                <label htmlFor={`${fid}-biz`} className={label}>
                  {t.businessLabel}
                  {req}
                </label>
                <input
                  id={`${fid}-biz`}
                  type="text"
                  required
                  autoComplete="organization"
                  placeholder={t.businessPlaceholder}
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className={field}
                />
              </div>

              <div>
                <label htmlFor={`${fid}-service`} className={label}>
                  {t.serviceLabel}
                </label>
                <select
                  id={`${fid}-service`}
                  value={formData.serviceTier}
                  onChange={(e) => setFormData({ ...formData, serviceTier: e.target.value })}
                  className={`${field} cursor-pointer`}
                >
                  {services.map((s, i) => (
                    <option key={i} value={s.title}>
                      {s.title} ({s.ghsPrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={`${fid}-notes`} className={label}>
                  {t.notesLabel}
                </label>
                <textarea
                  id={`${fid}-notes`}
                  rows={3}
                  placeholder={t.notesPlaceholder}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`${field} resize-none`}
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="space-y-2 rounded-frame bg-[#FBE9E7] p-3.5 text-[15px] text-[#8A2B1E]">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
                {formData.name && formData.email && (
                  <a
                    href={getWhatsappUrl(false)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold underline"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    {t.whatsappInstead}
                  </a>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-site-amber px-6 py-3.5 text-base font-semibold text-site-ink cursor-pointer transition-[filter] hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              <span>{submitting ? t.submitting : selectedSlot || noSlotsAvailable ? t.submit : t.chooseTime}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DiscoveryModal;
