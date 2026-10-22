import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { DURATION, EASE_SOFT } from "./motion";

export interface FlipState {
  icon: React.ReactNode;
  title: string;
  detail: string;
  /** Chip colour: "cyanotype" for the first step, "amber" for the done step. */
  accent?: "cyanotype" | "amber";
}

interface StatusFlipProps {
  /** Two states shown in turn: before → after. */
  from: FlipState;
  to: FlipState;
  /** ms each state stays on screen. */
  intervalMs?: number;
  className?: string;
}

const CHIP = {
  cyanotype: "bg-[#E6EDF7] text-site-cyanotype",
  amber: "bg-site-amber text-site-ink",
};

/**
 * Small looping status card (e.g. "Booking request" → "Deposit paid").
 * An illustration of a flow, never a real figure. Pauses off screen; with
 * reduced motion it shows the "after" state, still.
 */
export const StatusFlip: React.FC<StatusFlipProps> = ({ from, to, intervalMs = 2800, className = "" }) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [done, setDone] = useState(!!reduce);

  useEffect(() => {
    if (reduce) {
      setDone(true);
      return;
    }
    if (!inView) return;
    const t = window.setTimeout(() => setDone((d) => !d), intervalMs);
    return () => window.clearTimeout(t);
  }, [done, inView, reduce, intervalMs]);

  const s = done ? to : from;
  const accent = s.accent ?? (done ? "amber" : "cyanotype");

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`${from.title}, then ${to.title}`}
      className={`w-max max-w-[260px] whitespace-nowrap rounded-[18px] bg-white px-4 py-3 shadow-[0_12px_32px_-18px_rgba(20,33,61,0.35)] ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={done ? "to" : "from"}
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: DURATION.fast, ease: EASE_SOFT }}
          aria-hidden="true"
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${CHIP[accent]}`}>{s.icon}</span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold text-site-ink">{s.title}</span>
            <span className="block text-[13px] text-site-slate">{s.detail}</span>
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
