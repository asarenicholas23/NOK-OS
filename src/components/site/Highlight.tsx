import React from "react";

/**
 * Amber block behind one word of a headline. Ink text on amber is 7.4:1.
 * inline-block keeps the box to the line height: Baloo 2's tall glyph box
 * would otherwise make the highlight overlap the lines around it.
 */
export const Highlight: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <mark className={`inline-block rounded-[14px] bg-site-amber px-2.5 leading-[1.08] text-site-ink ${className}`}>{children}</mark>
);
