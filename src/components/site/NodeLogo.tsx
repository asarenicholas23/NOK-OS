import React from "react";

interface NodeLogoProps {
  className?: string;
  /** Colours for the line + hub node and the two outer nodes. */
  hub?: string;
  node?: string;
}

/** N.O.K node mark: one hub joined to two nodes. Decorative; pair with the wordmark. */
export const NodeLogo: React.FC<NodeLogoProps> = ({ className = "h-[30px] w-[34px]", hub = "#14213D", node = "#2E5EAA" }) => (
  <svg viewBox="10 10 34 44" className={className} aria-hidden="true" focusable="false">
    <line x1="18" y1="32" x2="38" y2="18" stroke={hub} strokeWidth="2" />
    <line x1="18" y1="32" x2="38" y2="46" stroke={hub} strokeWidth="2" />
    <circle cx="18" cy="32" r="5" fill={hub} />
    <circle cx="38" cy="18" r="5" fill={node} />
    <circle cx="38" cy="46" r="5" fill={node} />
  </svg>
);
