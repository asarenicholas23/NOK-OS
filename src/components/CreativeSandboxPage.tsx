import React, { useState } from "react";
import { useBrand } from "../context/BrandContext";
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Copy, 
  ExternalLink, 
  Search, 
  Filter, 
  Tag, 
  MessageSquare, 
  Hash, 
  Image, 
  StickyNote, 
  CornerDownRight, 
  Loader2,
  CheckCircle
} from "lucide-react";
import { CreativeIdea } from "../lib/firebase";

export const CreativeSandboxPage: React.FC = () => {
  const { 
    activeBrand, 
    ideas, 
    addCreativeIdea, 
    updateCreativeIdea, 
    deleteCreativeIdea, 
    addCampaign,
    addNotification,
    theme, 
    accentColor 
  } = useBrand();

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState("");

  // Manual insertion form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CreativeIdea["category"]>("general");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // AI sandbox generation states
  const [aiTopic, setAiTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [stagedIdeas, setStagedIdeas] = useState<Omit<CreativeIdea, "id" | "brandId">[]>([]);

  // Inline editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<CreativeIdea["category"]>("general");
  const [editTags, setEditTags] = useState("");

  // Campaign Scheduler Quick Convert State
  const [schedulingIdeaId, setSchedulingIdeaId] = useState<string | null>(null);
  const [scheduleChannel, setScheduleChannel] = useState<"Twitter/X" | "LinkedIn" | "Instagram" | "Newsletter" | "YouTube">("LinkedIn");
  const [scheduleDate, setScheduleDate] = useState("");

  // Copied feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Styling helpers
  const getCategoryStyles = (cat: CreativeIdea["category"]) => {
    switch (cat) {
      case "caption":
        return {
          bg: isDark ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700",
          icon: MessageSquare,
          label: "Caption Draft"
        };
      case "concept":
        return {
          bg: isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700",
          icon: Image,
          label: "Visual Concept"
        };
      case "hashtag":
        return {
          bg: isDark ? "bg-purple-500/10 border-purple-500/30 text-purple-400" : "bg-purple-50 border-purple-200 text-purple-700",
          icon: Hash,
          label: "Hashtag Bank"
        };
      case "inspiration":
        return {
          bg: isDark ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700",
          icon: StickyNote,
          label: "Inspiration Notes"
        };
      default:
        return {
          bg: isDark ? "bg-slate-500/10 border-slate-700/60 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-700",
          icon: StickyNote,
          label: "General"
        };
    }
  };

  const getAccentClass = () => {
    if (activeColor === "emerald") return "emerald-500";
    if (activeColor === "rose") return "rose-500";
    if (activeColor === "amber") return "amber-500";
    return "violet-500";
  };

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addNotification("Copied", "Content successfully copied to clipboard.", "success");
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      addNotification("Missing Fields", "Please populate both Title and Content fields.", "warning");
      return;
    }

    const tagsArr = tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      await addCreativeIdea({
        title,
        category,
        content,
        tags: tagsArr,
        aiGenerated: false,
        createdAt: new Date().toISOString()
      });
      setTitle("");
      setContent("");
      setTagsInput("");
      setCategory("general");
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateSandboxIdeas = async () => {
    if (!aiTopic) {
      addNotification("Topic Required", "Please describe a topic or paste a source brief to spark ideas.", "warning");
      return;
    }

    setGenerating(true);
    setStagedIdeas([]);

    try {
      const response = await fetch("/api/generate-sandbox-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandContext: activeBrand,
          topic: aiTopic
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact Gemini idea sandbox generator.");
      }

      const data = await response.json();
      if (data.ideas && Array.isArray(data.ideas)) {
        setStagedIdeas(data.ideas.map((item: any) => ({
          title: item.title,
          category: item.category || "general",
          content: item.content,
          tags: item.tags || [],
          aiGenerated: true,
          createdAt: new Date().toISOString()
        })));
        addNotification("Inspirations Sparks", "Generated 3 distinctive sandbox elements tailored to your topic!", "success");
      } else {
        throw new Error("Invalid response format received from Gemini sandbox api.");
      }
    } catch (err: any) {
      console.error(err);
      addNotification("AI Generation Error", err.message || "Failed to spark ideas.", "warning");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveStagedIdea = async (index: number) => {
    const item = stagedIdeas[index];
    try {
      await addCreativeIdea({
        title: item.title,
        category: item.category,
        content: item.content,
        tags: item.tags,
        aiGenerated: true,
        createdAt: new Date().toISOString()
      });
      // Remove from staged lists
      setStagedIdeas(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (item: CreativeIdea) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditCategory(item.category);
    setEditTags(item.tags.join(", "));
  };

  const handleSaveEdit = async (id: string) => {
    const tagsArr = editTags
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      await updateCreativeIdea(id, {
        title: editTitle,
        content: editContent,
        category: editCategory,
        tags: tagsArr
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertToCampaign = async (item: CreativeIdea) => {
    if (!scheduleDate) {
      addNotification("Scheduling Date Required", "Please select a date and time to schedule this content.", "warning");
      return;
    }

    try {
      await addCampaign({
        title: item.title,
        channel: scheduleChannel,
        status: "scheduled",
        scheduledTime: scheduleDate,
        content: item.content,
        metrics: {
          estimatedReach: Math.floor(Math.random() * 5000) + 1200,
          engagementRate: parseFloat((Math.random() * 3 + 1.2).toFixed(2))
        }
      });
      setSchedulingIdeaId(null);
      setScheduleDate("");
      addNotification("Converted successfully", "Idea was scheduled and added to the Campaign Operations Queue!", "success");
    } catch (err) {
      console.error(err);
    }
  };

  // Filtering Logic
  const filteredIdeas = ideas.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesTag = !tagFilter || item.tags.includes(tagFilter);

    return matchesSearch && matchesCategory && matchesTag;
  });

  // Extract all unique tags for tag filter list
  const uniqueTags = Array.from(new Set(ideas.flatMap(i => i.tags || [])));

  return (
    <div className={`p-6 min-h-screen font-sans ${isDark ? "bg-[#090909] text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* Page Header */}
      <div id="sandbox-header" className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 mb-8 border-slate-200 dark:border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creative Idea Sandbox</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            A frictionless repository to dump and refine brand notes, caption drafts, visual concepts, and hashtags. Spark concepts instantly using Gemini or manually capture workspace inspiration.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            id="toggle-manual-form"
            onClick={() => {
              setShowForm(!showForm);
              setStagedIdeas([]);
            }}
            className={`flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-lg border transition-all shadow-sm ${
              showForm 
                ? "bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700" 
                : `bg-${getAccentClass()} hover:opacity-90 text-white border-transparent`
            }`}
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showForm ? "Close Drawer" : "Manual Idea Dump"}</span>
          </button>
        </div>
      </div>

      {/* Manual Insertion Drawer / Form */}
      {showForm && (
        <div id="manual-form-container" className="mb-8 p-6 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-slate-950 shadow-md animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-sm font-semibold mb-4 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-emerald-500" />
            <span>Manually Log Inspiration Asset</span>
          </h2>
          <form onSubmit={handleManualAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Idea Title</label>
                <input
                  type="text"
                  placeholder="e.g. Serverless cost benefits post concept"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Sandbox Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="caption">Caption Draft</option>
                  <option value="concept">Visual Concept / Storyboard</option>
                  <option value="hashtag">Hashtag Bank</option>
                  <option value="inspiration">Inspiration Notes</option>
                  <option value="general">General Idea</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Content Body / Snippets / Hashtags</label>
              <textarea
                rows={5}
                placeholder="Paste the caption copy draft, hashtags block, layout design blueprint, or strategic creative note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-xs p-3 font-mono rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Tags (Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Serverless, CostCutting, TechNotes"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`text-xs font-semibold px-5 py-2 rounded-lg text-white bg-${getAccentClass()} hover:opacity-90`}
              >
                Log to Sandbox
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Inspiration Generator Box */}
      <div id="ai-generator-panel" className="mb-8 p-6 rounded-xl border border-slate-200 dark:border-border bg-slate-100/50 dark:bg-slate-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Sparkles className="w-24 h-24 text-indigo-500" />
        </div>
        
        <div className="max-w-3xl">
          <h2 className="text-sm font-semibold flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
            <span>Gemini Creative Idea Spark Engine</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Describe a theme, competitive edge, or topic below. Gemini will instantly generate 3 custom creations (1 high-impact Copy Caption draft, 1 Visual Concept layout, and 1 complete Hashtags bank) aligned with <strong>{activeBrand?.name}</strong>'s guidelines.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <input
              type="text"
              placeholder="e.g. Swapping VM servers for pre-warming adapters to cut serverless latency..."
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="flex-1 text-xs p-3 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleGenerateSandboxIdeas}
              disabled={generating}
              className="flex items-center justify-center space-x-2 text-xs font-semibold px-5 py-3 rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shrink-0"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Spark AI Sandbox Ideas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Staged AI Creations (Pending database commit) */}
        {stagedIdeas.length > 0 && (
          <div id="staged-ideas-panel" className="mt-6 pt-6 border-t border-slate-200 dark:border-border animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono font-semibold text-indigo-500 tracking-wider uppercase">Generated Staged Ideas (Commits to Sandbox)</h3>
              <button 
                onClick={() => setStagedIdeas([])}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline"
              >
                Clear Results
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stagedIdeas.map((item, index) => {
                const styles = getCategoryStyles(item.category);
                const IconComp = styles.icon;

                return (
                  <div key={index} className="flex flex-col bg-white dark:bg-slate-900 border border-indigo-500/20 rounded-xl p-4 shadow-sm relative group">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${styles.bg} font-mono font-medium flex items-center space-x-1`}>
                        <IconComp className="w-3 h-3" />
                        <span>{styles.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Staged</span>
                    </div>

                    <h4 className="text-xs font-semibold mb-2 line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-border/80 font-mono whitespace-pre-wrap overflow-y-auto max-h-36 mb-4 flex-1 scrollbar-thin">
                      {item.content}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.tags.map(t => (
                        <span key={t} className="text-[9px] bg-slate-100 dark:bg-slate-800/50 text-slate-400 px-1.5 py-0.5 rounded">#{t}</span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleSaveStagedIdea(index)}
                      className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Commit to Sandbox</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Explorer / Filter System */}
      <div id="sandbox-explorer" className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-slate-950 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: "All Repository", count: ideas.length },
            { id: "caption", label: "Captions", count: ideas.filter(i => i.category === "caption").length },
            { id: "concept", label: "Concepts", count: ideas.filter(i => i.category === "concept").length },
            { id: "hashtag", label: "Hashtags", count: ideas.filter(i => i.category === "hashtag").length },
            { id: "inspiration", label: "Inspirations", count: ideas.filter(i => i.category === "inspiration").length }
          ].map(tab => (
            <button
              id={`tab-filter-${tab.id}`}
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 border ${
                selectedCategory === tab.id
                  ? `bg-${getAccentClass()} border-transparent text-white shadow-sm`
                  : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-border text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${selectedCategory === tab.id ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Tag Filter controls */}
        <div className="flex items-center space-x-2 min-w-0 md:w-80">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search title, copy or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 focus:outline-none"
            />
          </div>

          {uniqueTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="text-xs p-2 rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 focus:outline-none"
            >
              <option value="">All Tags</option>
              {uniqueTags.map(tag => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Sandbox Grid */}
      {filteredIdeas.length === 0 ? (
        <div id="empty-sandbox" className="text-center py-16 p-6 rounded-xl border border-dashed border-slate-200 dark:border-border bg-white dark:bg-slate-950 shadow-sm">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500 mb-4">
            <StickyNote className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold">No Sandbox Ideas Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== "all" || tagFilter 
              ? "No ideas matched your active filters. Try resetting search parameters."
              : "Your Sandbox is empty. Log a design draft manually or use the Gemini Spark engine to generate copy drafts."}
          </p>
          {(searchTerm || selectedCategory !== "all" || tagFilter) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setTagFilter("");
              }}
              className="text-xs mt-4 text-indigo-500 font-medium underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div id="ideas-sandbox-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map(item => {
            const styles = getCategoryStyles(item.category);
            const IconComp = styles.icon;
            const isEditing = editingId === item.id;
            const isScheduling = schedulingIdeaId === item.id;

            return (
              <div 
                id={`idea-card-${item.id}`}
                key={item.id} 
                className="flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-border/80 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all shadow-sm relative group"
              >
                
                {/* Card Title Bar */}
                <div className="flex items-center justify-between mb-3.5">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${styles.bg} font-mono font-medium flex items-center space-x-1`}>
                    <IconComp className="w-3 h-3 text-current" />
                    <span>{styles.label}</span>
                  </span>
                  
                  {item.aiGenerated && (
                    <span className="text-[9px] bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 px-1.5 py-0.2 rounded-full font-mono flex items-center space-x-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>AI Sparked</span>
                    </span>
                  )}
                </div>

                {/* Main Card Content View / Edit States */}
                {isEditing ? (
                  <div className="space-y-3 flex-1 flex flex-col mb-4">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 focus:outline-none"
                    />
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full text-xs p-2 rounded border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 focus:outline-none"
                    >
                      <option value="caption">Caption Draft</option>
                      <option value="concept">Visual Concept / Storyboard</option>
                      <option value="hashtag">Hashtag Bank</option>
                      <option value="inspiration">Inspiration Notes</option>
                      <option value="general">General Idea</option>
                    </select>
                    <textarea
                      rows={4}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full text-xs p-2 font-mono rounded border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 focus:outline-none flex-1"
                    />
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Tags (comma-separated)"
                      className="w-full text-xs p-2 rounded border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col mb-4 min-w-0">
                    <h3 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100 mb-2 truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100/60 dark:border-border/50 font-mono whitespace-pre-wrap flex-1 leading-relaxed overflow-y-auto max-h-48 scrollbar-thin">
                      {item.content}
                    </p>
                  </div>
                )}

                {/* Tags section */}
                {!isEditing && item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.tags.map(tag => (
                      <span 
                        key={tag} 
                        onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
                        className={`text-[9px] px-2 py-0.5 rounded cursor-pointer font-mono font-medium transition-all ${
                          tagFilter === tag
                            ? `bg-${getAccentClass()} text-white`
                            : "bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Scheduler Convert Drawer */}
                {isScheduling && (
                  <div className="mb-4 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 animate-in slide-in-from-bottom-2">
                    <h4 className="text-[10px] font-mono font-semibold text-indigo-400 uppercase mb-2">Schedule Campaign Release</h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] uppercase text-slate-400 mb-1">Target Channel</label>
                          <select
                            value={scheduleChannel}
                            onChange={(e) => setScheduleChannel(e.target.value as any)}
                            className="w-full text-[10px] p-1.5 rounded border border-slate-700 bg-slate-900 text-slate-200 focus:outline-none"
                          >
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Twitter/X">Twitter/X</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Newsletter">Newsletter</option>
                            <option value="YouTube">YouTube</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase text-slate-400 mb-1">Release Date/Time</label>
                          <input
                            type="datetime-local"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="w-full text-[10px] p-1 rounded border border-slate-700 bg-slate-900 text-slate-200 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-1">
                        <button
                          onClick={() => setSchedulingIdeaId(null)}
                          className="text-[9px] px-2.5 py-1 text-slate-400 border border-slate-700 rounded hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConvertToCampaign(item)}
                          className="text-[9px] px-3 py-1 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-500"
                        >
                          Confirm & Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Action footer bar */}
                <div className="border-t border-slate-100 dark:border-slate-900 pt-3 flex items-center justify-between">
                  <div className="flex space-x-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
                          title="Save Changes"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                          title="Cancel Edit"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded transition-colors"
                          title="Edit Idea content"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyToClipboard(item.content, item.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded transition-colors relative"
                          title="Copy Copy-Text"
                        >
                          {copiedId === item.id ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteCreativeIdea(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Delete Idea"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {!isEditing && !isScheduling && (
                    <button
                      onClick={() => setSchedulingIdeaId(item.id)}
                      className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 py-1 px-2.5 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-lg border border-indigo-500/10 transition-all"
                      title="Convert Idea copy into an operational scheduled Campaign"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>Convert to Scheduled Post</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
