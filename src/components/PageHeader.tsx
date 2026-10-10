import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Small uppercase label shown before the title, e.g. the nav group. */
  badge?: string;
  /** Optional right-aligned actions (primary buttons etc.) */
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badge, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          {badge && (
            <span className="fin-badge-accent px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em]">
              {badge}
            </span>
          )}
          <h1 className="font-display text-[28px] sm:text-[32px] leading-tight font-bold tracking-tight text-[var(--fin-ink)]">
            {title}
          </h1>
        </div>
        {subtitle && <p className="text-sm text-[var(--fin-sub)] mt-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};
