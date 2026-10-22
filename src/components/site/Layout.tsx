import React from "react";

/** Centred content column, 1120px max, with the site's side gutters. */
export const Container: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`mx-auto max-w-[1120px] px-4 sm:px-6 ${className}`}>{children}</div>
);

/** Section heading on paper. */
export const H2: React.FC<{ children: React.ReactNode; id?: string; className?: string }> = ({ children, id, className = "" }) => (
  <h2 id={id} className={`text-[28px] font-bold leading-tight text-site-ink sm:text-[34px] ${className}`}>
    {children}
  </h2>
);

/** Short line under a section heading. */
export const Lead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <p className={`mt-2 max-w-[600px] text-lg leading-normal text-site-slate ${className}`}>{children}</p>
);
