import React from "react";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, CalendarRange, Wallet } from "lucide-react";
import { ProposalContent, proposalTotals, formatGhs } from "../data/cmsData";

// The site has no Tailwind typography plugin, so markdown elements are styled here.
const md: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <p className="leading-relaxed mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-3 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-3 last:mb-0">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-[#F2F0EB]">{children}</strong>,
  h1: ({ children }) => <h3 className="font-display font-bold text-base text-[#F2F0EB] mt-4 mb-2">{children}</h3>,
  h2: ({ children }) => <h3 className="font-display font-bold text-base text-[#F2F0EB] mt-4 mb-2">{children}</h3>,
  h3: ({ children }) => <h4 className="font-semibold text-sm text-[#F2F0EB] mt-3 mb-1.5">{children}</h4>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#C5A065] underline">{children}</a>
  )
};

// The proposal as the client sees it. Used for the staff preview in the CMS and
// for the client's private /proposal/:token page, so both always match.
export const ProposalDocument: React.FC<{ proposal: ProposalContent; agencyName?: string }> = ({
  proposal,
  agencyName = "NOK Social"
}) => {
  const { total, deposit, balance } = proposalTotals(proposal);
  const validUntil = proposal.validUntil
    ? new Date(`${proposal.validUntil}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : null;

  return (
    <article className="space-y-8 text-[#F2F0EB]">
      <header className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#B08D57] font-semibold">
          {agencyName} · Proposal v{proposal.version}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{proposal.title || "Untitled proposal"}</h1>
        <p className="text-xs text-zinc-300">
          Prepared for <span className="font-semibold text-[#F2F0EB]">{proposal.clientName || "—"}</span>
          {proposal.businessName && <> · {proposal.businessName}</>}
          {validUntil && <> · Valid until {validUntil}</>}
        </p>
      </header>

      {proposal.overview.trim() && (
        <section className="text-sm text-zinc-200">
          <ReactMarkdown components={md}>{proposal.overview}</ReactMarkdown>
        </section>
      )}

      {proposal.phases.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center space-x-2 font-display text-lg font-bold">
            <CalendarRange className="w-4 h-4 text-[#B08D57]" />
            <span>Project Build Plan</span>
          </h2>
          <ol className="space-y-3">
            {proposal.phases.map((phase, i) => (
              <li key={phase.id} className="p-4 rounded-2xl neu-pressed space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-sm">
                    <span className="text-[#B08D57] font-mono mr-2">{String(i + 1).padStart(2, "0")}</span>
                    {phase.title}
                  </h3>
                  {phase.duration && <span className="text-[11px] font-mono text-zinc-400">{phase.duration}</span>}
                </div>
                {phase.deliverables.filter(Boolean).length > 0 && (
                  <ul className="space-y-1">
                    {phase.deliverables.filter(Boolean).map((d, j) => (
                      <li key={j} className="flex items-start space-x-2 text-xs text-zinc-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#B08D57] shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center space-x-2 font-display text-lg font-bold">
          <Wallet className="w-4 h-4 text-[#B08D57]" />
          <span>Investment</span>
        </h2>
        <div className="rounded-2xl neu-pressed overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              {proposal.lineItems.map((li) => (
                <tr key={li.id} className="border-b border-white/5">
                  <td className="p-3 align-top">
                    <div className="font-semibold">{li.title || "—"}</div>
                    {li.description && <div className="text-zinc-400 mt-0.5">{li.description}</div>}
                  </td>
                  <td className="p-3 text-right font-mono align-top whitespace-nowrap">{formatGhs(Number(li.amount) || 0)}</td>
                </tr>
              ))}
              <tr className="border-b border-white/5">
                <td className="p-3 font-bold">Total</td>
                <td className="p-3 text-right font-mono font-bold whitespace-nowrap">{formatGhs(total)}</td>
              </tr>
              <tr className="bg-[#B08D57]/10">
                <td className="p-3 font-semibold text-[#C5A065]">Deposit to start ({proposal.depositPercent}%)</td>
                <td className="p-3 text-right font-mono font-bold text-[#C5A065] whitespace-nowrap">{formatGhs(deposit)}</td>
              </tr>
              <tr>
                <td className="p-3 text-zinc-300">Balance due on delivery</td>
                <td className="p-3 text-right font-mono text-zinc-300 whitespace-nowrap">{formatGhs(balance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {proposal.terms.trim() && (
        <section className="space-y-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-300">Terms</h2>
          <div className="text-xs text-zinc-300">
            <ReactMarkdown components={md}>{proposal.terms}</ReactMarkdown>
          </div>
        </section>
      )}
    </article>
  );
};

export default ProposalDocument;
