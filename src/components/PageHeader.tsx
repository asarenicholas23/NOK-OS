import React from "react";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Optional right-aligned actions (primary buttons etc.) */
  actions?: React.ReactNode;
  /** Show the decorative filter button next to the actions */
  showFilter?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  actions,
  showFilter = false
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="fin-iconbtn w-10 h-10 mt-1 shrink-0"
            title="Back to Overview"
            aria-label="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-[#16151F]">{title}</h1>
          {subtitle && <p className="text-xs text-[#6B6880] mt-1">{subtitle}</p>}
        </div>
      </div>

      {(actions || showFilter) && (
        <div className="flex items-center gap-2.5 shrink-0">
          {showFilter && (
            <button className="fin-iconbtn w-10 h-10" title="Filters" aria-label="Filters">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
          {actions}
        </div>
      )}
    </div>
  );
};
