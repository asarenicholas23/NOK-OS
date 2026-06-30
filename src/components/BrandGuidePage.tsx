import React from "react";
import { useBrand } from "../context/BrandContext";
import { Palette, Info, Copy, Check, Type, BookOpen, Sparkles, Sliders } from "lucide-react";

export const BrandGuidePage: React.FC = () => {
  const { activeBrand, theme, accentColor } = useBrand();
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

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

  return (
    <div 
      id="style-guide-view" 
      className={`space-y-8 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}
    >
      {/* Title */}
      <div>
        <h2 className={`text-2xl font-bold tracking-tight flex items-center ${isDark ? "text-slate-100" : "text-slate-900"}`}>
          <Palette className={`w-6 h-6 mr-2 ${getBrandTextColor()}`} />
          Style & Guides Center
        </h2>
        <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Review color hex variables, font guidelines, and messaging systems designed specifically for <strong className={getBrandTextColor()}>{activeBrand ? activeBrand.name : "active client brand"}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Color Palette box */}
        <div className="lg:col-span-6 space-y-6">
          <div className={`border rounded-xl p-6 shadow-md ${
            isDark ? "bg-[#161616] border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center space-x-2.5 mb-4">
              <Sparkles className={`w-4 h-4 ${getBrandTextColor()}`} />
              <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>Visual System Palette</h3>
            </div>

            <div className="space-y-4">
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Copy approved hexadecimal variables directly to your canvas palettes to maintain strict visual brand consistency.
              </p>

              {/* Color Block Lists */}
              <div className="space-y-2.5 pt-2">
                {/* Primary Accent */}
                <div className={`border p-4 rounded-lg flex items-center justify-between ${
                  isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center space-x-3.5">
                    <div 
                      className="w-10 h-10 rounded-lg border border-slate-850"
                      style={{ backgroundColor: getHexValue() }}
                    />
                    <div>
                      <div className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Brand Primary Accent</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{getHexValue().toUpperCase()}</div>
                    </div>
                  </div>

                  <button
                    id="copy-primary-hex"
                    onClick={() => triggerCopy(getHexValue(), "primary")}
                    className={`p-1.5 rounded-md transition-colors ${
                      isDark ? "text-slate-500 hover:text-slate-300 hover:bg-slate-900" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {copiedText === "primary" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Dark canvas */}
                <div className={`border p-4 rounded-lg flex items-center justify-between ${
                  isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-lg border border-slate-850 bg-slate-950" />
                    <div>
                      <div className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Slate Canvas Background</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">#020617</div>
                    </div>
                  </div>

                  <button
                    id="copy-bg-hex"
                    onClick={() => triggerCopy("#020617", "bg")}
                    className={`p-1.5 rounded-md transition-colors ${
                      isDark ? "text-slate-500 hover:text-slate-300 hover:bg-slate-900" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {copiedText === "bg" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Slate surface */}
                <div className={`border p-4 rounded-lg flex items-center justify-between ${
                  isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-10 h-10 rounded-lg border border-slate-850 ${isDark ? "bg-slate-900" : "bg-white"}`} />
                    <div>
                      <div className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Surface Card Fill</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{isDark ? "#161616" : "#FFFFFF"}</div>
                    </div>
                  </div>

                  <button
                    id="copy-card-hex"
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
        </div>

        {/* Fonts & Archetypes */}
        <div className="lg:col-span-6 space-y-6">
          <div className={`border rounded-xl p-6 shadow-md ${
            isDark ? "bg-[#161616] border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center space-x-2.5 mb-4">
              <Type className={`w-4 h-4 ${getBrandTextColor()}`} />
              <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>Typography & Font Scales</h3>
            </div>

            <div className="space-y-4">
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Utilize these verified typeface configurations across product headings and operation descriptions.
              </p>

              <div className="space-y-3 pt-2">
                <div className={`border p-4 rounded-lg ${
                  isDark ? "bg-slate-950 border-slate-855" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wide mb-2">Display Headings</div>
                  <div className={`text-lg font-bold tracking-tight font-sans ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    Space Grotesk / Inter Bold
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">font-sans tracking-tight</p>
                </div>

                <div className={`border p-4 rounded-lg ${
                  isDark ? "bg-slate-950 border-slate-855" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wide mb-2">Technical Data & Lists</div>
                  <div className={`text-xs font-medium font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    JetBrains Mono Regular (12px)
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">font-mono text-xs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Archetype voice Tone */}
          <div className={`border rounded-xl p-6 shadow-md ${
            isDark ? "bg-[#161616] border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center space-x-2.5 mb-4">
              <Sliders className={`w-4 h-4 ${getBrandTextColor()}`} />
              <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>Message Archetypes</h3>
            </div>

            <div className="space-y-3.5">
              <div className={`border p-4 rounded-lg ${
                isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wide mb-1.5">Approved Voice tone</div>
                <p className={`text-xs leading-relaxed italic ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  "{activeBrand ? activeBrand.voiceTone : "Professional, informative, and authoritative."}"
                </p>
              </div>

              <div className={`border p-4 rounded-lg ${
                isDark ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"
              }`}>
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wide mb-1.5">Primary Positioning Tagline</div>
                <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {activeBrand ? activeBrand.tagline : "Unifying global pipelines through intelligent automation."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
