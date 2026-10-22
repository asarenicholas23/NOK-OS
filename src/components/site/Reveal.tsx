import React, { useLayoutEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
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
 *
 * Content that's already on screen when the page loads is shown straight
 * away, not faded in: the page arrives pre-rendered, and hiding the headline
 * until the script runs would delay it appearing. Only content below the fold
 * is hidden (before the first paint) and revealed on scroll.
 *
 * Uses opacity + transform only, so it never shifts layout. With reduced
 * motion the content is simply shown.
 */
export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, y = 18, className, as = "div" }) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const [belowFold, setBelowFold] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.getBoundingClientRect().top > window.innerHeight) setBelowFold(true);
  }, []);

  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  const Tag = motion[as] as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={className}
      initial={false}
      animate={belowFold && !inView ? "hidden" : "shown"}
      variants={{
        hidden: { opacity: 0, y, transition: { duration: 0 } },
        shown: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_SOFT, delay } },
      }}
    >
      {children}
    </Tag>
  );
};
