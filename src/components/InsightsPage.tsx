import React, { useState, useEffect } from "react";
import { useBrand } from "../context/BrandContext";
import { 
  Lightbulb, 
  Zap, 
  TrendingUp, 
  HelpCircle, 
  MessageSquare, 
  Flame, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Sparkles, 
  Loader2, 
  Eye, 
  BookOpen, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  Square,
  CheckSquare,
  Database
} from "lucide-react";
import { StrategicInsight } from "../lib/firebase";

export const InsightsPage: React.FC = () => {
  const { 
    activeBrand, 
    theme, 
    accentColor, 
    insights, 
    addInsight, 
    updateInsight, 
    deleteInsight, 
    bulkApproveInsights, 
    bulkDeleteInsights,
    addNotification,
    rawAnalytics
  } = useBrand();

  const [isDark] = useState(theme === "dark");
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  // Filter states
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [standpointFilter, setStandpointFilter] = useState<string>("All");
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Form toggles & states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStandpoint, setNewStandpoint] = useState<"analytics" | "observation" | "opportunity" | "pattern" | "lesson">("analytics");
  const [newMetric, setNewMetric] = useState("");
  const [newChange, setNewChange] = useState("");
  const [newType, setNewType] = useState<"positive" | "warning" | "neutral">("positive");
  
  // Generating state
  const [generating, setGenerating] = useState(false);

  // Fallback initial mock data to seed Firestore if empty
  const defaultMockInsights: Omit<StrategicInsight, "id" | "brandId">[] = [
    {
      title: "LinkedIn Engagement Surge",
      desc: "Posts detailing core memory consumption benchmarks of cold start micro-VMs show +42% CTR against standard marketing announcements.",
      standpoint: "analytics",
      status: "Pending",
      metric: "LinkedIn CTR",
      change: "+4.2%",
      type: "positive"
    },
    {
      title: "Friday Deployment Friction",
      desc: "SaaS technical copy scheduled for Friday afternoons incurs a 22% reduction in overall visibility. We suggest shifting to Monday morning brackets.",
      standpoint: "observation",
      status: "Pending",
      metric: "Friday CTR",
      change: "-22.1%",
      type: "warning"
    },
    {
      title: "Developer Documentation Crossover",
      desc: "Embedding direct sandbox setup code snippets into newsletter briefs generated +120 new sandbox workspace provision registrations.",
      standpoint: "opportunity",
      status: "Pending",
      metric: "New Integrations",
      change: "+112.5%",
      type: "positive"
    },
    {
      title: "Weekly Readership Recurrence",
      desc: "Architectural comparison newsletters sent consistently at 08:30 AM EST on Tuesdays secure a +14.8% open rate spike relative to Thursday broadcasts.",
      standpoint: "pattern",
      status: "Pending",
      metric: "Newsletter Opens",
      change: "+14.8%",
      type: "positive"
    },
    {
      title: "Pricing Transparency Trust",
      desc: "Hiding basic tiered pricing information from landing grids reduced conversion by 18%. Re-establishing clear modular pricing structure is a key learning point.",
      standpoint: "lesson",
      status: "Pending",
      metric: "Conversion Rate",
      change: "-18.2%",
      type: "warning"
    }
  ];

  // Seed Firestore if empty for the active brand
  useEffect(() => {
    const seedIfEmpty = async () => {
      if (insights.length === 0 && activeBrand) {
        for (const item of defaultMockInsights) {
          await addInsight(item);
        }
      }
    };
    seedIfEmpty();
  }, [insights.length, activeBrand]);

  const getBrandTextColor = () => {
    if (activeColor === "emerald") return "text-emerald-500 dark:text-emerald-400";
    if (activeColor === "rose") return "text-rose-500 dark:text-rose-400";
    if (activeColor === "amber") return "text-amber-500 dark:text-amber-400";
    return "text-violet-500 dark:text-violet-400";
  };

  const getBrandBgClass = () => {
    if (activeColor === "emerald") return "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600";
    if (activeColor === "rose") return "bg-rose-600 hover:bg-rose-500 text-white border-rose-600";
    if (activeColor === "amber") return "bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-600";
    return "bg-violet-600 hover:bg-violet-500 text-white border-violet-600";
  };

  const getStandpointIcon = (standpoint: string) => {
    switch (standpoint) {
      case "analytics": return <TrendingUp className="w-3.5 h-3.5" />;
      case "observation": return <Eye className="w-3.5 h-3.5" />;
      case "opportunity": return <Zap className="w-3.5 h-3.5" />;
      case "pattern": return <Activity className="w-3.5 h-3.5" />;
      case "lesson": return <BookOpen className="w-3.5 h-3.5" />;
      default: return <Lightbulb className="w-3.5 h-3.5" />;
    }
  };

  const getStandpointBadgeColor = (standpoint: string) => {
    switch (standpoint) {
      case "analytics": return "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20";
      case "observation": return "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20";
      case "opportunity": return "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20";
      case "pattern": return "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20";
      case "lesson": return "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20";
    }
  };

  // Filter insights list
  const filteredInsights = insights.filter(item => {
    const matchStatus = statusFilter === "All" || item.status === statusFilter;
    const matchStandpoint = standpointFilter === "All" || item.standpoint === standpointFilter;
    return matchStatus && matchStandpoint;
  });

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredInsights.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInsights.map(item => item.id));
    }
  };

  // Actions
  const handleApprove = async (id: string) => {
    await updateInsight(id, { status: "Approved" });
  };

  const handleReject = async (id: string) => {
    await updateInsight(id, { status: "Rejected" });
  };

  const handleDelete = async (id: string) => {
    await deleteInsight(id);
    setSelectedIds(selectedIds.filter(item => item !== id));
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    await bulkApproveInsights(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    await bulkDeleteInsights(selectedIds);
    setSelectedIds([]);
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;

    await addInsight({
      title: newTitle,
      desc: newDesc,
      standpoint: newStandpoint,
      status: "Pending",
      metric: newMetric || "Custom Audit",
      change: newChange || "+0.0%",
      type: newType
    });

    setNewTitle("");
    setNewDesc("");
    setNewMetric("");
    setNewChange("");
    setShowAddForm(false);
  };

  const handleGenerateFromLoadedData = async () => {
    setGenerating(true);
    try {
      const payload = rawAnalytics.length > 0 ? rawAnalytics : [
        { title: "LinkedIn Standard Benchmark", platform: "LinkedIn", type: "Text", impressions: 3200, engagement: 180, engagementRate: 5.6 },
        { title: "Twitter Deployment Thread", platform: "Twitter/X", type: "Text", impressions: 8900, engagement: 560, engagementRate: 6.2 },
        { title: "ESG Keynote Video", platform: "YouTube", type: "Video", impressions: 15400, engagement: 1100, engagementRate: 7.1 }
      ];

      const response = await fetch("/api/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: activeBrand?.tagline || "Global Standards",
          voiceTone: activeBrand?.voiceTone || "Professional, Objective",
          analyticsData: payload
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate strategic insights from Gemini service");
      }

      const generated = await response.json();

      for (const item of generated) {
        await addInsight({
          title: item.title,
          desc: item.desc,
          standpoint: item.standpoint,
          status: "Pending",
          metric: item.metric,
          change: item.change,
          type: item.type
        });
      }

      addNotification(
        "AI Insights Ingested",
        `Discovered ${generated.length} strategic insights from performance telemetry records. Check the board!`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      addNotification("AI Synthesis Error", err.message || "Encountered cloud API interface timeout.", "warning");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div 
      id="insights-view" 
      className={`space-y-8 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}
    >
      {/* Title & Top Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight flex items-center ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            <Lightbulb className={`w-6 h-6 mr-2 ${getBrandTextColor()}`} />
            Strategic Insights Board
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Audited analytics highlights, operational recommendations, and alert telemetry for <strong className={getBrandTextColor()}>{activeBrand ? activeBrand.name : "active client brand"}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            id="insights-generate-loaded-btn"
            onClick={handleGenerateFromLoadedData}
            disabled={generating}
            className={`px-4 py-2 border rounded-lg font-mono text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              generating
                ? "bg-slate-800 border-slate-750 text-slate-500 cursor-not-allowed"
                : isDark
                  ? "bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className={`w-3.5 h-3.5 ${getBrandTextColor()}`} />
                <span>Generate from Loaded Data</span>
              </>
            )}
          </button>

          <button
            id="insights-add-manual-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md ${getBrandBgClass()}`}
          >
            {showAddForm ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide Form</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Manual Insight</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Manual Form */}
      {showAddForm && (
        <form 
          onSubmit={handleManualAdd}
          className={`border rounded-xl p-6 space-y-4 animate-in slide-in-from-top-4 duration-200 ${
            isDark ? "bg-[#111] border-slate-800" : "bg-white border-slate-200 shadow-lg"
          }`}
        >
          <div className="flex items-center justify-between border-b border-dashed pb-3 border-slate-800/50">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Log Manual Strategic Insight</h3>
            <span className="text-[10px] font-mono text-slate-500">Starts in PENDING status</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">Insight Title</label>
              <input 
                type="text" 
                required
                placeholder="e.g. YouTube Video Dropoff"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className={`w-full text-xs p-2.5 rounded border focus:outline-none focus:ring-1 ${
                  isDark 
                    ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-violet-500 focus:ring-violet-500" 
                    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-violet-500 focus:ring-violet-500"
                }`}
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">Standpoint Focus</label>
              <select
                value={newStandpoint}
                onChange={e => setNewStandpoint(e.target.value as any)}
                className={`w-full text-xs p-2.5 rounded border focus:outline-none focus:ring-1 ${
                  isDark 
                    ? "bg-slate-950 border-slate-800 text-slate-300 focus:border-violet-500" 
                    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-violet-500"
                }`}
              >
                <option value="analytics">Analytics (Quantifiable Math)</option>
                <option value="observation">Observation (Behavioral)</option>
                <option value="opportunity">Opportunity (Recommendation)</option>
                <option value="pattern">Pattern (Trend Recurrence)</option>
                <option value="lesson">Lesson (Takeaway/Retrospective)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">Focus Metric</label>
              <input 
                type="text" 
                placeholder="e.g. video retention"
                value={newMetric}
                onChange={e => setNewMetric(e.target.value)}
                className={`w-full text-xs p-2.5 rounded border focus:outline-none focus:ring-1 ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-850"
                }`}
              />
            </div>

            <div className="md:col-span-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">Delta Change</label>
              <input 
                type="text" 
                placeholder="e.g. +14.2%"
                value={newChange}
                onChange={e => setNewChange(e.target.value)}
                className={`w-full text-xs p-2.5 rounded border focus:outline-none focus:ring-1 ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-850"
                }`}
              />
            </div>

            <div className="md:col-span-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as any)}
                className={`w-full text-xs p-2.5 rounded border focus:outline-none focus:ring-1 ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <option value="positive">Positive</option>
                <option value="warning">Warning</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">Insight Description Narrative</label>
            <textarea 
              rows={2}
              required
              placeholder="e.g. Technical overview videos detailing Scope-2 carbon offset audits show a high retention factor of 72% relative to general company announcements."
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className={`w-full text-xs p-2.5 rounded border focus:outline-none focus:ring-1 ${
                isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-850"
              }`}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="manual-insight-submit-btn"
              type="submit"
              className={`px-5 py-2.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md cursor-pointer ${getBrandBgClass()}`}
            >
              Add Strategic Insight
            </button>
          </div>
        </form>
      )}

      {/* Filters and Selection Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/40 pb-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status buttons */}
          <div className={`flex rounded-lg p-1 border ${isDark ? "bg-slate-950 border-slate-850" : "bg-slate-100 border-slate-200"}`}>
            {(["All", "Pending", "Approved", "Rejected"] as const).map(status => (
              <button
                key={status}
                id={`filter-status-${status.toLowerCase()}`}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-md transition-colors cursor-pointer ${
                  statusFilter === status
                    ? isDark 
                      ? "bg-slate-800 text-white" 
                      : "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Standpoint buttons */}
          <div className={`flex rounded-lg p-1 border ${isDark ? "bg-slate-950 border-slate-850" : "bg-slate-100 border-slate-200"}`}>
            {["All", "analytics", "observation", "opportunity", "pattern", "lesson"].map(sp => (
              <button
                key={sp}
                id={`filter-sp-${sp}`}
                onClick={() => setStandpointFilter(sp)}
                className={`px-2.5 py-1.5 text-[10px] font-mono font-semibold rounded-md transition-colors capitalize cursor-pointer ${
                  standpointFilter === sp
                    ? isDark 
                      ? "bg-slate-800 text-white" 
                      : "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Panel */}
        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-3 p-1.5 bg-slate-950 border border-slate-800 rounded-lg animate-in zoom-in-95 duration-150">
            <span className="text-[10px] font-mono font-bold px-2 text-slate-400">
              {selectedIds.length} SELECTED
            </span>

            <button
              id="bulk-approve-btn"
              onClick={handleBulkApprove}
              className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold rounded flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve</span>
            </button>

            <button
              id="bulk-delete-btn"
              onClick={handleBulkDelete}
              className="px-2.5 py-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold rounded flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              id="clear-selection-btn"
              onClick={() => setSelectedIds([])}
              className="text-[10px] font-mono text-slate-500 hover:text-slate-300 px-1 cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Select All Trigger */}
        <button
          id="select-all-trigger"
          onClick={handleSelectAll}
          className={`px-3 py-1.5 rounded border text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            isDark 
              ? "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700" 
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
          }`}
        >
          {selectedIds.length === filteredInsights.length && filteredInsights.length > 0 ? (
            <>
              <CheckSquare className={`w-3.5 h-3.5 ${getBrandTextColor()}`} />
              <span>Deselect All</span>
            </>
          ) : (
            <>
              <Square className="w-3.5 h-3.5" />
              <span>Select All Shown ({filteredInsights.length})</span>
            </>
          )}
        </button>
      </div>

      {/* Insights Grid */}
      <div id="insights-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInsights.map((item, idx) => {
          const isPositive = item.type === "positive";
          const isWarning = item.type === "warning";
          const isApproved = item.status === "Approved";
          const isRejected = item.status === "Rejected";
          const isSelected = selectedIds.includes(item.id);

          return (
            <div 
              key={item.id || idx} 
              id={`insight-item-${item.id}`}
              onClick={() => handleToggleSelect(item.id)}
              className={`border rounded-xl p-6 shadow-md transition-all relative flex flex-col justify-between cursor-pointer group ${
                isSelected 
                  ? "ring-1 ring-violet-500 border-violet-500/45 scale-[0.99] "
                  : isDark 
                    ? "bg-[#161616] border-slate-800/80 hover:border-slate-700" 
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg"
              }`}
            >
              <div className="space-y-3.5">
                {/* Header indicators */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`p-1.5 rounded-lg border flex items-center justify-center ${getStandpointBadgeColor(item.standpoint)}`}>
                      {getStandpointIcon(item.standpoint)}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold capitalize">
                      {item.standpoint}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isPositive 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                        : isWarning 
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" 
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}>
                      {item.change}
                    </span>

                    {/* Checkbox */}
                    <div 
                      onClick={() => handleToggleSelect(item.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                        isSelected 
                          ? "bg-violet-600 border-violet-600 text-white" 
                          : "border-slate-700 bg-slate-950 hover:border-slate-500"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-1.5">
                  <h4 className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    {item.title}
                  </h4>
                  <p className={`text-xs leading-relaxed font-sans ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Status and Actions Row */}
              <div className="space-y-3 mt-4" onClick={e => e.stopPropagation()}>
                {/* Status indicator line */}
                <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-800/40 pt-3 text-slate-500">
                  <span className="flex items-center">
                    <Database className="w-3 h-3 mr-1" />
                    Metric: {item.metric}
                  </span>
                  
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                    isApproved 
                      ? "bg-emerald-500/10 text-emerald-500" 
                      : isRejected 
                        ? "bg-rose-500/10 text-rose-500" 
                        : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {item.status}
                  </span>
                </div>

                {/* Active control action buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex space-x-1">
                    {!isApproved && (
                      <button
                        id={`approve-btn-${item.id}`}
                        onClick={() => handleApprove(item.id)}
                        className="p-1.5 hover:bg-emerald-600/15 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {!isRejected && (
                      <button
                        id={`reject-btn-${item.id}`}
                        onClick={() => handleReject(item.id)}
                        className="p-1.5 hover:bg-rose-600/15 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>

                  <button
                    id={`delete-btn-${item.id}`}
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredInsights.length === 0 && (
          <div className="col-span-full text-center py-16 border border-dashed border-slate-800/60 rounded-xl">
            <Lightbulb className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-400">No strategic insights found</h4>
            <p className="text-xs text-slate-500 mt-1">Try relaxing filters or generate insights from loaded analytics metrics above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
