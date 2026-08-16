import React, { useState, useEffect } from "react";
import { useBrand } from "../context/BrandContext";
import { apiFetch } from "../lib/apiBase";
import { 
  Waypoints, 
  Compass, 
  Landmark, 
  Flag, 
  Plus, 
  Trash2, 
  Sparkles, 
  Loader2, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ListTodo, 
  Target, 
  FileText,
  Pencil,
  Square,
  CheckSquare,
  Database 
} from "lucide-react";
import { BrandDirection } from "../lib/firebase";

export const DirectionsPage: React.FC = () => {
  const { 
    activeBrand, 
    theme, 
    accentColor, 
    insights, 
    directions, 
    addDirection, 
    updateDirection,
    deleteDirection, 
    bulkApproveDirections,
    bulkDeleteDirections,
    addCreativeBrief, 
    addNotification 
  } = useBrand();

  const [isDark] = useState(theme === "dark");
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  // Filter & selection states
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Generation count control (default 5)
  const [generationCount, setGenerationCount] = useState<number>(5);

  // Inline editing states for Directions
  const [editingDirectionId, setEditingDirectionId] = useState<string | null>(null);
  const [editDirectionPillar, setEditDirectionPillar] = useState("");
  const [editDirectionStrategy, setEditDirectionStrategy] = useState("");
  const [editDirectionFocus, setEditDirectionFocus] = useState("");
  const [editDirectionChecklistStr, setEditDirectionChecklistStr] = useState("");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [newPillar, setNewPillar] = useState("");
  const [newStrategy, setNewStrategy] = useState("");
  const [newFocus, setNewFocus] = useState("");
  const [newChecklistStr, setNewChecklistStr] = useState("");

  // Loading/action states
  const [generatingDirections, setGeneratingDirections] = useState(false);
  const [generatingBriefs, setGeneratingBriefs] = useState(false);

  // Fallback initial mock data to seed Firestore if empty
  const defaultMockDirections: Omit<BrandDirection, "id" | "brandId">[] = [
    {
      pillar: "Technical Superiority",
      strategy: "Publish benchmarking reports showing 90% latency reduction against legacy container models.",
      focus: "CTO, DevOps Managers, Engineering Leads",
      checklist: ["Assemble cold-start latencies chart", "Produce comparative Dockerfile setups", "Draft core benchmarking whitepaper"]
    },
    {
      pillar: "Capital Efficiency Advocacy",
      strategy: "Highlight down-scaling capabilities to zero idle spend to target lean startups.",
      focus: "SaaS Founders, Finance Controllers",
      checklist: ["Draft 'Zero Idle Cost' calculator brief", "Produce carousel on start-up budget preservation", "Publish case study on startup scaling saves"]
    }
  ];

  // Seed Firestore if empty for active brand
  useEffect(() => {
    const seedIfEmpty = async () => {
      if (!activeBrand) return;
      const seedKey = `nok-os-has-seeded-directions-v3-${activeBrand.id}`;
      const hasSeeded = localStorage.getItem(seedKey);
      if (!hasSeeded && directions.length === 0) {
        localStorage.setItem(seedKey, "true");
        for (const item of defaultMockDirections) {
          await addDirection(item);
        }
      }
    };
    seedIfEmpty();
  }, [directions.length, activeBrand]);

  const getBrandTextColor = () => {
    if (activeColor === "emerald") return "text-emerald-500 dark:text-emerald-400";
    if (activeColor === "rose") return "text-rose-500 dark:text-rose-400";
    if (activeColor === "amber") return "text-amber-500 dark:text-amber-400";
    return "text-violet-500 dark:text-violet-400";
  };

  const getBrandAccentClass = () => {
    if (activeColor === "emerald") return "text-emerald-500 border-emerald-500/20 bg-emerald-500/10";
    if (activeColor === "rose") return "text-rose-500 border-rose-500/20 bg-rose-500/10";
    if (activeColor === "amber") return "text-amber-500 border-amber-500/20 bg-amber-500/10";
    return "text-violet-500 border-violet-500/20 bg-violet-500/10";
  };

  const getBrandDotBg = () => {
    if (activeColor === "emerald") return "bg-emerald-500";
    if (activeColor === "rose") return "bg-rose-500";
    if (activeColor === "amber") return "bg-amber-500";
    return "bg-violet-500";
  };

  const getBrandBgClass = () => {
    if (activeColor === "emerald") return "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600";
    if (activeColor === "rose") return "bg-rose-600 hover:bg-rose-500 text-white border-rose-600";
    if (activeColor === "amber") return "bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-600";
    return "bg-violet-600 hover:bg-violet-500 text-white border-violet-600";
  };

  // Get only approved insights to generate direction
  const approvedInsights = insights.filter(ins => ins.status === "Approved");

  // Handler: Generate brand content direction pillars from approved insights
  const handleGenerateDirections = async () => {
    if (approvedInsights.length === 0) {
      addNotification("Approval Required", "Approve at least one strategic insight before generating brand directions.", "warning");
      return;
    }
    setGeneratingDirections(true);
    try {
      const sourceInsights = approvedInsights;
      const response = await apiFetch("/api/generate-directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: activeBrand?.tagline || "Global Standards",
          voiceTone: activeBrand?.voiceTone || "Professional, Authoritative",
          brandGuide: {
            contentPillars: activeBrand?.contentPillars || "",
            audiencePersonas: activeBrand?.audiencePersonas || "",
            competitorContext: activeBrand?.competitorContext || "",
            platformNotes: activeBrand?.platformNotes || ""
          },
          approvedInsights: sourceInsights,
          count: generationCount
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate brand content directions via Gemini Service");
      }

      const generated = await response.json();

      for (const item of generated) {
        await addDirection({
          pillar: item.pillar,
          strategy: item.strategy,
          focus: item.focus,
          checklist: item.checklist,
          status: "Pending"
        });
      }

      addNotification(
        "Content Directions Built",
        `Synthesized ${generated.length} brand positioning directions using approved performance insights.`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      addNotification("AI Ingestion Interrupted", err.message || "Connection to Gemini interface timed out.", "warning");
    } finally {
      setGeneratingDirections(false);
    }
  };

  // Handler: Generate content briefs from directions
  const handleGenerateBriefs = async () => {
    const approvedDirections = directions.filter(d => d.status === "Approved");
    if (approvedDirections.length === 0) {
      addNotification("Approval Required", "Approve at least one brand direction before generating creative briefs.", "warning");
      return;
    }
    setGeneratingBriefs(true);
    try {
      const sourceDirections = approvedDirections;

      const response = await apiFetch("/api/generate-briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: activeBrand?.tagline || "Global Standards",
          voiceTone: activeBrand?.voiceTone || "Professional, Authoritative",
          brandGuide: {
            contentPillars: activeBrand?.contentPillars || "",
            audiencePersonas: activeBrand?.audiencePersonas || "",
            competitorContext: activeBrand?.competitorContext || "",
            platformNotes: activeBrand?.platformNotes || ""
          },
          approvedDirections: sourceDirections,
          count: generationCount
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate creative briefs via Gemini service");
      }

      const generatedBriefs = await response.json();

      for (const item of generatedBriefs) {
        await addCreativeBrief({
          title: item.title,
          objective: item.objective,
          targetAudience: item.targetAudience,
          keyMessage: item.keyMessage,
          deliverables: item.deliverables,
          status: "Draft"
        });
      }

      addNotification(
        "Content Briefs Generated",
        `Successfully drafted ${generatedBriefs.length} creative campaigns. View them on the Content Briefs dashboard!`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      addNotification("Creative Synthesis Blocked", err.message || "Communication pipeline timed out.", "warning");
    } finally {
      setGeneratingBriefs(false);
    }
  };

  const handleStartDirectionEdit = (dir: BrandDirection) => {
    setEditingDirectionId(dir.id);
    setEditDirectionPillar(dir.pillar);
    setEditDirectionStrategy(dir.strategy);
    setEditDirectionFocus(dir.focus);
    setEditDirectionChecklistStr(dir.checklist ? dir.checklist.join(", ") : "");
  };

  const handleSaveDirectionEdit = async (id: string) => {
    if (!editDirectionPillar || !editDirectionStrategy) return;
    const checklist = editDirectionChecklistStr
      ? editDirectionChecklistStr.split(",").map(item => item.trim()).filter(Boolean)
      : [];
    await updateDirection(id, {
      pillar: editDirectionPillar,
      strategy: editDirectionStrategy,
      focus: editDirectionFocus,
      checklist
    });
    setEditingDirectionId(null);
  };

  const handleToggleSelectDirection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleSelectAllDirections = (allShownIds: string[]) => {
    if (selectedIds.length === allShownIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allShownIds);
    }
  };

  const handleBulkApproveDirections = async () => {
    if (selectedIds.length === 0) return;
    await bulkApproveDirections(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkDeleteDirections = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} brand directions?`)) {
      await bulkDeleteDirections(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPillar || !newStrategy || !newFocus) return;

    const checklist = newChecklistStr
      ? newChecklistStr.split(",").map(item => item.trim()).filter(Boolean)
      : ["Draft initial campaign concept"];

    await addDirection({
      pillar: newPillar,
      strategy: newStrategy,
      focus: newFocus,
      checklist
    });

    setNewPillar("");
    setNewStrategy("");
    setNewFocus("");
    setNewChecklistStr("");
    setShowForm(false);
  };

  const filteredDirections = directions.filter(dir => {
    const status = dir.status || "Pending";
    if (statusFilter === "All") return true;
    return status === statusFilter;
  });

  return (
    <div 
      id="directions-view" 
      className={`space-y-8 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}
    >
      {/* Header and Control Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight flex items-center ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            <Waypoints className={`w-6 h-6 mr-2 ${getBrandTextColor()}`} />
            Brand Positioning & Directions
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Strategic positioning pillars, targeting focuses, and pre-authorized communication pathways for <strong className={getBrandTextColor()}>{activeBrand ? activeBrand.name : "active client brand"}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center space-x-1.5 border border-border bg-slate-950/40 px-2 py-1.5 rounded-lg">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Count</span>
            <select
              id="directions-generation-count-select"
              value={generationCount}
              onChange={(e) => setGenerationCount(Number(e.target.value))}
              className={`text-xs px-1.5 py-0.5 rounded border focus:outline-none focus:ring-1 font-mono cursor-pointer ${
                isDark ? "bg-slate-950 border-border text-slate-200" : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          {/* Action triggers */}
          <button
            id="generate-directions-btn"
            onClick={handleGenerateDirections}
            disabled={generatingDirections || approvedInsights.length === 0}
            title={approvedInsights.length === 0 ? "Approve at least one insight first" : undefined}
            className={`px-4 py-2 border rounded-lg font-mono text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              generatingDirections || approvedInsights.length === 0
                ? "bg-slate-800 border-slate-750 text-slate-500 cursor-not-allowed"
                : isDark
                  ? "bg-slate-900 border-border text-slate-200 hover:border-slate-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
            }`}
          >
            {generatingDirections ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Pillars Structuring...</span>
              </>
            ) : (
              <>
                <Sparkles className={`w-3.5 h-3.5 ${getBrandTextColor()}`} />
                <span>Generate Directions {approvedInsights.length > 0 ? `(${approvedInsights.length} Approved Insights)` : "(Approve Insights First)"}</span>
              </>
            )}
          </button>

          <button
            id="generate-briefs-btn"
            onClick={handleGenerateBriefs}
            disabled={generatingBriefs || directions.filter(d => d.status === "Approved").length === 0}
            title={directions.filter(d => d.status === "Approved").length === 0 ? "Approve at least one direction first" : undefined}
            className={`px-4 py-2 border rounded-lg font-mono text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              generatingBriefs || directions.filter(d => d.status === "Approved").length === 0
                ? "bg-slate-800 border-slate-750 text-slate-500 cursor-not-allowed"
                : isDark
                  ? "bg-slate-900 border-border text-slate-200 hover:border-slate-700 animate-pulse"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
            }`}
          >
            {generatingBriefs ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Briefs Drafting...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>Generate Content Briefs {directions.filter(d => d.status === "Approved").length > 0 ? `(${directions.filter(d => d.status === "Approved").length} Approved)` : "(Approve Directions First)"}</span>
              </>
            )}
          </button>

          <button
            id="directions-add-manual-btn"
            onClick={() => setShowForm(!showForm)}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md ${getBrandBgClass()}`}
          >
            {showForm ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>{showForm ? "Hide Form" : "Add Direction"}</span>
          </button>
        </div>
      </div>

      {/* Manual Direction Form */}
      {showForm && (
        <form 
          onSubmit={handleManualAdd}
          className={`border rounded-xl p-6 space-y-4 animate-in slide-in-from-top-4 duration-200 ${
            isDark ? "bg-sidebar border-border" : "bg-white border-slate-200 shadow-lg"
          }`}
        >
          <div className="flex items-center justify-between border-b border-dashed pb-3 border-border/50">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Inscribe Custom Positioning Pillar</h3>
            <span className="text-[10px] font-mono text-slate-500">Will feed content brief builders</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">Pillar/Theme Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Developer Autonomy"
                value={newPillar}
                onChange={e => setNewPillar(e.target.value)}
                className={`w-full text-xs p-2.5 rounded border focus:outline-none focus:ring-1 ${
                  isDark ? "bg-slate-950 border-border text-slate-200" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">Demographic Focus</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Engineering Lead, DevOps Architect"
                value={newFocus}
                onChange={e => setNewFocus(e.target.value)}
                className={`w-full text-xs p-2.5 rounded border focus:outline-none focus:ring-1 ${
                  isDark ? "bg-slate-950 border-border text-slate-200" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">Execution Strategy description</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Build technical sandboxes and short tutorials demonstrating environment bootstrapping in under 12 seconds."
              value={newStrategy}
              onChange={e => setNewStrategy(e.target.value)}
              className={`w-full text-xs p-2.5 rounded border focus:outline-none focus:ring-1 ${
                isDark ? "bg-slate-950 border-border text-slate-200" : "bg-slate-50 border-slate-200"
              }`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">Milestone Tasks (comma-separated)</label>
            <input 
              type="text" 
              placeholder="e.g. Setup benchmark repository, Shoot video capture, Log latency values"
              value={newChecklistStr}
              onChange={e => setNewChecklistStr(e.target.value)}
              className={`w-full text-xs p-2.5 rounded border focus:outline-none focus:ring-1 ${
                isDark ? "bg-slate-950 border-border text-slate-200" : "bg-slate-50 border-slate-200"
              }`}
            />
          </div>

          <div className="flex justify-end">
            <button
              id="manual-direction-submit-btn"
              type="submit"
              className={`px-5 py-2.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md cursor-pointer ${getBrandBgClass()}`}
            >
              Add Brand Direction
            </button>
          </div>
        </form>
      )}

      {/* Filters and Selection Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex rounded-lg p-1 border ${isDark ? "bg-slate-950 border-border" : "bg-slate-100 border-slate-200"}`}>
            {(["All", "Pending", "Approved", "Rejected"] as const).map(status => {
              const count = status === "All" 
                ? directions.length 
                : directions.filter(d => (d.status || "Pending") === status).length;
              return (
                <button
                  key={status}
                  id={`filter-directions-${status.toLowerCase()}`}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-md transition-colors cursor-pointer ${
                    statusFilter === status
                      ? isDark 
                        ? "bg-slate-800 text-white" 
                        : "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {status} ({count})
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleToggleSelectAllDirections(filteredDirections.map(d => d.id))}
            className={`px-3 py-1.5 rounded border text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              isDark 
                ? "bg-slate-950 border-border text-slate-300 hover:border-slate-700" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
            }`}
          >
            {selectedIds.length === filteredDirections.length && filteredDirections.length > 0 ? (
              <>
                <CheckSquare className={`w-3.5 h-3.5 ${getBrandTextColor()}`} />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>Select All Shown ({filteredDirections.length})</span>
              </>
            )}
          </button>
        </div>

        {/* Bulk Action Panel */}
        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-3 p-1.5 bg-slate-950 border border-border rounded-lg animate-in zoom-in-95 duration-150">
            <span className="text-[10px] font-mono font-bold px-2 text-slate-400">
              {selectedIds.length} SELECTED
            </span>

            <button
              id="bulk-approve-directions-btn"
              onClick={handleBulkApproveDirections}
              className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold rounded flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve</span>
            </button>

            <button
              id="bulk-delete-directions-btn"
              onClick={handleBulkDeleteDirections}
              className="px-2.5 py-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold rounded flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {filteredDirections.map((dir, idx) => {
            const isApproved = dir.status === "Approved";
            const isRejected = dir.status === "Rejected";
            const isSelected = selectedIds.includes(dir.id);
            const statusLabel = dir.status || "Pending";

            return (
              <div 
                key={dir.id || idx} 
                id={`direction-card-${dir.id}`}
                onClick={() => {
                  if (editingDirectionId !== dir.id) {
                    handleToggleSelectDirection(dir.id);
                  }
                }}
                className={`border rounded-xl p-6 shadow-md transition-all relative cursor-pointer group ${
                  isSelected 
                    ? "ring-1 ring-violet-500 border-violet-500/45 scale-[0.99]"
                    : isDark 
                      ? "bg-card border-border" 
                      : "bg-white border-slate-200 hover:shadow-lg"
                }`}
              >
                {editingDirectionId === dir.id ? (
                  <div className="space-y-4 w-full text-left" onClick={e => e.stopPropagation()}>
                    <div className="text-xs font-mono text-slate-400 border-b pb-1.5 uppercase font-bold tracking-wider">
                      Edit Brand Positioning Pillar
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Pillar / Theme Name</label>
                        <input
                          type="text"
                          value={editDirectionPillar}
                          onChange={(e) => setEditDirectionPillar(e.target.value)}
                          className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Execution Strategy</label>
                        <textarea
                          rows={2}
                          value={editDirectionStrategy}
                          onChange={(e) => setEditDirectionStrategy(e.target.value)}
                          className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans resize-none ${
                            isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Demographic Focus</label>
                        <input
                          type="text"
                          value={editDirectionFocus}
                          onChange={(e) => setEditDirectionFocus(e.target.value)}
                          className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Milestones (comma-separated)</label>
                        <input
                          type="text"
                          value={editDirectionChecklistStr}
                          onChange={(e) => setEditDirectionChecklistStr(e.target.value)}
                          className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={() => setEditingDirectionId(null)}
                        className="px-3 py-1.5 rounded text-[11px] font-mono bg-slate-700 hover:bg-slate-600 text-white font-semibold cursor-pointer uppercase"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveDirectionEdit(dir.id)}
                        className="px-3 py-1.5 rounded text-[11px] font-mono bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer uppercase"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Card Title Header with delete */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${getBrandAccentClass()}`}>
                          0{idx + 1}
                        </div>
                        <h3 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{dir.pillar}</h3>
                      </div>

                      <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] font-mono border ${
                          isApproved 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : isRejected 
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}>
                          {statusLabel}
                        </span>

                        {/* Checkbox */}
                        <div 
                          onClick={() => handleToggleSelectDirection(dir.id)}
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

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-wide text-slate-400 flex items-center">
                          <Compass className="w-3 h-3 mr-1 text-slate-500" />
                          Execution Strategy
                        </div>
                        <p className={`text-xs leading-relaxed font-sans ${isDark ? "text-slate-300" : "text-slate-600"}`}>{dir.strategy}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-wide text-slate-400 flex items-center">
                          <Target className="w-3 h-3 mr-1 text-slate-500" />
                          Demographic Target Focus
                        </div>
                        <p className={`text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>{dir.focus}</p>
                      </div>

                      {/* Checklist milestones */}
                      {dir.checklist && dir.checklist.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <div className="text-[10px] font-mono uppercase tracking-wide text-slate-400 flex items-center">
                            <ListTodo className="w-3 h-3 mr-1 text-slate-500" />
                            Required Milestone Checklist
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {dir.checklist.map((item, cidx) => (
                              <div 
                                key={cidx} 
                                className={`border p-3 rounded text-xs flex items-center space-x-2.5 ${
                                  isDark ? "bg-slate-950 border-border" : "bg-slate-50 border-slate-200"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getBrandDotBg()}`} />
                                <span className={`font-normal ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Controls and buttons line */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40" onClick={e => e.stopPropagation()}>
                        <div className="flex space-x-1.5">
                          {!isApproved && (
                            <button
                              id={`approve-dir-btn-${dir.id}`}
                              onClick={() => updateDirection(dir.id, { status: "Approved" })}
                              className="px-2 py-1 hover:bg-emerald-600/15 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono font-semibold"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {!isRejected && (
                            <button
                              id={`reject-dir-btn-${dir.id}`}
                              onClick={() => updateDirection(dir.id, { status: "Rejected" })}
                              className="px-2 py-1 hover:bg-rose-600/15 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono font-semibold"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            id={`edit-dir-btn-${dir.id}`}
                            onClick={() => handleStartDirectionEdit(dir)}
                            className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded transition-colors cursor-pointer"
                            title="Edit Direction"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`delete-dir-btn-${dir.id}`}
                            onClick={() => deleteDirection(dir.id)}
                            className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                            title="Remove Brand Direction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {filteredDirections.length === 0 && (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-xl">
              <Waypoints className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-400">No brand directions found</h4>
              <p className="text-xs text-slate-500 mt-1">Adjust your filters or select "Generate Directions" above to transform approved insights into campaign pillars.</p>
            </div>
          )}
        </div>

        {/* Brand Compass Sidebar */}
        <div className={`border rounded-xl p-6 shadow-lg flex flex-col justify-between lg:col-span-4 ${
          isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="space-y-6">
            <div className="flex items-center space-x-2.5">
              <Compass className={`w-4 h-4 animate-spin ${getBrandTextColor()}`} style={{ animationDuration: "12s" }} />
              <h4 className={`text-xs font-mono uppercase tracking-wider font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Brand Alignment Compass</h4>
            </div>

            <p className={`text-xs leading-relaxed font-sans ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Positioning directions are loaded directly from the database and validated by your core account architects. Ensure all draft campaign operations conform to these directions before triggering publication pipelines.
            </p>

            <div className="space-y-3 pt-2">
              <div className={`border p-4 rounded-lg space-y-1 ${isDark ? "bg-slate-950 border-border" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-[10px] font-mono uppercase tracking-wide text-slate-400 font-semibold flex items-center">
                  <Flag className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                  Primary Brand Objective
                </div>
                <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {activeBrand ? activeBrand.tagline : "N/A"}
                </p>
              </div>

              <div className={`border p-4 rounded-lg space-y-1 ${isDark ? "bg-slate-950 border-border" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-[10px] font-mono uppercase tracking-wide text-slate-400 font-semibold flex items-center">
                  <Landmark className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                  Voice & Tone Standard
                </div>
                <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {activeBrand ? activeBrand.voiceTone : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="text-[9px] font-mono text-slate-400 border-t border-slate-250 dark:border-border pt-4 mt-4">
            Authorized for serverless sync by admin.
          </div>
        </div>
      </div>
    </div>
  );
};
