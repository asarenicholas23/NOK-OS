import React from "react";

interface FrameProps {
  children: React.ReactNode;
  className?: string;
}

/** Rounded browser window for website screenshots. */
export const BrowserFrame: React.FC<FrameProps> = ({ children, className = "" }) => (
  <div className={`rounded-card bg-white p-2.5 ${className}`}>
    <div className="flex gap-[5px] px-1.5 pb-2.5 pt-0.5" aria-hidden="true">
      <span className="h-[9px] w-[9px] rounded-full bg-[#E5E0D3]" />
      <span className="h-[9px] w-[9px] rounded-full bg-[#E5E0D3]" />
      <span className="h-[9px] w-[9px] rounded-full bg-[#E5E0D3]" />
    </div>
    {children}
  </div>
);

/** Rounded phone for app / Instagram screenshots. Width is set by the caller. */
export const PhoneFrame: React.FC<FrameProps> = ({ children, className = "" }) => (
  <div className={`rounded-[32px] bg-site-ink p-2.5 ${className}`}>
    <div className="overflow-hidden rounded-[24px] bg-white p-2.5">{children}</div>
  </div>
);
