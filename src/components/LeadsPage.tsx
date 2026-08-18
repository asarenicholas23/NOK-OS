import React, { useMemo, useState } from "react";
import { useBrand } from "../context/BrandContext";
import { Inbox, Mail, Building2, Gift, Copy, Check, Search } from "lucide-react";

const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return "—";
  try {
    const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
};

export const LeadsPage: React.FC = () => {
  const { leads, theme, accentColor, addNotification } = useBrand();
  const isDark = theme === "dark";
  const activeColor = accentColor || "violet";
  const [search, setSearch] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);

  const getBrandTextColor = () => {
    if (activeColor === "emerald") return "text-emerald-500 dark:text-emerald-400";
    if (activeColor === "rose") return "text-rose-500 dark:text-rose-400";
    if (activeColor === "amber") return "text-amber-500 dark:text-amber-400";
    return "text-violet-500 dark:text-violet-400";
  };

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter(l =>
      l.name?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term) ||
      l.businessName?.toLowerCase().includes(term) ||
      l.resourceTitle?.toLowerCase().includes(term)
    );
  }, [leads, search]);

  const resourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      counts[l.resourceTitle] = (counts[l.resourceTitle] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const handleCopyAllEmails = () => {
    const emails = filteredLeads.map(l => l.email).filter(Boolean).join(", ");
    if (!emails) return;
    navigator.clipboard.writeText(emails);
    setCopiedAll(true);
    addNotification("Emails Copied", `Copied ${filteredLeads.length} email address(es) to clipboard.`, "success");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div
      id="leads-view"
      className={`space-y-8 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}
    >
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Resource Leads
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Everyone who unlocked a free resource on the public <strong className={getBrandTextColor()}>/resources</strong> page.
          </p>
        </div>
        <span className="bg-emerald-600/15 text-emerald-500 border border-emerald-500/20 text-[10px] font-mono px-2.5 py-1 rounded-full self-start md:self-auto font-bold uppercase shrink-0">
          {leads.length} Total Leads
        </span>
      </div>

      {/* Per-resource breakdown */}
      {Object.keys(resourceCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(resourceCounts).map(([title, count]) => (
            <span
              key={title}
              className={`flex items-center space-x-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                isDark ? "bg-slate-950/40 border-border text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <Gift className="w-3 h-3 text-violet-400" />
              <span>{title}</span>
              <span className="font-bold">{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Search + bulk actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, business, or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full text-xs pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
              isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
            }`}
          />
        </div>
        <button
          onClick={handleCopyAllEmails}
          disabled={filteredLeads.length === 0}
          className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-md shadow-sm transition-colors font-mono cursor-pointer bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>Copy {filteredLeads.length} Email{filteredLeads.length === 1 ? "" : "s"}</span>
        </button>
      </div>

      {/* Leads table */}
      <div className={`border rounded-xl overflow-hidden shadow-lg ${isDark ? "bg-card border-border" : "bg-white border-slate-200"}`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? "border-border/60 bg-slate-900/20" : "border-slate-150 bg-slate-50/50"}`}>
          <div className="flex items-center space-x-2">
            <Inbox className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-500 font-mono">
              Lead Registry ({filteredLeads.length} shown)
            </h3>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-mono text-slate-400">Live Listening to Firestore</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className={`border-b text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold ${isDark ? "bg-slate-900/20 border-border/60" : "bg-slate-50 border-slate-150"}`}>
                <th className="p-3.5">Captured</th>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Business</th>
                <th className="p-3.5">Resource</th>
                <th className="p-3.5">Source</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className={isDark ? "hover:bg-slate-950/20" : "hover:bg-slate-50/60"}>
                  <td className="p-3.5 text-slate-400 whitespace-nowrap">{formatTimestamp(lead.timestamp)}</td>
                  <td className={`p-3.5 font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{lead.name}</td>
                  <td className="p-3.5">
                    <a href={`mailto:${lead.email}`} className="flex items-center space-x-1.5 text-violet-400 hover:text-violet-300">
                      <Mail className="w-3 h-3" />
                      <span>{lead.email}</span>
                    </a>
                  </td>
                  <td className="p-3.5">
                    <span className="flex items-center space-x-1.5 text-slate-400">
                      <Building2 className="w-3 h-3" />
                      <span>{lead.businessName}</span>
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-violet-500/10 text-violet-300 border-violet-500/20">
                      {lead.resourceTitle}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400 font-mono text-[10px]">{lead.source}</td>
                </tr>
              ))}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 text-xs font-mono">
                    <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <div>{leads.length === 0 ? "No resource leads captured yet." : "No leads match your search."}</div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Leads appear here automatically when someone unlocks a resource on the public /resources page.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
