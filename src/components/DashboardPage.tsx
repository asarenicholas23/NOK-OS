import React, { useState, useMemo } from "react";
import { useBrand, Brand } from "../context/BrandContext";
import { useCms } from "../context/CmsContext";
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Brain,
  Layers,
  Building,
  ArrowRight,
  Sparkles,
  Clock,
  PhoneCall
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const {
    brands,
    activeBrand,
    setActiveBrandId,
    activeBrandId,
    rawAnalytics,
    queues,
    addBrand,
    updateBrand,
    accentColor
  } = useBrand();

  const { discoveryRequests } = useCms();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [primaryColor, setPrimaryColor] = useState("violet");
  const [logoText, setLogoText] = useState("");
  const [tagline, setTagline] = useState("");
  const [voiceTone, setVoiceTone] = useState("");

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
    setPrimaryColor(brand.primaryColor || "violet");
    setLogoText(brand.logoText || "");
    setTagline(brand.tagline || "");
    setVoiceTone(brand.voiceTone || "");
    setShowAddForm(true);
  };

  const getBrandTextColor = () => {
    if (activeColor === "emerald") return "text-emerald-600";
    if (activeColor === "rose") return "text-rose-600";
    if (activeColor === "amber") return "text-amber-600";
    return "text-[var(--fin-accent)]";
  };

  const getBrandBgClass = () => {
    if (activeColor === "emerald") return "bg-emerald-50 text-emerald-700";
    if (activeColor === "rose") return "bg-rose-50 text-rose-700";
    if (activeColor === "amber") return "bg-amber-50 text-amber-700";
    return "fin-badge-accent";
  };

  const getAccentHex = () => {
    if (activeColor === "emerald") return "#059669";
    if (activeColor === "rose") return "#e11d48";
    if (activeColor === "amber") return "#d97706";
    return "#B08D57";
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

  // Derive dashboard stat cards from real uploaded analytics data for the active
  // brand, instead of the static one-time-seeded "metrics" collection. When a
  // "comparison" dataset has been imported, cards show comparison-vs-baseline
  // change; otherwise they just reflect the single uploaded dataset.
  const hasRealAnalytics = rawAnalytics.length > 0;

  const renderedMetrics = useMemo(() => {
    if (!hasRealAnalytics) return [];

    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const baseline = rawAnalytics.filter(r => r.datasetType !== "comparison");
    const comparison = rawAnalytics.filter(r => r.datasetType === "comparison");
    const current = comparison.length > 0 ? comparison : baseline;
    const previous = comparison.length > 0 ? baseline : [];

    const sumField = (rows: typeof rawAnalytics, field: "impressions" | "engagement" | "reach" | "engagementRate") =>
      rows.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);

    const avgField = (rows: typeof rawAnalytics, field: "engagementRate") =>
      rows.length > 0 ? sumField(rows, field) / rows.length : 0;

    const trendFor = (rows: typeof rawAnalytics, field: "impressions" | "engagement" | "reach" | "engagementRate") => {
      const vals = dayOrder.map(d =>
        sumField(rows.filter(r => (r.dayOfWeek || "").toLowerCase() === d.toLowerCase()), field)
      );
      return vals.some(v => v > 0) ? vals : [1, 1, 1, 1, 1, 1, 1];
    };

    const changeFor = (curr: number, prev: number) => {
      if (comparison.length === 0) return { change: "New Data", changeType: "neutral" as const };
      if (!prev) return { change: "No prior data", changeType: "neutral" as const };
      const pct = ((curr - prev) / prev) * 100;
      return {
        change: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
        changeType: pct > 0.05 ? ("increase" as const) : pct < -0.05 ? ("decrease" as const) : ("neutral" as const)
      };
    };

    const impressions = sumField(current, "impressions");
    const impressionsPrev = sumField(previous, "impressions");
    const engagement = sumField(current, "engagement");
    const engagementPrev = sumField(previous, "engagement");
    const reach = sumField(current, "reach");
    const reachPrev = sumField(previous, "reach");
    const engagementRate = avgField(current, "engagementRate");
    const engagementRatePrev = avgField(previous, "engagementRate");

    return [
      {
        id: "live-impressions", brandId: activeBrandId, label: "Total Impressions",
        value: impressions.toLocaleString(), trend: trendFor(current, "impressions"),
        ...changeFor(impressions, impressionsPrev)
      },
      {
        id: "live-engagement", brandId: activeBrandId, label: "Total Engagement",
        value: engagement.toLocaleString(), trend: trendFor(current, "engagement"),
        ...changeFor(engagement, engagementPrev)
      },
      {
        id: "live-engagement-rate", brandId: activeBrandId, label: "Avg. Engagement Rate",
        value: `${engagementRate.toFixed(2)}%`, trend: trendFor(current, "engagementRate"),
        ...changeFor(engagementRate, engagementRatePrev)
      },
      {
        id: "live-reach", brandId: activeBrandId, label: "Total Reach",
        value: reach.toLocaleString(), trend: trendFor(current, "reach"),
        ...changeFor(reach, reachPrev)
      }
    ];
  }, [rawAnalytics, activeBrandId, hasRealAnalytics]);

  const statCards = [
    {
      label: "Brands Registered",
      value: brands.length,
      hint: "active tenants",
      sub: "N.O.K Os registered sandbox brands",
      icon: Layers
    },
    {
      label: "Scheduled Campaigns",
      value: queues.length,
      hint: "pending posts",
      sub: "Queued for automatic release",
      icon: Clock
    },
    {
      label: "Discovery Calls",
      value: discoveryRequests.length,
      hint: `${discoveryRequests.filter(r => r.status === "New").length} new`,
      sub: "Inbound client call bookings",
      icon: PhoneCall
    }
  ];

  return (
    <div id="dashboard-view" className="space-y-6 animate-in fade-in duration-200 text-[var(--fin-ink)]">
      {/* Slim status row */}
      <p className="text-xs text-[var(--fin-sub)] -mt-2">
        Live-synced metrics for{" "}
        <strong className={getBrandTextColor()}>{activeBrand ? activeBrand.name : "Active Workspace"}</strong>.
      </p>

      {/* Hero: stat cards + dark active-context panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="fin-card fin-card-hover p-5 flex flex-col">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--fin-faint)]">
                    {card.label}
                  </span>
                  <span className="fin-icon-chip p-2 shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-[var(--fin-ink)]">{card.value}</span>
                  <span className="text-[10px] uppercase tracking-wide text-[var(--fin-faint)]">{card.hint}</span>
                </div>
                <p className="text-[11px] text-[var(--fin-faint)] mt-auto pt-3">{card.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Dark active-context feature panel */}
        <div className="fin-panel-dark p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] fin-panel-sub">Active workspace</p>
              <h3 className="text-lg font-bold mt-1.5 text-white">{activeBrand ? activeBrand.name : "No brand selected"}</h3>
              <p className="text-[11px] fin-panel-sub mt-0.5">{activeBrand ? activeBrand.domain : "—"}</p>
            </div>
            <span className="fin-panel-card p-2">
              <Building className="w-4 h-4 text-[var(--fin-accent-text)]" />
            </span>
          </div>

          {activeBrand && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="fin-panel-card p-3">
                <p className="text-[10px] fin-panel-sub uppercase tracking-wide">Industry</p>
                <p className="text-sm font-semibold text-white mt-1 truncate">{activeBrand.industry || "—"}</p>
              </div>
              <div className="fin-panel-card p-3">
                <p className="text-[10px] fin-panel-sub uppercase tracking-wide">Tagline</p>
                <p className="text-sm font-semibold text-white mt-1 truncate" title={activeBrand.tagline || undefined}>
                  {activeBrand.tagline || "Not set"}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* BRAND MULTI-TENANT WORKSPACE PORTAL (Select to Enter or Create Brands) */}
      <div className="fin-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-[var(--fin-ink)]">N.O.K Os Brand Workspace Registry</h3>
            <p className="text-xs text-[var(--fin-sub)] mt-0.5">
              Select a brand workspace to activate its live-sync performance data, or register a new client brand.
            </p>
          </div>
          <button
            id="dashboard-provision-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold cursor-pointer ${
              showAddForm ? "fin-btn-danger" : "fin-btn-primary"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? "Cancel Registration" : "Register Brand"}</span>
          </button>
        </div>

        {/* Add Brand Form Collapse */}
        {showAddForm && (
          <div className="fin-inset p-5 mb-6 animate-in slide-in-from-top-3 duration-200">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--fin-faint)] mb-4 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-[var(--fin-accent)] mr-2" />
              Register Brand Workspace Protocol
            </h4>
            <form onSubmit={handleCreateBrandSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] tracking-wide uppercase text-[var(--fin-faint)] mb-1.5">Brand Name *</label>
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
                    className="fin-input w-full text-xs px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-wide uppercase text-[var(--fin-faint)] mb-1.5">Domain *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., novacorp.io"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="fin-input w-full text-xs px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-wide uppercase text-[var(--fin-faint)] mb-1.5">Industry Sector *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., SaaS Technologies"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="fin-input w-full text-xs px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-wide uppercase text-[var(--fin-faint)] mb-1.5">Initials (2 char) *</label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    placeholder="e.g., NC"
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value.toUpperCase())}
                    className="fin-input w-full text-xs px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-wide uppercase text-[var(--fin-faint)] mb-1.5">Theme Accent Color</label>
                  <select
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="fin-input w-full text-xs px-3 py-2.5"
                  >
                    <option value="violet">Violet Purple</option>
                    <option value="emerald">Emerald Green</option>
                    <option value="rose">Rose Red</option>
                    <option value="amber">Amber Gold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] tracking-wide uppercase text-[var(--fin-faint)] mb-1.5">Brand Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g., Crafting elegant lifestyle products."
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="fin-input w-full text-xs px-3 py-2.5"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2 gap-2">
                {editingBrandId && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
                    }}
                    className="fin-btn-ghost px-4 py-2 text-xs font-semibold cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="fin-btn-primary px-5 py-2 text-xs font-semibold cursor-pointer"
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
              emerald: "bg-emerald-50 text-emerald-700",
              rose: "bg-rose-50 text-rose-700",
              amber: "bg-amber-50 text-amber-700",
              violet: "fin-badge-accent"
            }[brand.primaryColor || "violet"];

            const textAccent = {
              emerald: "text-emerald-600",
              rose: "text-rose-600",
              amber: "text-amber-600",
              violet: "text-[var(--fin-accent)]"
            }[brand.primaryColor || "violet"];

            return (
              <div
                key={brand.id}
                className={`fin-card-sm p-5 transition-all duration-300 relative flex flex-col justify-between ${
                  isActive ? "ring-2 ring-[var(--fin-accent)] ring-offset-2 ring-offset-white" : "fin-card-hover"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs fin-inset ${textAccent}`}>
                      {brand.logoText}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEditBrand(brand)}
                        className="fin-btn-ghost px-2.5 py-1 text-[10px] font-semibold text-[var(--fin-sub)] hover:text-[var(--fin-accent)] cursor-pointer"
                        title="Edit Brand"
                      >
                        Edit
                      </button>
                      {isActive ? (
                        <span className={`text-[9px] font-semibold uppercase px-2 py-1 rounded-full flex items-center ${badgeColor}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveBrandId(brand.id)}
                          className="fin-btn-primary text-[10px] px-3 py-1.5 font-semibold cursor-pointer"
                        >
                          Enter
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-[var(--fin-ink)]">{brand.name}</h4>
                  <p className="text-[11px] text-[var(--fin-faint)] mt-0.5">{brand.domain}</p>

                  <div className="mt-3 pt-3 border-t border-[var(--fin-line)] space-y-1.5">
                    <div className="flex justify-between text-[11px] text-[var(--fin-faint)]">
                      <span>Sector</span>
                      <span className="font-semibold text-[var(--fin-sub)]">{brand.industry}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-[var(--fin-faint)]">
                      <span>Brand Theme</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${badgeColor}`}>
                        {brand.primaryColor || "violet"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[10px] text-[var(--fin-faint)]">
                  <span className="italic truncate pr-4">
                    {brand.tagline ? `"${brand.tagline}"` : <span className="not-italic">(No tagline)</span>}
                  </span>
                  {isActive && <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${textAccent}`} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty-analytics hint */}
      {!hasRealAnalytics && (
        <div className="fin-card p-6 flex items-center gap-4">
          <span className="fin-icon-chip p-3 shrink-0">
            <Brain className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-[var(--fin-ink)]">
              No analytics data imported yet for {activeBrand?.name || "this brand"}
            </h4>
            <p className="text-xs mt-1 text-[var(--fin-sub)]">
              These stat cards reflect real uploaded performance data. Go to <strong>Analytics Import</strong> to upload a CSV/JSON export and populate this dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Brand Metric Cards Grid */}
      {renderedMetrics.length > 0 && (
        <div id="metric-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {renderedMetrics.map((metric) => {
            const isIncrease = metric.changeType === "increase";
            const isNeutral = metric.changeType === "neutral";
            return (
              <div key={metric.id} id={`metric-card-${metric.id}`} className="fin-card fin-card-hover p-5 relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                  <span className="text-[11px] tracking-wide font-semibold uppercase text-[var(--fin-faint)]">{metric.label}</span>
                  <span
                    className={`flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full fin-badge ${
                      isNeutral ? "fin-badge-neutral" : isIncrease ? "fin-badge-up" : "fin-badge-down"
                    }`}
                  >
                    {isNeutral ? "" : isIncrease ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {metric.change}
                  </span>
                </div>

                <div className="relative z-10 mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-[var(--fin-ink)]">{metric.value}</span>
                  <span className="text-[10px] text-[var(--fin-faint)] uppercase tracking-wide">KPI</span>
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
      )}

      {/* Main Content Dashboard Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG performance chart */}
        <div className="fin-card p-6 flex flex-col justify-between lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[11px] uppercase tracking-wide font-semibold text-[var(--fin-faint)]">
                Performance Aggregation
              </h3>
              <h4 className="text-sm font-semibold mt-1 text-[var(--fin-ink)]">Multi-Channel Active Reach Trend</h4>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[var(--fin-faint)]">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: getAccentHex() }} />
                Reach Scale
              </span>
              <span className="px-2.5 py-1 rounded-full fin-inset font-medium text-[var(--fin-sub)]">7D</span>
            </div>
          </div>

          <div className="h-60 w-full mt-6 flex items-end">
            <div className="w-full h-full relative">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getAccentHex()} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={getAccentHex()} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="50" x2="500" y2="50" stroke="#EEF0F4" strokeWidth="1" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#EEF0F4" strokeWidth="1" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#EEF0F4" strokeWidth="1" />

                <path d="M 0 160 L 80 130 L 160 145 L 240 90 L 320 115 L 400 60 L 500 45 L 500 200 L 0 200 Z" fill="url(#chart-glow)" />

                <path
                  d="M 0 160 L 80 130 L 160 145 L 240 90 L 320 115 L 400 60 L 500 45"
                  fill="none"
                  stroke={getAccentHex()}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <circle cx="240" cy="90" r="4" fill="#fff" stroke={getAccentHex()} strokeWidth="2" />
                <circle cx="400" cy="60" r="4" fill="#fff" stroke={getAccentHex()} strokeWidth="2" />
                <circle cx="500" cy="45" r="4" fill="#fff" stroke={getAccentHex()} strokeWidth="2" />
              </svg>

              <div className="absolute top-[30%] left-[45%] fin-card-sm px-2.5 py-1 text-[10px] font-semibold text-[var(--fin-ink)]">
                Peak: +42.4% reach
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--fin-line)] text-[10px] font-medium text-[var(--fin-faint)]">
            <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
          </div>
        </div>

        {/* Live Active Campaigns Overview */}
        <div className="fin-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[11px] uppercase tracking-wide font-semibold text-[var(--fin-faint)]">Active Pipeline</h3>
              <h4 className="text-sm font-semibold mt-1 text-[var(--fin-ink)]">Upcoming Live Posts</h4>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getBrandBgClass()}`}>
              {queues.length}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[260px] pr-1 fin-scrollbar">
            {queues.slice(0, 3).map((item) => {
              const statusColors = {
                active: "fin-badge-up",
                processing: "bg-amber-50 text-amber-700",
                scheduled: "fin-badge-accent",
                completed: "fin-badge-neutral"
              };
              return (
                <div key={item.id} className="fin-inset p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[var(--fin-faint)]">{item.channel}</span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <h5 className="text-xs font-semibold mt-2 line-clamp-1 text-[var(--fin-ink)]">{item.title}</h5>
                  <p className="text-[10px] text-[var(--fin-sub)] mt-1 line-clamp-2 leading-relaxed">{item.content}</p>
                  <div className="text-[9px] font-medium text-[var(--fin-faint)] mt-2">Sched: {item.scheduledTime}</div>
                </div>
              );
            })}

            {queues.length === 0 && (
              <div className="text-center py-8 text-[var(--fin-faint)] text-xs">No active campaigns in pipeline</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
