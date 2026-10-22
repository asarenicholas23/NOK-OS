import React from "react";
import { motion, useReducedMotion } from "motion/react";

interface FloatingStatProps {
  icon: React.ReactNode;
  /** Main line, e.g. "Order paid". Always pass real data, never made-up numbers. */
  title: string;
  /** Second line, e.g. "GH₵ 240 · MoMo". Rendered in mono when `detailMono`. */
  detail?: string;
  /** Mono styling on the title instead (for a number-led title like "+212 profile visits"). */
  titleMono?: boolean;
  detailMono?: boolean;
  /** Icon chip colour. */
  accent?: "cyanotype" | "amber";
  /** Bob cycle length in seconds; vary it between cards so they drift apart. */
  period?: number;
  delay?: number;
  className?: string;
}

/** Small white card that gently bobs. Static with reduced motion. */
export const FloatingStat: React.FC<FloatingStatProps> = ({
  icon,
  title,
  detail,
  titleMono = false,
  detailMono = false,
  accent = "cyanotype",
  period = 5.5,
  delay = 0,
  className = "",
}) => {
  const reduce = useReducedMotion();
  const chip = accent === "amber" ? "bg-site-amber text-site-ink" : "bg-[#E6EDF7] text-site-cyanotype";

  return (
    <motion.div
      className={`inline-flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-[0_12px_32px_-18px_rgba(20,33,61,0.35)] ${className}`}
      animate={reduce ? undefined : { y: [0, -6, 0] }}
      transition={reduce ? undefined : { duration: period, ease: "easeInOut", repeat: Infinity, delay }}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${chip}`} aria-hidden="true">
        {icon}
      </span>
      <span className="leading-tight">
        <span className={`block text-site-ink ${titleMono ? "font-mono text-sm" : "text-[15px] font-semibold"}`}>{title}</span>
        {detail && (
          <span className={`block text-site-slate ${detailMono ? "font-mono text-xs" : "text-[13px]"}`}>{detail}</span>
        )}
      </span>
    </motion.div>
  );
};
