import React, { useState } from "react";
import { useBrand, Brand } from "../context/BrandContext";
import { useCms } from "../context/CmsContext";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  Plus, 
  ListOrdered, 
  Calendar, 
  Brain,
  Layers,
  Globe,
  Building,
  ArrowRight,
  Sparkles,
  Award,
  Clock,
  ExternalLink,
  Pencil,
  PhoneCall,
  MessageSquare,
  Mail
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { 
    brands, 
    activeBrand, 
    setActiveBrandId, 
    activeBrandId,
    metrics, 
    queues, 
    calendarEvents, 
    addBrand,
    updateBrand,
    theme,
    accentColor
  } = useBrand();

  const { discoveryRequests } = useCms();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [primaryColor, setPrimaryColor] = useState("emerald");
  const [logoText, setLogoText] = useState("");
  const [tagline, setTagline] = useState("");
  const [voiceTone, setVoiceTone] = useState("");

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  const resetForm = () => {
    setName("");
    setDomain("");
    setIndustry("");
    setLogoText("");
    setTagline("");
    setVoiceTone("");
    setEditingBrandId(null);
  };

  const startEditBrand = (brand: Brand) => {
    setEditingBrandId(brand.id);
    setName(brand.name || "");
    setDomain(brand.domain || "");
    setIndustry(brand.industry || "");
    setPrimaryColor(brand.primaryColor || "emerald");
    setLogoText(brand.logoText || "");
    setTagline(brand.tagline || "");
    setVoiceTone(brand.voiceTone || "");
    setShowAddForm(true);
  };

  const getBrandTextColor = () => {
    if (activeColor === "emerald") return "text-emerald-500 dark:text-emerald-400";
    if (activeColor === "rose") return "text-rose-500 dark:text-rose-400";
    if (activeColor === "amber") return "text-amber dark:text-amber";
    return "text-cyanotype dark:text-cyanotype";
  };

  const getBrandBgClass = () => {
    if (activeColor === "emerald") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (activeColor === "rose") return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    if (activeColor === "amber") return "bg-amber/10 text-amber dark:text-amber border-amber/20 font-mono";
    return "bg-cyanotype/10 text-cyanotype dark:text-cyanotype border-cyanotype/20 font-mono";
  };

  const getAccentHex = () => {
    if (activeColor === "emerald") return "#10b981";
    if (activeColor === "rose") return "#f43f5e";
    if (activeColor === "amber") return "#E8A33D";
    return "#2E5EAA";
  };

  const handleCreateBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !domain || !industry || !logoText) return;
    try {
      if (editingBrandId) {
        await updateBrand(editingBrandId, {
          name,
          domain,
          industry,
          primaryColor,
          logoText,
          tagline: tagline || "",
          voiceTone: voiceTone || ""
        });
      } else {
        await addBrand({
          name,
          domain,
          industry,
          primaryColor,
          logoText,
          tagline: tagline || "",
          voiceTone: voiceTone || ""
        });
      }
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error saving brand:", error);
    }
  };

  // Safe metrics helper
  const renderedMetrics = metrics.length > 0 ? metrics : [];

  return (
    <div 
      id="dashboard-view" 
      className={`space-y-8 animate-in fade-in duration-200 transition-colors duration-200 ${
        isDark ? "text-slate-100" : "text-slate-800"
      }`}
    >
      {/* Welcome Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className={`text-2xl font-bold font-display tracking-tight ${isDark ? "text-text" : "text-ink"}`}>
            NOK OS — Dashboard
          </h2>
          <p className={`text-xs mt-1 font-sans ${isDark ? "text-muted" : "text-slate"}`}>
            Real-time live-synced performance metrics and analytic monitoring for brand: <strong className={getBrandTextColor()}>{activeBrand ? activeBrand.name : "Active Workspace"}</strong>.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-xs text-right font-mono text-slate-400">
            <div>UTC Context</div>
            <div className={`font-semibold mt-0.5 ${isDark ? "text-slate-200" : "text-slate-700"}`}>2026-06-29 08:00</div>
          </div>
          <span className={`w-px h-8 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}></span>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono font-semibold text-emerald-500 uppercase">Synced</span>
          </div>
        </div>
      </div>

      {/* Main Core Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* STAT 1: Registered Brands */}
        <div className={`border p-5 rounded-xl relative overflow-hidden transition-all duration-200 ${
          isDark ? "bg-card border-border hover:border-slate/40 text-text" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
        }`}>
          <div className="flex justify-between items-start">
            <span className={`text-xs font-mono uppercase tracking-wider ${isDark ? "text-muted" : "text-slate-500"}`}>
              Brands Registered
            </span>
            <span className={`p-1.5 rounded-lg ${getBrandBgClass()}`}>
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-text" : "text-slate-900"}`}>
              {brands.length}
            </span>
            <span className="text-[10px] uppercase font-mono text-muted">active tenants</span>
          </div>
          <p className="text-[11px] text-muted mt-2">
            N.O.K Os registered sandbox brands
          </p>
        </div>

        {/* STAT 2: Upcoming Campaigns */}
        <div className={`border p-5 rounded-xl relative overflow-hidden transition-all duration-200 ${
          isDark ? "bg-card border-border hover:border-slate/40 text-text" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
        }`}>
          <div className="flex justify-between items-start">
            <span className={`text-xs font-mono uppercase tracking-wider ${isDark ? "text-muted" : "text-slate-500"}`}>
              Scheduled Campaigns
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-text" : "text-slate-900"}`}>
              {queues.length}
            </span>
            <span className="text-[10px] uppercase font-mono text-muted">pending posts</span>
          </div>
          <p className="text-[11px] text-muted mt-2">
            Queued for automatic release
          </p>
        </div>

        {/* STAT 3: Inbound Discovery Calls */}
        <div className={`border p-5 rounded-xl relative overflow-hidden transition-all duration-200 ${
          isDark ? "bg-card border-border hover:border-slate/40 text-text" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
        }`}>
          <div className="flex justify-between items-start">
            <span className={`text-xs font-mono uppercase tracking-wider ${isDark ? "text-muted" : "text-slate-500"}`}>
              Discovery Calls
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <PhoneCall className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-text" : "text-slate-900"}`}>
              {discoveryRequests.length}
            </span>
            <span className="text-[10px] uppercase font-mono text-emerald-500 font-bold">
              {discoveryRequests.filter(r => r.status === "New").length} NEW
            </span>
          </div>
          <p className="text-[11px] text-muted mt-2">
            Inbound client call bookings
          </p>
        </div>

        {/* STAT 4: AI Intel Score */}
        <div className={`border p-5 rounded-xl relative overflow-hidden transition-all duration-200 ${
          isDark ? "bg-card border-border hover:border-slate/40 text-text" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
        }`}>
          <div className="flex justify-between items-start">
            <span className={`text-xs font-mono uppercase tracking-wider ${isDark ? "text-muted" : "text-slate-500"}`}>
              AI Intel Score
            </span>
            <span className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
              <Brain className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-text" : "text-slate-900"}`}>
              98.4%
            </span>
            <span className="text-[10px] uppercase font-mono text-muted">accuracy rating</span>
          </div>
          <p className="text-[11px] text-muted mt-2">
            Automated intelligence optimizer
          </p>
        </div>

      </div>

      {/* BRAND MULTI-TENANT WORKSPACE PORTAL (Select to Enter or Create Brands) */}
      <div className={`border rounded-xl p-6 shadow-md ${
        isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
          <div>
            <h3 className={`text-base font-bold ${isDark ? "text-text" : "text-slate-900"}`}>
              N.O.K Os Brand Workspace Registry
            </h3>
            <p className={`text-xs ${isDark ? "text-muted" : "text-slate-500"}`}>
              Select a brand registry workspace to activate its live sync brand performance data, or register a new client brand.
            </p>
          </div>
          <button
            id="dashboard-provision-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold rounded-md shadow-sm transition-all font-mono cursor-pointer ${
              showAddForm
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : "bg-violet-600 hover:bg-violet-500 text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? "Cancel Registration" : "Register Brand"}</span>
          </button>
        </div>

        {/* Add Brand Form Collapse */}
        {showAddForm && (
          <div className={`border rounded-xl p-5 mb-6 animate-in slide-in-from-top-3 duration-200 ${
            isDark ? "bg-slate-950 border-border" : "bg-slate-50 border-slate-200"
          }`}>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 mr-2" />
              Register Brand Workspace Protocol
            </h4>
            <form onSubmit={handleCreateBrandSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Nova Corp"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!logoText && e.target.value) {
                        setLogoText(e.target.value.substring(0, 2).toUpperCase());
                      }
                    }}
                    className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                      isDark ? "bg-slate-900 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Domain *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., novacorp.io"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                      isDark ? "bg-slate-900 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Industry Sector *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., SaaS Technologies"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                      isDark ? "bg-slate-900 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Initials (2 char) *</label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    placeholder="e.g., NC"
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value.toUpperCase())}
                    className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-mono ${
                      isDark ? "bg-slate-900 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Theme Accent Color</label>
                  <select
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                      isDark ? "bg-slate-900 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="violet">Violet Purple</option>
                    <option value="emerald">Emerald Green</option>
                    <option value="rose">Rose Red</option>
                    <option value="amber">Amber Gold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Brand Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g., Crafting elegant lifestyle products."
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                      isDark ? "bg-slate-900 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2 space-x-2">
                {editingBrandId && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
                    }}
                    className="px-3 py-2 border border-slate-300 dark:border-border text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-md font-mono cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white rounded-md shadow-sm font-mono cursor-pointer"
                >
                  {editingBrandId ? "Save Changes" : "Activate & Enter Workspace"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Brand Grid Workspace Swappable List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {brands.map((brand) => {
            const isActive = brand.id === activeBrandId;
            const badgeColor = {
              emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
              rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
              amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
              violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
            }[brand.primaryColor || "violet"];

            const textAccent = {
              emerald: "text-emerald-500",
              rose: "text-rose-500",
              amber: "text-amber-500",
              violet: "text-violet-500"
            }[brand.primaryColor || "violet"];

            return (
              <div
                key={brand.id}
                className={`border p-5 rounded-xl transition-all duration-350 relative flex flex-col justify-between ${
                  isActive
                    ? isDark
                      ? "border-cyanotype bg-card-inner/50 shadow-lg"
                      : "border-cyanotype bg-violet-50/25 shadow-lg shadow-violet-500/5"
                    : isDark
                      ? "border-border bg-card/60 hover:bg-card-inner"
                      : "bg-white border-slate-200 hover:bg-slate-50/50 shadow-sm"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-950 border border-border ${textAccent}`}>
                      {brand.logoText}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEditBrand(brand)}
                        className="p-1 rounded border border-slate-300 dark:border-border hover:bg-slate-100 dark:hover:bg-slate-950 text-slate-400 hover:text-violet-500 transition-all cursor-pointer"
                        title="Edit Brand"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      {isActive ? (
                        <span className={`text-[9px] font-mono font-semibold uppercase px-2 py-0.5 rounded border flex items-center ${badgeColor}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                          Active OS Context
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveBrandId(brand.id)}
                          className="text-[10px] font-mono px-2.5 py-1 rounded border border-slate-300 dark:border-border hover:bg-slate-100 dark:hover:bg-slate-950 transition-all cursor-pointer font-semibold"
                        >
                          Enter Workspace
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{brand.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">{brand.domain}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-border/50 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Sector:</span>
                      <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>{brand.industry}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Brand Theme:</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono ${badgeColor}`}>
                        {brand.primaryColor || "violet"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="italic truncate pr-4">
                    {brand.tagline ? `"${brand.tagline}"` : <span className="not-italic text-slate-500">(No tagline)</span>}
                  </span>
                  {isActive && <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${textAccent}`} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Brand Metric Cards Grid */}
      <div id="metric-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {renderedMetrics.map((metric) => {
          const isIncrease = metric.changeType === "increase";
          const isNeutral = metric.changeType === "neutral";
          return (
            <div 
              key={metric.id} 
              id={`metric-card-${metric.id}`}
              className={`border rounded-xl p-5 hover:border-slate/40 transition-all duration-200 shadow-sm relative overflow-hidden ${
                isDark ? "bg-card border-border" : "bg-white border-slate-200"
              }`}
            >
              <div className="relative z-10 flex justify-between items-start">
                <span className={`text-xs font-mono tracking-wider font-medium ${isDark ? "text-muted" : "text-slate-500"}`}>{metric.label}</span>
                <span className={`flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  isNeutral 
                    ? "bg-slate-800 text-slate-300"
                    : isIncrease 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "bg-rose-500/10 text-rose-500"
                }`}>
                  {isNeutral ? "" : isIncrease ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {metric.change}
                </span>
              </div>

              <div className="relative z-10 mt-3 flex items-baseline space-x-2">
                <span className={`text-2xl font-bold tracking-tight font-sans ${isDark ? "text-slate-100" : "text-slate-900"}`}>{metric.value}</span>
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">KPI</span>
              </div>

              {/* Sparkline Custom SVG rendering */}
              <div className="relative z-10 mt-4 h-8 w-full">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path
                    d={`M ${metric.trend.map((val, i) => `${(i / (metric.trend.length - 1)) * 100} ${20 - ((val - Math.min(...metric.trend)) / (Math.max(...metric.trend) - Math.min(...metric.trend) || 1)) * 15}`).join(' L ')}`}
                    fill="none"
                    stroke={getAccentHex()}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle 
                    cx="100" 
                    cy={20 - ((metric.trend[metric.trend.length - 1] - Math.min(...metric.trend)) / (Math.max(...metric.trend) - Math.min(...metric.trend) || 1)) * 15} 
                    r="2" 
                    fill={getAccentHex()} 
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Dashboard Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG performance chart */}
        <div className={`border rounded-xl p-6 shadow-md flex flex-col justify-between lg:col-span-2 ${
          isDark ? "bg-card border-border" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-xs font-mono uppercase tracking-wider font-semibold ${isDark ? "text-muted" : "text-slate-500"}`}>
                Performance Aggregation
              </h3>
              <h4 className={`text-sm font-medium mt-1 ${isDark ? "text-text" : "text-slate-900"}`}>
                Multi-Channel Active Reach Trend
              </h4>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
              <span className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-1.5`} style={{ backgroundColor: getAccentHex() }}></span>
                Reach Scale
              </span>
              <span>7D Bracket</span>
            </div>
          </div>

          <div className="h-60 w-full mt-6 flex items-end">
            <div className="w-full h-full relative">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getAccentHex()} stopOpacity="0.25"/>
                    <stop offset="100%" stopColor={getAccentHex()} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <line x1="0" y1="50" x2="500" y2="50" stroke={isDark ? "#2d3748" : "#edf2f7"} strokeDasharray="3,3" strokeWidth="0.5"/>
                <line x1="0" y1="100" x2="500" y2="100" stroke={isDark ? "#2d3748" : "#edf2f7"} strokeDasharray="3,3" strokeWidth="0.5"/>
                <line x1="0" y1="150" x2="500" y2="150" stroke={isDark ? "#2d3748" : "#edf2f7"} strokeDasharray="3,3" strokeWidth="0.5"/>
                
                <path
                  d="M 0 160 L 80 130 L 160 145 L 240 90 L 320 115 L 400 60 L 500 45 L 500 200 L 0 200 Z"
                  fill="url(#chart-glow)"
                />
                
                <path
                  d="M 0 160 L 80 130 L 160 145 L 240 90 L 320 115 L 400 60 L 500 45"
                  fill="none"
                  stroke={getAccentHex()}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <circle cx="240" cy="90" r="4" fill={isDark ? "#111" : "#fff"} stroke={getAccentHex()} strokeWidth="2" />
                <circle cx="400" cy="60" r="4" fill={isDark ? "#111" : "#fff"} stroke={getAccentHex()} strokeWidth="2" />
                <circle cx="500" cy="45" r="4" fill={isDark ? "#111" : "#fff"} stroke={getAccentHex()} strokeWidth="2" />
              </svg>
              
              <div className={`absolute top-[35%] left-[45%] border rounded px-2 py-1 text-[10px] font-mono shadow-md ${
                isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-700"
              }`}>
                Peak: +42.4% reach
              </div>
            </div>
          </div>

          <div className={`flex justify-between items-center mt-4 pt-4 border-t text-[10px] font-mono ${
            isDark ? "border-border/60 text-slate-500" : "border-slate-200 text-slate-400"
          }`}>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
          </div>
        </div>

        {/* Live Active Campaigns Overview */}
        <div className={`border rounded-xl p-6 shadow-md flex flex-col ${
          isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className={`text-xs font-mono uppercase tracking-wider font-semibold ${isDark ? "text-muted" : "text-slate-500"}`}>
                Active Pipeline
              </h3>
              <h4 className={`text-sm font-medium mt-1 ${isDark ? "text-text" : "text-slate-900"}`}>
                Upcoming Live Posts
              </h4>
            </div>
            <div className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getBrandBgClass()}`}>
              Count: {queues.length}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[260px] pr-1">
            {queues.slice(0, 3).map((item) => {
              const statusColors = {
                active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                processing: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                scheduled: "bg-violet-500/10 text-violet-500 border-violet-500/20",
                completed: "bg-slate-800 text-slate-400 border-slate-700"
              };
              return (
                <div 
                  key={item.id} 
                  className={`border rounded-lg p-3 hover:border-slate-400 transition-colors ${
                    isDark ? "bg-slate-950/80 border-border" : "bg-slate-50/50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">{item.channel}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <h5 className={`text-xs font-semibold mt-2 line-clamp-1 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.title}</h5>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.content}</p>
                  <div className="text-[9px] font-mono text-slate-400 mt-2">
                    Sched: {item.scheduledTime}
                  </div>
                </div>
              );
            })}

            {queues.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs font-mono">
                No active campaigns in pipeline
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
