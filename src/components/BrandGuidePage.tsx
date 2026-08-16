import React, { useState, useEffect } from "react";
import { useBrand } from "../context/BrandContext";
import { apiFetch } from "../lib/apiBase";
import { 
  Palette, Copy, Check, Type, Sparkles, Sliders, Save, FileText, Users, Flame, Globe,
  Megaphone, Shield, Send, Heart, Target, AlertCircle, RefreshCw, ShoppingBag, Award
} from "lucide-react";

interface CampaignObjectiveOption {
  id: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  icon: React.ComponentType<any>;
}

export const BrandGuidePage: React.FC = () => {
  const { activeBrand, theme, accentColor, updateBrand, rawAnalytics, resetBrandData } = useBrand();
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Editable brand guide state
  const [brandDescription, setBrandDescription] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("awareness");
  const [contentPillars, setContentPillars] = useState("");
  const [audiencePersonas, setAudiencePersonas] = useState("");
  const [competitorContext, setCompetitorContext] = useState("");
  const [platformNotes, setPlatformNotes] = useState("");

  // Loading/Operation states
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingBox, setGeneratingBox] = useState<string | null>(null);

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  // Predefined high-value Campaign Objectives
  const campaignObjectives: CampaignObjectiveOption[] = [
    {
      id: "awareness",
      title: "Awareness & Discovery",
      shortDesc: "Educate prospects about offerings",
      fullDesc: "The brand wants to make people aware of the brand, its unique values, and what it has to offer.",
      icon: Megaphone
    },
    {
      id: "leads",
      title: "Leads Acquisition",
      shortDesc: "Build contact list for sales",
      fullDesc: "The brand wants to build their leads database (emails, signups) so sales can continue the work to convert them.",
      icon: Send
    },
    {
      id: "sales",
      title: "Direct Sales & Revenue",
      shortDesc: "Sell products and services",
      fullDesc: "The brand just wants to sell their physical products, digital services, subscriptions, and/or goods directly.",
      icon: ShoppingBag
    },
    {
      id: "growth",
      title: "Growth & Publicity",
      shortDesc: "Grow digital audience & reach",
      fullDesc: "The brand wants to become popular, increase impressions, and grow their numbers/followers on digital platforms.",
      icon: Target
    },
    {
      id: "launch",
      title: "Product/Feature Launch",
      shortDesc: "Introduce new releases with hype",
      fullDesc: "Introduce a new product or feature to the market with high visual impact, countdowns, and feature reviews.",
      icon: Sparkles
    },
    {
      id: "community",
      title: "Community & Retention",
      shortDesc: "Foster loyalty and user discussions",
      fullDesc: "Drive discussions amongst existing users, share user-generated content, and cultivate brand loyalty.",
      icon: Heart
    },
    {
      id: "repositioning",
      title: "Pivot & Re-positioning",
      shortDesc: "Shift perception or segment",
      fullDesc: "Change the brand's perception, appeal to a new target demographic, or establish deep authority in a new sector.",
      icon: Shield
    },
    {
      id: "event",
      title: "Event Promotion",
      shortDesc: "Drive registration & attendance",
      fullDesc: "Maximize sign-ups, excitement, and attendance for upcoming live webinars, summits, or product launches.",
      icon: Award
    }
  ];

  // Sync state when activeBrand changes
  useEffect(() => {
    if (activeBrand) {
      setBrandDescription(activeBrand.brandDescription || "");
      setCampaignObjective(activeBrand.campaignObjective || "awareness");
      setContentPillars(activeBrand.contentPillars || "");
      setAudiencePersonas(activeBrand.audiencePersonas || "");
      setCompetitorContext(activeBrand.competitorContext || "");
      setPlatformNotes(activeBrand.platformNotes || "");
    }
  }, [activeBrand]);

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const getBrandTextColor = () => {
    if (activeColor === "emerald") return "text-emerald-500 dark:text-emerald-400";
    if (activeColor === "rose") return "text-rose-500 dark:text-rose-400";
    if (activeColor === "amber") return "text-amber-500 dark:text-amber-400";
    return "text-violet-500 dark:text-violet-400";
  };

  const getHexValue = () => {
    if (activeColor === "emerald") return "#10b981";
    if (activeColor === "rose") return "#f43f5e";
    if (activeColor === "amber") return "#f59e0b";
    return "#8b5cf6"; // Violet
  };

  const handleSaveGuide = async () => {
    if (!activeBrand) return;
    setIsSaving(true);
    try {
      await updateBrand(activeBrand.id, {
        brandDescription,
        campaignObjective,
        contentPillars,
        audiencePersonas,
        competitorContext,
        platformNotes
      });
    } catch (error) {
      console.error("Error saving brand guidelines:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getBrandBgStyle = () => {
    if (activeColor === "emerald") return "bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500/50";
    if (activeColor === "rose") return "bg-rose-600 hover:bg-rose-500 focus:ring-rose-500/50";
    if (activeColor === "amber") return "bg-amber-600 hover:bg-amber-500 focus:ring-amber-500/50";
    return "bg-violet-600 hover:bg-violet-500 focus:ring-violet-500/50";
  };

  const getBrandBgLightStyle = () => {
    if (activeColor === "emerald") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20";
    if (activeColor === "rose") return "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20";
    if (activeColor === "amber") return "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20";
    return "bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/20";
  };

  const getBrandBorderStyle = () => {
    if (activeColor === "emerald") return "focus-within:border-emerald-500 focus-within:ring-emerald-500/20";
    if (activeColor === "rose") return "focus-within:border-rose-500 focus-within:ring-rose-500/20";
    if (activeColor === "amber") return "focus-within:border-amber-500 focus-within:ring-amber-500/20";
    return "focus-within:border-violet-500 focus-within:ring-violet-500/20";
  };

  const getActiveObjectiveObj = () => {
    return campaignObjectives.find(obj => obj.id === campaignObjective) || campaignObjectives[0];
  };

  // Global & Individual Suggestion Handler. Accepts an objective override so
  // callers that just changed the objective (state updates are async) can pass
  // the new value directly instead of reading a stale closure over campaignObjective.
  const handleSuggestAI = async (
    targetField: "all" | "contentPillars" | "audiencePersonas" | "competitorContext" | "platformNotes",
    objectiveIdOverride?: string
  ) => {
    if (!activeBrand) return;

    if (targetField === "all") {
      setIsGeneratingAll(true);
    } else {
      setGeneratingBox(targetField);
    }

    try {
      const activeObjective = campaignObjectives.find(obj => obj.id === (objectiveIdOverride || campaignObjective)) || campaignObjectives[0];

      const response = await apiFetch("/api/suggest-brand-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: activeBrand.name,
          industry: activeBrand.industry,
          tagline: activeBrand.tagline,
          voiceTone: activeBrand.voiceTone,
          brandDescription: brandDescription,
          campaignObjective: activeObjective.title + " - " + activeObjective.fullDesc,
          analyticsData: rawAnalytics || []
        })
      });

      if (!response.ok) {
        throw new Error("AI generation endpoint failed");
      }

      const data = await response.json();

      if (targetField === "all") {
        if (data.contentPillars) setContentPillars(data.contentPillars);
        if (data.audiencePersonas) setAudiencePersonas(data.audiencePersonas);
        if (data.competitorContext) setCompetitorContext(data.competitorContext);
        if (data.platformNotes) setPlatformNotes(data.platformNotes);
      } else {
        if (targetField === "contentPillars" && data.contentPillars) setContentPillars(data.contentPillars);
        if (targetField === "audiencePersonas" && data.audiencePersonas) setAudiencePersonas(data.audiencePersonas);
        if (targetField === "competitorContext" && data.competitorContext) setCompetitorContext(data.competitorContext);
        if (targetField === "platformNotes" && data.platformNotes) setPlatformNotes(data.platformNotes);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions from AI:", error);
    } finally {
      setIsGeneratingAll(false);
      setGeneratingBox(null);
    }
  };
  
  const handleResetWorkspace = async () => {
    if (!activeBrand) return;
    if (!showConfirmReset) {
      setShowConfirmReset(true);
      return;
    }
    setIsResetting(true);
    try {
      await resetBrandData(activeBrand.id);
      setShowConfirmReset(false);
    } catch (error) {
      console.error("Error resetting workspace:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const hasChanges = activeBrand ? (
    brandDescription !== (activeBrand.brandDescription || "") ||
    campaignObjective !== (activeBrand.campaignObjective || "awareness") ||
    contentPillars !== (activeBrand.contentPillars || "") ||
    audiencePersonas !== (activeBrand.audiencePersonas || "") ||
    competitorContext !== (activeBrand.competitorContext || "") ||
    platformNotes !== (activeBrand.platformNotes || "")
  ) : false;

  return (
    <div 
      id="style-guide-view" 
      className={`space-y-8 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}
    >
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight flex items-center ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            <Palette className={`w-6 h-6 mr-2 ${getBrandTextColor()}`} />
            Brand positioning, objectives & guide Spec Sheets
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Configure brand-safety coordinates, core pillars, campaign objectives and use Gemini AI to generate custom directions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeBrand && (
            <>
              {/* Global AI Suggestion Button */}
              <button
                id="ai-suggest-all-guide-btn"
                onClick={() => handleSuggestAI("all")}
                disabled={isGeneratingAll || generatingBox !== null}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer ${
                  isGeneratingAll 
                    ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed" 
                    : getBrandBgLightStyle()
                }`}
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingAll ? "animate-spin" : ""}`} />
                <span>{isGeneratingAll ? "Synthesizing Guidelines..." : "AI Suggest All Coordinates"}</span>
              </button>

              <button
                id="save-brand-guide-btn"
                onClick={handleSaveGuide}
                disabled={isSaving || !hasChanges}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  hasChanges 
                    ? `${getBrandBgStyle()} text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0` 
                    : "bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
                <span>{isSaving ? "Saving..." : hasChanges ? "Save Brand Guide" : "Saved"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Strategy Coordinate Info Alert banner */}
      <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs leading-relaxed ${
        isDark ? "bg-slate-900/30 border-border text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
      }`}>
        <AlertCircle className={`w-5 h-5 flex-shrink-0 ${getBrandTextColor()}`} />
        <div>
          <span className="font-bold">Optimizing Positioning Suggestions:</span> Fill in the <span className="font-semibold">Brand Description</span> first, then choose an active <span className="font-semibold">Campaign Objective</span> below — the AI will automatically fill in the coordinates the first time. Re-run anytime with "AI Suggest All Coordinates." If you also import social media raw analytics, suggestions will be tailored precisely to what is already working!
        </div>
      </div>

      {/* Grid of Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Brand Strategy Guidelines Form */}
        <div className="lg:col-span-8 space-y-6">

          {/* Section 1: Brand Core Description */}
          <div className={`border rounded-xl p-6 shadow-md transition-all duration-200 ${
            isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
          } ${getBrandBorderStyle()}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <Sliders className={`w-4 h-4 ${getBrandTextColor()}`} />
                <h3 className={`text-sm font-bold tracking-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  Brand Description & Mission Coordinates
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Coordinates</span>
            </div>
            <textarea
              id="brand-description-input"
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              placeholder="Tell us what this brand does. E.g., An elite performance gym based in Austin, TX offering custom fitness, data-backed exercise reviews, and premium nutrition coaches for peak professionals."
              className={`w-full h-24 p-4 text-xs rounded-lg border focus:outline-none transition-colors duration-200 leading-relaxed ${
                isDark 
                  ? "bg-slate-900/40 border-slate-700/50 text-slate-200 focus:border-slate-500 placeholder-slate-600 focus:bg-slate-900/80" 
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-350 placeholder-slate-400 focus:bg-white"
              }`}
            />
          </div>

          {/* Section 2: Active Campaign Objective Selector Grid */}
          <div className={`border rounded-xl p-6 shadow-md ${
            isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <Target className={`w-4 h-4 ${getBrandTextColor()}`} />
                <h3 className={`text-sm font-bold tracking-tight ${isDark ? "text-slate-200" : "text-slate-850"}`}>
                  Active Campaign Objective Selector
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Objectives</span>
            </div>

            <p className={`text-xs mb-4 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Select an objective. All subsequent AI suggestions, content pillar weights, and platform distribution strategies will optimize towards achieving this specific business outcome.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {campaignObjectives.map((obj) => {
                const ObjIcon = obj.icon;
                const isSelected = campaignObjective === obj.id;
                return (
                  <button
                    key={obj.id}
                    id={`objective-card-${obj.id}`}
                    onClick={() => {
                      setCampaignObjective(obj.id);
                      // First-time setup: mission is filled in, no coordinates generated yet.
                      // Auto-fill them now that a goal has been picked, matching the intended
                      // mission -> goal -> AI-fill flow, without clobbering existing edits.
                      const fieldsEmpty = !contentPillars && !audiencePersonas && !competitorContext && !platformNotes;
                      if (brandDescription.trim() && fieldsEmpty && !isGeneratingAll) {
                        handleSuggestAI("all", obj.id);
                      }
                    }}
                    className={`p-4 rounded-xl text-left border flex items-start space-x-3 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      isSelected
                        ? isDark
                          ? "bg-slate-900 border-slate-600 ring-1 ring-slate-600"
                          : "bg-slate-50 border-slate-400 ring-1 ring-slate-400"
                        : isDark
                          ? "bg-slate-950/40 border-border/80 hover:bg-slate-900/40"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg border ${
                      isSelected 
                        ? isDark ? "bg-slate-800 border-slate-600 text-white" : "bg-slate-100 border-slate-350 text-slate-900"
                        : isDark ? "bg-slate-900/60 border-border text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}>
                      <ObjIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${
                          isSelected 
                            ? isDark ? "text-white" : "text-slate-900" 
                            : isDark ? "text-slate-300" : "text-slate-700"
                        }`}>
                          {obj.title}
                        </span>
                        {isSelected && (
                          <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                            activeColor === "emerald" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            activeColor === "rose" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                            activeColor === "amber" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                          }`}>
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                        {obj.fullDesc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: The brand guide pillars & boxes */}
          
          {/* Content Pillars */}
          <div className={`border rounded-xl p-6 shadow-md transition-all duration-200 ${
            isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
          } ${getBrandBorderStyle()}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <FileText className={`w-4 h-4 ${getBrandTextColor()}`} />
                <h3 className={`text-sm font-bold tracking-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  Content Pillars
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  id="ai-suggest-pillars-btn"
                  onClick={() => handleSuggestAI("contentPillars")}
                  disabled={isGeneratingAll || generatingBox !== null}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border cursor-pointer transition-all duration-150 ${
                    generatingBox === "contentPillars"
                      ? "bg-slate-800 text-slate-500 border-slate-700"
                      : getBrandBgLightStyle()
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${generatingBox === "contentPillars" ? "animate-spin" : ""}`} />
                  <span>{generatingBox === "contentPillars" ? "Suggesting..." : "Suggest Pillars"}</span>
                </button>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider hidden sm:inline">Pillars & Focus</span>
              </div>
            </div>
            <textarea
              id="brand-pillars-input"
              value={contentPillars}
              onChange={(e) => setContentPillars(e.target.value)}
              placeholder="Define your core content pillars. E.g., High-Intensity Training, Clean Nutrition Science, Mental Performance Habits..."
              className={`w-full h-36 p-4 text-xs rounded-lg border focus:outline-none transition-colors duration-200 leading-relaxed ${
                isDark 
                  ? "bg-slate-900/40 border-slate-700/50 text-slate-200 focus:border-slate-500 placeholder-slate-600 focus:bg-slate-900/80" 
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-350 placeholder-slate-400 focus:bg-white"
              }`}
            />
          </div>

          {/* Audience Personas */}
          <div className={`border rounded-xl p-6 shadow-md transition-all duration-200 ${
            isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
          } ${getBrandBorderStyle()}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <Users className={`w-4 h-4 ${getBrandTextColor()}`} />
                <h3 className={`text-sm font-bold tracking-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  Audience Personas
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  id="ai-suggest-audience-btn"
                  onClick={() => handleSuggestAI("audiencePersonas")}
                  disabled={isGeneratingAll || generatingBox !== null}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border cursor-pointer transition-all duration-150 ${
                    generatingBox === "audiencePersonas"
                      ? "bg-slate-800 text-slate-500 border-slate-700"
                      : getBrandBgLightStyle()
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${generatingBox === "audiencePersonas" ? "animate-spin" : ""}`} />
                  <span>{generatingBox === "audiencePersonas" ? "Suggesting..." : "Suggest Personas"}</span>
                </button>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider hidden sm:inline">Targets</span>
              </div>
            </div>
            <textarea
              id="brand-audience-input"
              value={audiencePersonas}
              onChange={(e) => setAudiencePersonas(e.target.value)}
              placeholder="Describe your target audience personas. E.g., Busy professional (30-45) looking for efficient 20-min home workouts, Athletic hobbyist aiming to peak in amateur triathlons..."
              className={`w-full h-36 p-4 text-xs rounded-lg border focus:outline-none transition-colors duration-200 leading-relaxed ${
                isDark 
                  ? "bg-slate-900/40 border-slate-700/50 text-slate-200 focus:border-slate-500 placeholder-slate-600 focus:bg-slate-900/80" 
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-350 placeholder-slate-400 focus:bg-white"
              }`}
            />
          </div>

          {/* Competitor Context */}
          <div className={`border rounded-xl p-6 shadow-md transition-all duration-200 ${
            isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
          } ${getBrandBorderStyle()}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <Flame className={`w-4 h-4 ${getBrandTextColor()}`} />
                <h3 className={`text-sm font-bold tracking-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  Competitor Context
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  id="ai-suggest-competitors-btn"
                  onClick={() => handleSuggestAI("competitorContext")}
                  disabled={isGeneratingAll || generatingBox !== null}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border cursor-pointer transition-all duration-150 ${
                    generatingBox === "competitorContext"
                      ? "bg-slate-800 text-slate-500 border-slate-700"
                      : getBrandBgLightStyle()
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${generatingBox === "competitorContext" ? "animate-spin" : ""}`} />
                  <span>{generatingBox === "competitorContext" ? "Suggesting..." : "Suggest Competitors"}</span>
                </button>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider hidden sm:inline">Edge</span>
              </div>
            </div>
            <textarea
              id="brand-competitors-input"
              value={competitorContext}
              onChange={(e) => setCompetitorContext(e.target.value)}
              placeholder="What are competitors doing? How do you differentiate? E.g., Competitors rely heavily on generic stock motivational videos, we differentiate by publishing data-backed exercise science reviews with custom infographics..."
              className={`w-full h-36 p-4 text-xs rounded-lg border focus:outline-none transition-colors duration-200 leading-relaxed ${
                isDark 
                  ? "bg-slate-900/40 border-slate-700/50 text-slate-200 focus:border-slate-500 placeholder-slate-600 focus:bg-slate-900/80" 
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-350 placeholder-slate-400 focus:bg-white"
              }`}
            />
          </div>

          {/* Platform Notes */}
          <div className={`border rounded-xl p-6 shadow-md transition-all duration-200 ${
            isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
          } ${getBrandBorderStyle()}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <Globe className={`w-4 h-4 ${getBrandTextColor()}`} />
                <h3 className={`text-sm font-bold tracking-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  Platform Notes
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  id="ai-suggest-platforms-btn"
                  onClick={() => handleSuggestAI("platformNotes")}
                  disabled={isGeneratingAll || generatingBox !== null}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border cursor-pointer transition-all duration-150 ${
                    generatingBox === "platformNotes"
                      ? "bg-slate-800 text-slate-500 border-slate-700"
                      : getBrandBgLightStyle()
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${generatingBox === "platformNotes" ? "animate-spin" : ""}`} />
                  <span>{generatingBox === "platformNotes" ? "Suggesting..." : "Suggest Platforms"}</span>
                </button>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider hidden sm:inline">Channels</span>
              </div>
            </div>
            <textarea
              id="brand-platforms-input"
              value={platformNotes}
              onChange={(e) => setPlatformNotes(e.target.value)}
              placeholder="Platform-specific strategies and notes. E.g., YouTube is our primary engine for long-form tutorial videos, LinkedIn is used to share behind-the-scenes business scaling logs, Twitter/X is for short fitness threads..."
              className={`w-full h-36 p-4 text-xs rounded-lg border focus:outline-none transition-colors duration-200 leading-relaxed ${
                isDark 
                  ? "bg-slate-900/40 border-slate-700/50 text-slate-200 focus:border-slate-500 placeholder-slate-600 focus:bg-slate-900/80" 
                  : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-350 placeholder-slate-400 focus:bg-white"
              }`}
            />
          </div>

          {hasChanges && (
            <div className="flex justify-end pt-2">
              <button
                id="save-brand-guide-bottom-btn"
                onClick={handleSaveGuide}
                disabled={isSaving}
                className={`flex items-center space-x-2 px-5 py-3 rounded-lg text-xs font-bold shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 hover:-translate-y-0.5 active:translate-y-0 ${getBrandBgStyle()} text-white`}
              >
                <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
                <span>{isSaving ? "Saving Guidelines..." : "Save Brand Guide Changes"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Visual Specifications, Color Palette, and Voice/Tagline */}
        <div className="lg:col-span-4 space-y-6">
          {/* Brand Voice Tone and Tagline */}
          <div className={`border rounded-xl p-6 shadow-md ${
            isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center space-x-2.5 mb-4">
              <Sliders className={`w-4 h-4 ${getBrandTextColor()}`} />
              <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                Tone & Positioning
              </h3>
            </div>

            <div className="space-y-3.5">
              <div className={`border p-4 rounded-lg ${
                isDark ? "bg-slate-950 border-border" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wide mb-1.5">Approved Voice Tone</div>
                <p className={`text-xs leading-relaxed italic ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {activeBrand && activeBrand.voiceTone ? `"${activeBrand.voiceTone}"` : <span className="not-italic text-slate-400">Not specified</span>}
                </p>
              </div>

              <div className={`border p-4 rounded-lg ${
                isDark ? "bg-slate-950 border-border" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wide mb-1.5">Tagline / Positioning</div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {activeBrand && activeBrand.tagline ? activeBrand.tagline : <span className="text-slate-400">None specified</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Color Palette box */}
          <div className={`border rounded-xl p-6 shadow-md ${
            isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center space-x-2.5 mb-4">
              <Sparkles className={`w-4 h-4 ${getBrandTextColor()}`} />
              <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                Visual System Palette
              </h3>
            </div>

            <div className="space-y-4">
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Copy hexadecimal values directly to your canvas layout to maintain strict brand safety.
              </p>

              {/* Color Block Lists */}
              <div className="space-y-2.5 pt-1">
                {/* Primary Accent */}
                <div className={`border p-3.5 rounded-lg flex items-center justify-between ${
                  isDark ? "bg-slate-950 border-slate-855" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-lg border border-border"
                      style={{ backgroundColor: getHexValue() }}
                    />
                    <div>
                      <div className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Primary Accent</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">{getHexValue().toUpperCase()}</div>
                    </div>
                  </div>

                  <button
                    id="copy-primary-hex-accent"
                    onClick={() => triggerCopy(getHexValue(), "primary")}
                    className={`p-1.5 rounded-md transition-colors ${
                      isDark ? "text-slate-500 hover:text-slate-300 hover:bg-slate-900" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {copiedText === "primary" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Dark canvas */}
                <div className={`border p-3.5 rounded-lg flex items-center justify-between ${
                  isDark ? "bg-slate-950 border-slate-855" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg border border-border bg-slate-950" />
                    <div>
                      <div className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Background Slate</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">#020617</div>
                    </div>
                  </div>

                  <button
                    id="copy-bg-hex-accent"
                    onClick={() => triggerCopy("#020617", "bg")}
                    className={`p-1.5 rounded-md transition-colors ${
                      isDark ? "text-slate-500 hover:text-slate-300 hover:bg-slate-900" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {copiedText === "bg" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Slate surface */}
                <div className={`border p-3.5 rounded-lg flex items-center justify-between ${
                  isDark ? "bg-slate-950 border-slate-855" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg border border-border ${isDark ? "bg-slate-900" : "bg-white"}`} />
                    <div>
                      <div className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Surface Card Fill</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">{isDark ? "#161616" : "#FFFFFF"}</div>
                    </div>
                  </div>

                  <button
                    id="copy-card-hex-accent"
                    onClick={() => triggerCopy(isDark ? "#161616" : "#FFFFFF", "card")}
                    className={`p-1.5 rounded-md transition-colors ${
                      isDark ? "text-slate-500 hover:text-slate-300 hover:bg-slate-900" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {copiedText === "card" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className={`border rounded-xl p-6 shadow-md ${
            isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center space-x-2.5 mb-4">
              <Type className={`w-4 h-4 ${getBrandTextColor()}`} />
              <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                Typography Pairings
              </h3>
            </div>

            <div className="space-y-3">
              <div className={`border p-4 rounded-lg ${
                isDark ? "bg-slate-950 border-slate-855" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wide mb-2">Display Headings</div>
                <div className={`text-sm font-bold tracking-tight font-sans ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  Space Grotesk / Inter Bold
                </div>
              </div>

              <div className={`border p-4 rounded-lg ${
                isDark ? "bg-slate-950 border-slate-855" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wide mb-2">Technical Codes</div>
                <div className={`text-xs font-medium font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  JetBrains Mono (12px)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Administration Section */}
      <div className={`border rounded-xl p-6 shadow-md transition-all duration-200 ${
        isDark ? "bg-red-950/5 border-red-950/40" : "bg-red-50/20 border-red-100"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-mono uppercase tracking-wider text-red-500 font-bold flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Workspace Administration
            </h4>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Wipe all generated insights, campaign queues, calendar events, creative briefs, positioning directions, and raw analytics under the <span className="font-semibold text-slate-300 dark:text-white">"{activeBrand?.name}"</span> brand workspace. 
              The visual styling, tagline, voice/tone, brand accents, and guidelines are kept safe.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {showConfirmReset ? (
              <>
                <button
                  id="btn-cancel-reset"
                  onClick={() => setShowConfirmReset(false)}
                  className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md border transition-colors cursor-pointer ${
                    isDark ? "border-border text-slate-400 hover:text-slate-200 hover:bg-slate-900" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-reset"
                  onClick={handleResetWorkspace}
                  disabled={isResetting}
                  className="px-3.5 py-1.5 text-xs font-mono font-bold text-white bg-red-600 hover:bg-red-500 rounded-md shadow-md transition-colors cursor-pointer flex items-center"
                >
                  {isResetting ? "Clearing Workspace..." : "Confirm & Delete Everything"}
                </button>
              </>
            ) : (
              <button
                id="btn-reset-brand-workspace"
                onClick={handleResetWorkspace}
                className="px-3.5 py-1.5 text-xs font-mono font-bold text-red-500 hover:text-white border border-red-500/20 hover:bg-red-600 hover:border-red-600 rounded-md transition-all duration-150 cursor-pointer"
              >
                Reset Workspace Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
