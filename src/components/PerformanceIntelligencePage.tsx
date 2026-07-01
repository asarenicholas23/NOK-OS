import React from "react";
import { useBrand } from "../context/BrandContext";
import { Brain, Sparkles, Hammer, Layers, Compass, Milestone } from "lucide-react";

export const PerformanceIntelligencePage: React.FC = () => {
  const { activeBrand, theme, accentColor } = useBrand();

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  const getBrandTextColor = () => {
    if (activeColor === "emerald") return "text-emerald-500 dark:text-emerald-400";
    if (activeColor === "rose") return "text-rose-500 dark:text-rose-400";
    if (activeColor === "amber") return "text-amber-500 dark:text-amber-400";
    return "text-violet-500 dark:text-violet-400";
  };

  const getBrandBgLightStyle = () => {
    if (activeColor === "emerald") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (activeColor === "rose") return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    if (activeColor === "amber") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-violet-500/10 text-violet-500 border-violet-500/20";
  };

  const getBrandBorderStyle = () => {
    if (activeColor === "emerald") return "border-emerald-500/30";
    if (activeColor === "rose") return "border-rose-500/30";
    if (activeColor === "amber") return "border-amber-500/30";
    return "border-violet-500/30";
  };

  return (
    <div 
      id="performance-intelligence-wip-view" 
      className={`min-h-[70vh] flex flex-col items-center justify-center text-center p-8 space-y-6 ${
        isDark ? "text-slate-100" : "text-slate-800"
      }`}
    >
      {/* Animated Icon Ring */}
      <div className="relative">
        <div className={`absolute -inset-4 rounded-full blur-xl opacity-30 animate-pulse ${
          activeColor === "emerald" ? "bg-emerald-500" :
          activeColor === "rose" ? "bg-rose-500" :
          activeColor === "amber" ? "bg-amber-500" :
          "bg-violet-500"
        }`} />
        <div className={`relative w-20 h-20 rounded-2xl border-2 flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300 ${
          isDark ? "bg-[#161616] border-slate-800" : "bg-white border-slate-200"
        } ${getBrandBorderStyle()}`}>
          <Brain className={`w-10 h-10 ${getBrandTextColor()}`} />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800">
          <Hammer className="w-4 h-4 text-amber-500 animate-bounce" />
        </div>
      </div>

      {/* Main Copy */}
      <div className="max-w-md space-y-3">
        <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${getBrandBgLightStyle()}`}>
          <Sparkles className="w-3 h-3" />
          <span>Module Redesign in Progress</span>
        </div>
        <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
          Performance AI Workspace (WIP)
        </h2>
        <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          We are currently redesigning the entire Performance Intelligence dashboard, analytics insights generator, and predictive trend metrics model from the ground up to support more robust multi-channel workflows.
        </p>
      </div>

      {/* Strategic Roadmap/Checklist */}
      <div className={`w-full max-w-lg border rounded-xl p-5 text-left text-xs ${
        isDark ? "bg-[#141414] border-slate-850" : "bg-slate-50 border-slate-200 shadow-sm"
      }`}>
        <h4 className={`font-bold font-mono uppercase tracking-wider text-[10px] mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Redesign Workflow Pipeline
        </h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Milestone className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-500">Phase 1: Brand Guide Positioning Core (Completed)</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Preset campaigns, brand description indices, and customizable campaign objectives have been integrated into the central guides context engine.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Layers className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Phase 2: Insights Integration (Completed)</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Added dual-sourcing: generate deep insights either directly from imported raw analytics or automatically synthesized from the Brand Style coordinates.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Compass className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Phase 3: Deep Custom Analytics (In Progress)</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Redesigning full-funnel correlation metrics, advanced platform multi-variant attribution heatmaps, and next-generation prediction engines.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
