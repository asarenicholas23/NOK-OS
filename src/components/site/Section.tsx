import React from "react";

interface SectionProps {
  tone?: "paper" | "ink";
  /** "rounded": an inset block with large radius. "bleed": edge to edge. */
  shape?: "rounded" | "bleed";
  id?: string;
  className?: string;
  /** Classes for the inner content wrapper (padding, width). */
  innerClassName?: string;
  children: React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

const TONE = {
  paper: "bg-site-paper text-site-graphite",
  ink: "bg-site-ink text-site-paper",
};

/** Page section in one of the two site tones. Content is capped at 1120px. */
export const Section: React.FC<SectionProps> = ({
  tone = "paper",
  shape = "rounded",
  id,
  className = "",
  innerClassName = "",
  children,
  ...aria
}) => {
  if (shape === "bleed") {
    return (
      <section id={id} className={`${TONE[tone]} ${className}`} {...aria}>
        <div className={`mx-auto max-w-[1120px] px-4 sm:px-6 py-14 sm:py-20 ${innerClassName}`}>{children}</div>
      </section>
    );
  }

  return (
    <section id={id} className={`mx-auto max-w-[1120px] px-4 sm:px-6 ${className}`} {...aria}>
      <div className={`${TONE[tone]} rounded-section px-6 py-10 sm:px-11 sm:py-12 ${innerClassName}`}>{children}</div>
    </section>
  );
};
