import React from "react";

export interface Testimonial {
  quote: string;
  name: string;
  role?: string;
  photo?: string;
  /** The client agreed to this quote being published. Nothing renders without it. */
  permission: boolean;
}

interface TestimonialSlotProps {
  testimonial?: Testimonial | null;
  /**
   * Placeholder shown only in local dev while there's no real quote, so the
   * layout can be reviewed. Never rendered on the live site.
   */
  sample?: Testimonial | null;
  tone?: "paper" | "ink";
  /** Smaller type and padding, for use inside cards. */
  compact?: boolean;
  className?: string;
}

const isReady = (t?: Testimonial | null): t is Testimonial =>
  !!t && t.permission && t.quote.trim() !== "" && t.name.trim() !== "";

/**
 * Shows a client quote only when a real, approved one exists. Otherwise it
 * renders nothing on the live site (and a marked sample in local dev).
 */
export const TestimonialSlot: React.FC<TestimonialSlotProps> = ({ testimonial, sample, tone = "paper", compact = false, className = "" }) => {
  const real = isReady(testimonial);
  const isSample = !real && import.meta.env.DEV && isReady(sample);
  const t = real ? testimonial : isSample ? sample : null;
  if (!t) return null;

  const ink = tone === "ink";
  const surface = ink ? "bg-white/5 text-site-paper" : "bg-white text-site-ink";
  const sampleCls = isSample ? `border-2 border-dashed ${ink ? "border-site-paper/30" : "border-site-cyanotype/40"}` : "";

  return (
    <figure className={`rounded-card ${compact ? "p-5" : "p-6 sm:p-7"} ${surface} ${sampleCls} ${className}`}>
      {isSample && (
        <p className={`mb-2 font-mono text-xs ${ink ? "text-site-amber" : "text-site-cyanotype"}`}>Sample · local dev only</p>
      )}
      <blockquote className={`font-medium leading-snug ${compact ? "text-base" : "text-lg sm:text-xl"}`}>“{t.quote}”</blockquote>
      <figcaption className={`flex items-center gap-3 ${compact ? "mt-3" : "mt-4"}`}>
        {t.photo && <img src={t.photo} alt={t.name} width={40} height={40} loading="lazy" className="h-10 w-10 rounded-full object-cover" />}
        <span className="leading-tight">
          <span className={`block font-semibold ${compact ? "text-[15px]" : ""}`}>{t.name}</span>
          {t.role && <span className={`block text-sm ${ink ? "text-site-paper/75" : "text-site-slate"}`}>{t.role}</span>}
        </span>
      </figcaption>
    </figure>
  );
};
