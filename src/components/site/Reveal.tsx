import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { DURATION, EASE_SOFT } from "./motion";

interface RevealProps {
  children: React.ReactNode;
  /** Seconds to wait after entering the viewport (for staggering siblings). */
  delay?: number;
  /** Distance to rise from, in px. */
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}

/**
 * Fades and lifts its children in the first time they scroll into view.
 * Uses opacity + transform only, so it never shifts layout. With reduced
 * motion the content is simply shown.
 */
export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, y = 18, className, as = "div" }) => {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: DURATION.slow, ease: EASE_SOFT, delay }}
    >
      {children}
    </Tag>
  );
};
