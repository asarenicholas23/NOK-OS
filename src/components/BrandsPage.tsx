import React, { useState } from "react";
import { useBrand, Brand } from "../context/BrandContext";
import { 
  Layers, 
  Plus, 
  Building, 
  ExternalLink, 
  Globe, 
  CheckCircle, 
  Sparkles,
  Trash2,
  Pencil
} from "lucide-react";

export const BrandsPage: React.FC = () => {
  const { brands, activeBrandId, setActiveBrandId, addBrand, updateBrand, deleteBrand, theme, accentColor } = useBrand();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [primaryColor, setPrimaryColor] = useState("violet");
  const [logoText, setLogoText] = useState("");
  const [tagline, setTagline] = useState("");
  const [voiceTone, setVoiceTone] = useState("");

  const isDark = theme === "dark";
  const activeColor = accentColor || "violet";

  const resetForm = () => {
    setName("");
    setDomain("");
    setIndustry("");
    setLogoText("");
    setTagline("");
    setVoiceTone("");
    setPrimaryColor("violet");
    setEditingBrandId(null);
  };

  const handleToggleForm = () => {
    if (showAddForm) {
      resetForm();
      setShowAddForm(false);
    } else {
      resetForm();
      setShowAddForm(true);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
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

  const getBorderColor = (brandId: string, color: string) => {
    if (brandId === activeBrandId) {
      return "border-cyanotype shadow-lg";
    }
    return isDark ? "border-border hover:border-slate/40" : "border-slate-200 hover:border-slate-300";
  };

  const getBadgeColor = (color: string) => {
    if (color === "emerald") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (color === "rose") return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    if (color === "amber") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
  };

  return (
    <div 
      id="brands-view" 
      className={`space-y-8 animate-in fade-in duration-200 ${isDark ? "text-text" : "text-slate-800"}`}
    >
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-text" : "text-slate-900"}`}>
            Brand Workspace Console
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-muted" : "text-slate-500"}`}>
            Configure and register individual brand workspace identities or toggle operational contexts instantly.
          </p>
        </div>
        <button
          id="btn-trigger-add-brand"
          onClick={handleToggleForm}
          className="flex items-center space-x-2 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-md shadow-md transition-colors font-mono cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? "Cancel" : "Register New Brand"}</span>
        </button>
      </div>

      {/* Provision Form (Conditional rendering) */}
      {showAddForm && (
        <div 
          id="provision-form-card" 
          className={`border rounded-xl p-6 shadow-xl animate-in slide-in-from-top-3 duration-200 ${
            isDark ? "bg-card border-border" : "bg-white border-slate-200"
          }`}
        >
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted mb-4 flex items-center">
            <Sparkles className="w-3.5 h-3.5 text-cyanotype mr-2" />
            {editingBrandId ? "Edit Brand Workspace Identity" : "New Brand Workspace Registry Protocol"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Brand Name *</label>
                <input
                  id="brand-input-name"
                  type="text"
                  required
                  placeholder="e.g., Nova Tech"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!logoText && e.target.value) {
                      setLogoText(e.target.value.substring(0, 2).toUpperCase());
                    }
                  }}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Domain URL *</label>
                <input
                  id="brand-input-domain"
                  type="text"
                  required
                  placeholder="e.g., novatech.ai"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Industry Sector *</label>
                <input
                  id="brand-input-industry"
                  type="text"
                  required
                  placeholder="e.g., Artificial Intelligence"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Logo Initials (2 char) *</label>
                <input
                  id="brand-input-logo"
                  type="text"
                  maxLength={2}
                  required
                  placeholder="e.g., NT"
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value.toUpperCase())}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-mono ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Primary Branding Color Accent</label>
                <select
                  id="brand-input-color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
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
                  id="brand-input-tagline"
                  type="text"
                  placeholder="e.g., Decentralized automation engines."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Voice & Tone Archetype</label>
              <input
                id="brand-input-voice"
                type="text"
                placeholder="e.g., Direct, highly informative, concise, and technical."
                value={voiceTone}
                onChange={(e) => setVoiceTone(e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                  isDark ? "bg-slate-950 border-border text-slate-100" : "bg-white border-slate-200 text-slate-800"
                }`}
              />
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
                id="brand-submit-btn"
                type="submit"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white rounded-md shadow-md font-mono cursor-pointer"
              >
                {editingBrandId ? "Save Brand Updates" : "Execute Registration"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brand Grid list representing workspace brands */}
      <div id="brands-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => {
          const isActive = brand.id === activeBrandId;
          const textAccent = {
            emerald: "text-emerald-500",
            rose: "text-rose-500",
            amber: "text-amber-500",
            violet: "text-cyanotype"
          }[brand.primaryColor || "violet"];

          return (
            <div
              key={brand.id}
              id={`brand-card-${brand.id}`}
              className={`border rounded-xl p-6 transition-all duration-300 shadow-lg relative overflow-hidden flex flex-col justify-between ${
                isDark ? "bg-card" : "bg-white"
              } ${getBorderColor(brand.id, brand.primaryColor || "violet")}`}
            >
              <div>
                {/* Active Indicator Header Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm bg-slate-950 border border-border ${textAccent}`}>
                    {brand.logoText}
                  </div>
                  
                  {isActive ? (
                    <span className="flex items-center space-x-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle className="w-3.5 h-3.5 mr-0.5" />
                      <span>Active Workspace</span>
                    </span>
                  ) : (
                    <button
                      id={`set-active-btn-${brand.id}`}
                      onClick={() => setActiveBrandId(brand.id)}
                      className="text-[10px] font-semibold font-mono text-muted hover:text-text border border-border hover:border-slate/40 px-2.5 py-1 rounded transition-colors bg-card-inner cursor-pointer"
                    >
                      Enter Workspace
                    </button>
                  )}
                </div>

                <h3 className={`text-base font-semibold ${isDark ? "text-text" : "text-slate-900"}`}>{brand.name}</h3>
                
                {/* Technical data table block */}
                <div className={`mt-4 space-y-2 border-t border-b py-3.5 my-3.5 ${isDark ? "border-border" : "border-slate-150"}`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted font-mono">Domain:</span>
                    <span className={`font-mono flex items-center ${isDark ? "text-text" : "text-slate-600"}`}>
                      <Globe className="w-3.5 h-3.5 mr-1 text-muted" />
                      {brand.domain}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted font-mono">Industry:</span>
                    <span className={`flex items-center ${isDark ? "text-text" : "text-slate-600"}`}>
                      <Building className="w-3.5 h-3.5 mr-1 text-muted" />
                      {brand.industry}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted font-mono">Accent Theme:</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase font-mono ${getBadgeColor(brand.primaryColor || "violet")}`}>
                      {brand.primaryColor || "violet"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 mt-2">
                  <div className="text-[10px] font-mono text-muted uppercase tracking-wide">Brand tagline</div>
                  <p className={`text-xs font-sans leading-relaxed italic ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {brand.tagline ? `"${brand.tagline}"` : <span className="text-slate-400 not-italic">(No tagline set)</span>}
                  </p>
                </div>
              </div>

              <div className={`mt-5 pt-3 border-t flex items-center justify-between ${isDark ? "border-border" : "border-slate-150"}`}>
                <span className="text-[9px] font-mono text-muted">ID: {brand.id}</span>
                <div className="flex items-center space-x-2">
                  {confirmingDeleteId === brand.id ? (
                    <div className="flex items-center space-x-1 animate-in fade-in duration-200">
                      <span className="text-[9px] text-rose-500 font-mono font-bold">Sure?</span>
                      <button
                        id={`btn-confirm-delete-${brand.id}`}
                        onClick={() => {
                          deleteBrand(brand.id);
                          setConfirmingDeleteId(null);
                        }}
                        className="text-[9px] font-mono font-semibold text-white bg-rose-600 hover:bg-rose-500 px-1.5 py-0.5 rounded"
                      >
                        Yes
                      </button>
                      <button
                        id={`btn-cancel-delete-${brand.id}`}
                        onClick={() => setConfirmingDeleteId(null)}
                        className="text-[9px] font-mono font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        id={`btn-edit-${brand.id}`}
                        onClick={() => startEditBrand(brand)}
                        className="text-slate-400 hover:text-violet-500 p-1 rounded hover:bg-violet-500/10 transition-colors cursor-pointer"
                        title="Edit Brand Workspace"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-delete-${brand.id}`}
                        onClick={() => setConfirmingDeleteId(brand.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Brand Workspace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
