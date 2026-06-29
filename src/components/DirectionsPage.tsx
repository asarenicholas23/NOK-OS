import React, { useState, useEffect } from "react";
import { useBrand } from "../context/BrandContext";
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
  FileText 
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
    deleteDirection, 
    addCreativeBrief, 
    addNotification 
  } = useBrand();

  const [isDark] = useState(theme === "dark");
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

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
      if (directions.length === 0 && activeBrand) {
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
    setGeneratingDirections(true);
    try {
      const sourceInsights = approvedInsights.length > 0 ? approvedInsights : insights;
      const response = await fetch("/api/generate-directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: activeBrand?.tagline || "Global Standards",
          voiceTone: activeBrand?.voiceTone || "Professional, Authoritative",
          approvedInsights: sourceInsights
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
          checklist: item.checklist
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
    setGeneratingBriefs(true);
    try {
      const sourceDirections = directions.length > 0 ? directions : defaultMockDirections;
      const response = await fetch("/api/generate-briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: activeBrand?.tagline || "Global Standards",
          voiceTone: activeBrand?.voiceTone || "Professional, Authoritative",
          approvedDirections: sourceDirections
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

        <div className="flex items-center space-x-3 shrink-0">
          {/* Action triggers */}
          <button
            id="generate-directions-btn"
            onClick={handleGenerateDirections}
            disabled={generatingDirections}
            className={`px-4 py-2 border rounded-lg font-mono text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              generatingDirections
                ? "bg-slate-800 border-slate-750 text-slate-500 cursor-not-allowed"
                : isDark
                  ? "bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700"
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
                <span>Generate Directions {approvedInsights.length > 0 ? `(${approvedInsights.length} Approved Insights)` : "(All)"}</span>
              </>
            )}
          </button>

          <button
            id="generate-briefs-btn"
            onClick={handleGenerateBriefs}
            disabled={generatingBriefs || directions.length === 0}
            className={`px-4 py-2 border rounded-lg font-mono text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              generatingBriefs || directions.length === 0
                ? "bg-slate-800 border-slate-750 text-slate-500 cursor-not-allowed"
                : isDark
                  ? "bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700 animate-pulse"
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
                <span>Generate Content Briefs</span>
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
            isDark ? "bg-[#111] border-slate-800" : "bg-white border-slate-200 shadow-lg"
          }`}
        >
          <div className="flex items-center justify-between border-b border-dashed pb-3 border-slate-800/50">
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
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200"
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
                  isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200"
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
                isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200"
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
                isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200"
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

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {directions.map((dir, idx) => (
            <div 
              key={dir.id || idx} 
              id={`direction-card-${dir.id}`}
              className={`border rounded-xl p-6 shadow-md hover:border-slate-350 dark:hover:border-slate-750 transition-colors relative group ${
                isDark ? "bg-[#161616] border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              {/* Card Title Header with delete */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${getBrandAccentClass()}`}>
                    0{idx + 1}
                  </div>
                  <h3 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{dir.pillar}</h3>
                </div>

                <button
                  id={`delete-direction-${dir.id}`}
                  onClick={() => deleteDirection(dir.id)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Remove Brand Direction"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
                            isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getBrandDotBg()}`} />
                          <span className={`font-normal ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {directions.length === 0 && (
            <div className="text-center py-16 border border-dashed border-slate-800/60 rounded-xl">
              <Waypoints className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-400">No brand directions configured</h4>
              <p className="text-xs text-slate-500 mt-1">Select "Generate Directions" above to transform approved insights into campaign pillars.</p>
            </div>
          )}
        </div>

        {/* Brand Compass Sidebar */}
        <div className={`border rounded-xl p-6 shadow-lg flex flex-col justify-between lg:col-span-4 ${
          isDark ? "bg-[#161616] border-slate-800" : "bg-white border-slate-200 shadow-sm"
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
              <div className={`border p-4 rounded-lg space-y-1 ${isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-[10px] font-mono uppercase tracking-wide text-slate-400 font-semibold flex items-center">
                  <Flag className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                  Primary Brand Objective
                </div>
                <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {activeBrand ? activeBrand.tagline : "N/A"}
                </p>
              </div>

              <div className={`border p-4 rounded-lg space-y-1 ${isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
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

          <div className="text-[9px] font-mono text-slate-400 border-t border-slate-250 dark:border-slate-800 pt-4 mt-4">
            Authorized for serverless sync by admin.
          </div>
        </div>
      </div>
    </div>
  );
};
