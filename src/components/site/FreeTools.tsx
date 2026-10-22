import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileSpreadsheet, ScanSearch } from "lucide-react";
import { RESOURCES, type Resource } from "../../data/resourcesData";
import { freeTools } from "../../content/siteContent";
import { PillButton } from "./PillButton";
import { Reveal } from "./Reveal";

const ICONS: Record<string, React.FC<{ className?: string }>> = {
  "leads-tracker": FileSpreadsheet,
  "ig-health-check": ScanSearch,
};

export const ToolIcon: React.FC<{ id: string; className?: string }> = ({ id, className = "" }) => {
  const Icon = ICONS[id] ?? FileSpreadsheet;
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E4ECF7] text-site-cyanotype ${className}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
};

/** Where a tool's link goes: ready tools open their unlock form, others their waitlist. */
export const toolHref = (r: Resource) => (r.comingSoon ? r.fileUrl : `/resources?unlock=${r.id}`);

const linkCls =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype";

/** "Free tools" strip for the top of /blog. Lists every tool in resourcesData. */
export const FreeToolsStrip: React.FC<{ className?: string }> = ({ className = "" }) => {
  const s = freeTools.strip;
  return (
    <Reveal className={className}>
      <section aria-labelledby="free-tools-strip" className="rounded-card bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div>
            <p className="font-mono text-xs text-site-cyanotype">{s.tag}</p>
            <h2 id="free-tools-strip" className="mt-0.5 text-xl font-semibold text-site-ink">
              {s.title}
            </h2>
          </div>
          <Link to="/resources" className={`inline-flex items-center gap-1.5 text-[15px] font-semibold text-site-cyanotype hover:underline ${linkCls}`}>
            {s.seeAll}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {RESOURCES.map((r) => (
            <li key={r.id}>
              <Link
                to={toolHref(r)}
                className="group flex h-full items-center gap-3.5 rounded-frame bg-site-paper p-3.5 transition-colors duration-300 ease-soft hover:bg-[#ece6d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
              >
                <ToolIcon id={r.id} className="bg-white" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-tight text-site-ink">{r.title}</span>
                  <span className="mt-0.5 block text-[15px] leading-snug text-site-slate">{r.description}</span>
                </span>
                <span className="hidden shrink-0 text-[13px] font-semibold text-site-ink sm:block">
                  {r.comingSoon ? s.soon : s.open}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Reveal>
  );
};

/** One card on the homepage, featuring the first tool that's ready to use. */
export const FreeToolCard: React.FC<{ className?: string }> = ({ className = "" }) => {
  const tool = RESOURCES.find((r) => !r.comingSoon);
  if (!tool) return null;
  const c = freeTools.homeCard;
  return (
    <Reveal className={className}>
      <aside
        aria-labelledby="free-tool-card"
        className="flex flex-col gap-5 rounded-card bg-white p-6 sm:flex-row sm:items-center sm:p-8"
      >
        <ToolIcon id={tool.id} className="h-14 w-14 rounded-[20px]" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-site-cyanotype">{c.tag}</p>
          <h2 id="free-tool-card" className="mt-0.5 text-2xl font-semibold leading-tight text-site-ink">
            {tool.title}
          </h2>
          <p className="mt-1 text-base leading-normal text-site-slate">{tool.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <PillButton variant="dark" to={toolHref(tool)}>
            {c.button}
          </PillButton>
          <Link to="/resources" className={`text-[15px] font-semibold text-site-cyanotype hover:underline ${linkCls}`}>
            {c.seeAll}
          </Link>
        </div>
      </aside>
    </Reveal>
  );
};
