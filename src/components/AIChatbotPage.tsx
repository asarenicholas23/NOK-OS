import React, { useState, useRef, useEffect } from "react";
import { useBrand } from "../context/BrandContext";
import { apiFetch } from "../lib/apiBase";
import { 
  MessageSquare, 
  Sparkles, 
  Send, 
  Trash2, 
  Copy, 
  Save, 
  Check, 
  Brain, 
  Lightbulb, 
  Zap, 
  ChevronRight, 
  FileText,
  Info,
  Loader2,
  Bookmark,
  Share2
} from "lucide-react";
import { CreativeBrief } from "../lib/firebase";
import { SlideDeckPreview } from "./SlideDeckPreview";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  briefPayload?: Omit<CreativeBrief, "id" | "brandId">;
}

export const AIChatbotPage: React.FC = () => {
  const { 
    activeBrand, 
    insights, 
    briefs, 
    addCreativeBrief, 
    addNotification, 
    theme, 
    accentColor 
  } = useBrand();

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";
  const brandName = activeBrand?.name || "Active Client Brand";

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      text: `Hello! I am your dedicated AI CMO and Creative Partner for **${brandName}**. 

I have fully ingested your style guidelines, target audience personas, and the latest performance intelligence reports.

How can I help you today? You can:
* **Brainstorm** fresh copywriting campaigns for LinkedIn or Twitter/X.
* **Audit** positioning alignment across active social channels.
* **Draft a complete Creative Brief** (try saying: *"Generate a carousel brief for developers"*). I will load it into our Creative Workbench so you can save it to your registry!`,
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Context toggles
  const [injectBrandGuide, setInjectBrandGuide] = useState(true);
  const [injectPerformance, setInjectPerformance] = useState(true);

  // Workbench Brief State
  const [workbenchBrief, setWorkbenchBrief] = useState<Omit<CreativeBrief, "id" | "brandId"> | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedToRegistry, setSavedToRegistry] = useState(false);
  const [workbenchMode, setWorkbenchMode] = useState<"text" | "slides">("slides");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick start suggestions
  const quickPrompts = [
    {
      label: "Draft Carousel Brief",
      text: "Draft a comprehensive Creative Brief for a 7-slide LinkedIn document carousel. The topic should showcase our core product differentiator tailored to our primary audience persona, addressing their main daily pain point.",
      icon: <FileText className="w-3.5 h-3.5" />
    },
    {
      label: "Propose X Thread Ideas",
      text: "Based on our content pillars and brand voice, propose 3 high-impact Twitter/X thread concepts. Make them highly educational with catchy hooks.",
      icon: <Zap className="w-3.5 h-3.5" />
    },
    {
      label: "Copywriting Polish",
      text: "Rewrite this social post to better match our brand voice & tone: 'We have a great new update that makes your software deploy 10x faster. Try it out now.'",
      icon: <Sparkles className="w-3.5 h-3.5" />
    },
    {
      label: "Differentiate Competitors",
      text: "Suggest 3 creative hooks we can publish to double-down on our competitive advantages against standard alternatives, aligned with our campaign objectives.",
      icon: <Lightbulb className="w-3.5 h-3.5" />
    }
  ];

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Accent mapping helper
  const getBrandTextColor = () => {
    if (activeColor === "emerald") return "text-emerald-500 dark:text-emerald-400";
    if (activeColor === "rose") return "text-rose-500 dark:text-rose-400";
    if (activeColor === "amber") return "text-amber-500 dark:text-amber-400";
    return "text-violet-500 dark:text-violet-400";
  };

  const getBrandBgClass = () => {
    if (activeColor === "emerald") return "bg-emerald-600 hover:bg-emerald-500 text-white";
    if (activeColor === "rose") return "bg-rose-600 hover:bg-rose-500 text-white";
    if (activeColor === "amber") return "bg-amber-600 hover:bg-amber-500 text-slate-950";
    return "bg-violet-600 hover:bg-violet-500 text-white";
  };

  const getBrandFocusRing = () => {
    if (activeColor === "emerald") return "focus:border-emerald-500 focus:ring-emerald-500/20";
    if (activeColor === "rose") return "focus:border-rose-500 focus:ring-rose-500/20";
    if (activeColor === "amber") return "focus:border-amber-500 focus:ring-amber-500/20";
    return "focus:border-violet-500 focus:ring-violet-500/20";
  };

  // Parse ```json_brief code blocks from model response
  const extractBriefFromResponse = (text: string): { cleanText: string; brief?: Omit<CreativeBrief, "id" | "brandId"> } => {
    const marker = "```json_brief";
    const startIndex = text.indexOf(marker);
    if (startIndex === -1) return { cleanText: text };

    try {
      const remaining = text.substring(startIndex + marker.length);
      const endIndex = remaining.indexOf("```");
      if (endIndex === -1) return { cleanText: text };

      const jsonStr = remaining.substring(0, endIndex).trim();
      const parsed = JSON.parse(jsonStr);

      // Clean the message display text by removing the raw JSON code block
      const cleanText = text.substring(0, startIndex).trim() + "\n\n" + remaining.substring(endIndex + 3).trim();

      // Enforce model outputs default Draft state
      const briefData: Omit<CreativeBrief, "id" | "brandId"> = {
        title: parsed.title || "AI Generated Brief",
        objective: parsed.objective || "Awareness & Engagement",
        targetAudience: parsed.targetAudience || "General Target Persona",
        keyMessage: parsed.keyMessage || "Value Proposition Highlights",
        deliverables: parsed.deliverables || "Standard Social Deliverable",
        status: "Draft",
        campaignId: parsed.campaignId || `NOK-${Date.now().toString().slice(-4)}`,
        date: parsed.date || new Date().toLocaleDateString(),
        sequencePosition: parsed.sequencePosition || "Campaign 1 of 1",
        proofPoint: parsed.proofPoint || "",
        formatSpec: parsed.formatSpec || "",
        contentOutline: parsed.contentOutline || "",
        cta: parsed.cta || "",
        toneVisualRef: parsed.toneVisualRef || "",
        successMetric: parsed.successMetric || "",
        approver: parsed.approver || "Team Leader"
      };

      return { cleanText, brief: briefData };
    } catch (e) {
      console.error("Failed parsing brief JSON block from assistant text:", e);
      return { cleanText: text };
    }
  };

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Gather contexts
      const brandContext = injectBrandGuide ? {
        name: activeBrand?.name,
        tagline: activeBrand?.tagline,
        voiceTone: activeBrand?.voiceTone,
        brandDescription: activeBrand?.brandDescription,
        campaignObjective: activeBrand?.campaignObjective,
        contentPillars: activeBrand?.contentPillars,
        audiencePersonas: activeBrand?.audiencePersonas,
        competitorContext: activeBrand?.competitorContext,
        platformNotes: activeBrand?.platformNotes
      } : null;

      const performanceContext = injectPerformance ? insights.slice(0, 10).map(ins => ({
        title: ins.title,
        desc: ins.desc,
        metric: ins.metric,
        change: ins.change,
        standpoint: ins.standpoint,
        status: ins.status
      })) : null;

      // Request API
      const response = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.text
          })),
          brandContext,
          performanceContext
        })
      });

      if (!response.ok) {
        throw new Error("Assistant workspace encountered an unexpected API response.");
      }

      const data = await response.json();
      
      const parsedResult = extractBriefFromResponse(data.text);

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        text: parsedResult.cleanText,
        timestamp: new Date(),
        briefPayload: parsedResult.brief
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (parsedResult.brief) {
        setWorkbenchBrief(parsedResult.brief);
        setSavedToRegistry(false); // Reset state for newly loaded brief
        setWorkbenchMode("slides"); // Auto-show the beautiful slide carousel deck!
        addNotification(
          "Brief Loaded to Workbench",
          `I generated a matching brief: "${parsedResult.brief.title}". You can review and save it in the right workbench!`,
          "success"
        );
      }

    } catch (err: any) {
      console.error(err);
      addNotification("Assistant Timeout", err.message || "Failed to communicate with AI Partner.", "warning");
      
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        text: "I encountered a minor network interruption. Please ensure your Gemini API Key is configured in the secrets menu, or retry your request.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveBriefToWorkspaceRegistry = async () => {
    if (!workbenchBrief) return;
    try {
      await addCreativeBrief(workbenchBrief);
      setSavedToRegistry(true);
      addNotification(
        "Brief Registry Synced",
        `Creative brief "${workbenchBrief.title}" has been saved permanently to your briefs board as a Draft!`,
        "success"
      );
    } catch (err) {
      console.error("Error saving brief from chatbot workbench:", err);
      addNotification("Save Failed", "Could not synchronize the brief with Firestore database.", "warning");
    }
  };

  // Helper to format text bubbles as nice simple rich paragraphs
  const renderMessageText = (msg: ChatMessage) => {
    const lines = msg.text.split("\n");
    return lines.map((line, index) => {
      // Bullets
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        return (
          <li key={index} className="ml-4 list-disc mt-1 text-xs leading-relaxed">
            {formatBoldText(line.trim().substring(2))}
          </li>
        );
      }
      // Headings
      if (line.trim().startsWith("### ")) {
        return (
          <h4 key={index} className="text-xs font-bold uppercase tracking-wider mt-3 mb-1 text-slate-300">
            {line.trim().substring(4)}
          </h4>
        );
      }
      if (line.trim().startsWith("## ")) {
        return (
          <h3 key={index} className="text-sm font-bold mt-4 mb-2 text-slate-200 border-b border-border/40 pb-1">
            {line.trim().substring(3)}
          </h3>
        );
      }
      if (line.trim() === "") return <div key={index} className="h-2"></div>;

      return (
        <p key={index} className="text-xs leading-relaxed mt-1">
          {formatBoldText(line)}
        </p>
      );
    });
  };

  // Basic markdown-like bold formatter
  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`space-y-6 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}>
      {/* Title & Top Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight flex items-center ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            <MessageSquare className={`w-6 h-6 mr-2 ${getBrandTextColor()}`} />
            AI Creative Partner
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Chat with your custom CMO to brainstorm copy concepts and instantly generate campaign briefs for <strong className={getBrandTextColor()}>{brandName}</strong>.
          </p>
        </div>

        {/* Dynamic Context Settings */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold ${isDark ? "bg-slate-950 border-border" : "bg-slate-100 border-slate-200"}`}>
            <span className="text-slate-400 uppercase">Context Grounding:</span>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={injectBrandGuide} 
                onChange={(e) => setInjectBrandGuide(e.target.checked)}
                className="rounded text-violet-600 focus:ring-0 w-3 h-3 cursor-pointer bg-slate-900 border-border"
              />
              <span className={injectBrandGuide ? "text-slate-200" : "text-slate-500"}>Style Guides</span>
            </label>
            <span className="text-slate-700">|</span>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={injectPerformance} 
                onChange={(e) => setInjectPerformance(e.target.checked)}
                className="rounded text-violet-600 focus:ring-0 w-3 h-3 cursor-pointer bg-slate-900 border-border"
              />
              <span className={injectPerformance ? "text-slate-200" : "text-slate-500"}>Intelligence</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Container Dual-Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-13rem)] min-h-[500px]">
        {/* Left: Chat Canvas (7 or 8 columns depending on workbench status) */}
        <div className={`lg:col-span-7 xl:col-span-8 flex flex-col h-full border rounded-xl overflow-hidden ${
          isDark ? "bg-sidebar border-border" : "bg-white border-slate-200 shadow-md"
        }`}>
          {/* Active Status Header */}
          <div className={`p-4 border-b flex items-center justify-between ${isDark ? "bg-card border-border" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center space-x-2.5">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                activeColor === "emerald" ? "bg-emerald-500" : activeColor === "rose" ? "bg-rose-500" : activeColor === "amber" ? "bg-amber-500" : "bg-violet-500"
              }`}></div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                CMO CHAT SESSION
              </span>
            </div>
            
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clear the chat history?")) {
                  setMessages([
                    {
                      id: "welcome-reset",
                      role: "assistant",
                      text: `History cleared. I am grounded and ready to collaborate on **${brandName}** coordinates again. What is our focus?`,
                      timestamp: new Date()
                    }
                  ]);
                  setWorkbenchBrief(null);
                }
              }}
              title="Clear session history"
              className={`p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 transition-colors cursor-pointer`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages Flow Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-full scrollbar-thin">
            {messages.map((msg) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col max-w-[85%] ${
                    isAssistant ? "self-start items-start" : "self-end items-end ml-auto"
                  }`}
                >
                  {/* Sender label */}
                  <span className="text-[9px] font-mono text-slate-500 mb-1 px-1">
                    {isAssistant ? "N.O.K AI Partner" : "You"} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Message Bubble */}
                  <div className={`rounded-xl p-4 text-xs transition-all relative group ${
                    isAssistant
                      ? isDark 
                        ? "bg-card text-text border border-border" 
                        : "bg-slate-100 text-slate-800 border border-slate-200"
                      : isDark
                        ? "bg-card-inner text-text border border-border"
                        : "bg-slate-950 text-slate-100 border border-slate-900"
                  }`}>
                    {/* Render message body */}
                    <div className="space-y-1">
                      {renderMessageText(msg)}
                    </div>

                    {/* Detected Brief Indicator attachment in chat bubble */}
                    {isAssistant && msg.briefPayload && (
                      <div className="mt-4 p-3 border border-dashed border-violet-500/30 rounded-lg bg-violet-600/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-slate-200">Creative Brief Generated</h5>
                            <p className="text-[10px] text-slate-400">{msg.briefPayload.title}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (msg.briefPayload) {
                              setWorkbenchBrief(msg.briefPayload);
                              setSavedToRegistry(false);
                            }
                          }}
                          className="px-2.5 py-1 text-[10px] font-mono font-bold bg-violet-600 hover:bg-violet-500 text-white rounded cursor-pointer transition-all uppercase flex items-center space-x-1"
                        >
                          <span>Open in Workbench</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Quick helper hover buttons */}
                    <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1.5">
                      <button
                        onClick={() => handleCopyText(msg.text, msg.id)}
                        className="p-1 rounded bg-slate-950/80 border border-border text-slate-400 hover:text-slate-100 cursor-pointer"
                        title="Copy message to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Model Typing Indicator */}
            {loading && (
              <div className="flex flex-col max-w-[85%] self-start items-start">
                <span className="text-[9px] font-mono text-slate-500 mb-1 px-1">
                  N.O.K AI Partner is synthesising...
                </span>
                <div className={`rounded-xl px-4 py-3 bg-card border border-border flex items-center space-x-2`}>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span className="text-xs text-slate-400 font-mono">Deducing context metrics...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Suggestions Tray (Only if input is empty) */}
          {input.trim() === "" && (
            <div className={`p-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-2.5 ${isDark ? "bg-card/30" : "bg-slate-50/50"}`}>
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.text)}
                  className={`p-2.5 rounded-lg border text-left text-[11px] transition-all flex items-center space-x-2.5 cursor-pointer hover:scale-[0.99] ${
                    isDark 
                      ? "bg-slate-950/60 border-border/80 hover:border-slate-700 text-slate-300 hover:text-white hover:bg-slate-900/60" 
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm"
                  }`}
                >
                  <span className={getBrandTextColor()}>{p.icon}</span>
                  <div className="truncate flex-1">
                    <span className="font-semibold block text-[10px]">{p.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Chat Form Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className={`p-4 border-t ${isDark ? "border-border bg-slate-950/50" : "border-slate-200 bg-white"}`}
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask AI Partner to draft a brief, generate hook ideas, or write copy...`}
                className={`w-full text-xs py-3.5 pl-4 pr-14 rounded-xl border focus:outline-none focus:ring-1 focus:ring-offset-0 ${
                  isDark
                    ? "bg-slate-950 border-border text-slate-100"
                    : "bg-slate-50 border-slate-200 text-slate-900"
                } ${getBrandFocusRing()}`}
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={`absolute right-2 px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center transition-all cursor-pointer ${
                  !input.trim() || loading
                    ? "bg-slate-800 border-slate-750 text-slate-500 cursor-not-allowed"
                    : getBrandBgClass()
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Right: Creative Workbench (4 columns persistent / slides out) */}
        <div className="lg:col-span-5 xl:col-span-4 h-full flex flex-col">
          {workbenchBrief ? (
            <div className={`border rounded-xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 ${
              isDark ? "bg-sidebar border-border" : "bg-white border-slate-200 shadow-md"
            }`}>
              {/* Workbench Header */}
              <div className={`p-4 border-b flex items-center justify-between ${isDark ? "bg-card border-border" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center space-x-2">
                  <Bookmark className={`w-4 h-4 ${getBrandTextColor()}`} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Creative Workbench
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setWorkbenchBrief(null)}
                    className="text-[10px] font-mono text-slate-500 hover:text-slate-300 px-1 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Workbench View Mode Tabs */}
              <div className="flex border-b border-border bg-[#141416]/40">
                <button
                  onClick={() => setWorkbenchMode("slides")}
                  className={`flex-1 py-3 text-center text-[10px] font-mono font-bold tracking-wider uppercase transition-all ${
                    workbenchMode === "slides" 
                      ? "text-violet-400 bg-slate-950/60 border-b-2 border-violet-500" 
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-950/20"
                  }`}
                >
                  Visual Deck
                </button>
                <button
                  onClick={() => setWorkbenchMode("text")}
                  className={`flex-1 py-3 text-center text-[10px] font-mono font-bold tracking-wider uppercase transition-all ${
                    workbenchMode === "text" 
                      ? "text-violet-400 bg-slate-950/60 border-b-2 border-violet-500" 
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-950/20"
                  }`}
                >
                  Structured Brief
                </button>
              </div>

              {/* Workbench Contents */}
              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                {workbenchMode === "slides" ? (
                  <SlideDeckPreview 
                    brief={workbenchBrief}
                    brandName={brandName}
                    brandColor={activeColor}
                  />
                ) : (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="flex justify-between items-start border-b border-dashed border-border/40 pb-3">
                      <div>
                        <span className="text-[9px] font-mono uppercase bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/15">
                          {workbenchBrief.campaignId || "NOK-BRIEF"}
                        </span>
                        <h3 className="text-sm font-bold text-slate-200 mt-1.5 leading-snug">
                          {workbenchBrief.title}
                        </h3>
                      </div>
                    </div>

                    {/* Grid attributes */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="bg-slate-950/40 p-2.5 rounded border border-slate-900">
                        <span className="block text-[8px] font-mono uppercase text-slate-500">Date Logged</span>
                        <span className="text-xs text-slate-300 font-mono">{workbenchBrief.date || "7/1/2026"}</span>
                      </div>
                      <div className="bg-slate-950/40 p-2.5 rounded border border-slate-900">
                        <span className="block text-[8px] font-mono uppercase text-slate-500">Sequence</span>
                        <span className="text-xs text-slate-300 font-mono">{workbenchBrief.sequencePosition || "1 of 1"}</span>
                      </div>
                    </div>

                    {/* Brief Fields */}
                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Campaign Objective</span>
                        <p className="text-slate-300 bg-slate-950/20 p-2.5 rounded border border-border/30 leading-relaxed font-sans">{workbenchBrief.objective}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Target Persona Pain Point</span>
                        <p className="text-slate-300 bg-slate-950/20 p-2.5 rounded border border-border/30 leading-relaxed font-sans">{workbenchBrief.targetAudience}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Core Copywriting Key Message</span>
                        <p className="text-slate-300 bg-slate-950/20 p-2.5 rounded border border-border/30 leading-relaxed font-sans font-medium">{workbenchBrief.keyMessage}</p>
                      </div>

                      {workbenchBrief.formatSpec && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Technical spec & Platform</span>
                          <p className="text-slate-300 bg-slate-950/20 p-2.5 rounded border border-border/30 font-mono text-[11px]">{workbenchBrief.formatSpec}</p>
                        </div>
                      )}

                      {workbenchBrief.proofPoint && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Proof Point / Data Source</span>
                          <p className="text-slate-300 bg-slate-950/20 p-2.5 rounded border border-border/30 leading-relaxed font-sans text-slate-400">{workbenchBrief.proofPoint}</p>
                        </div>
                      )}

                      {workbenchBrief.contentOutline && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Content Outline / Story beats</span>
                          <pre className="text-slate-300 bg-slate-950/40 p-3 rounded border border-border/50 leading-relaxed font-sans text-[11px] whitespace-pre-wrap">{workbenchBrief.contentOutline}</pre>
                        </div>
                      )}

                      {workbenchBrief.cta && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Call To Action (CTA)</span>
                          <p className="text-slate-200 bg-violet-600/5 p-2.5 rounded border border-violet-500/10 font-sans">{workbenchBrief.cta}</p>
                        </div>
                      )}

                      {workbenchBrief.successMetric && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Success Metric Target</span>
                          <p className="text-emerald-400 bg-emerald-500/5 p-2 rounded border border-emerald-500/10 font-mono text-[11px]">{workbenchBrief.successMetric}</p>
                        </div>
                      )}

                      {workbenchBrief.deliverables && (
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Deliverables Scope</span>
                          <p className="text-slate-300 bg-slate-950/20 p-2.5 rounded border border-border/30 font-sans">{workbenchBrief.deliverables}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Workbench Actions Row */}
              <div className={`p-4 border-t flex flex-col gap-2 ${isDark ? "bg-card border-border" : "bg-slate-50 border-slate-200"}`}>
                {savedToRegistry ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg p-2.5 text-center flex items-center justify-center space-x-1.5 text-xs font-mono font-bold uppercase animate-in zoom-in-95">
                    <Check className="w-4 h-4" />
                    <span>Saved to briefs Registry!</span>
                  </div>
                ) : (
                  <button
                    onClick={saveBriefToWorkspaceRegistry}
                    className={`w-full py-3.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer ${getBrandBgClass()}`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>SAVE BRIEF TO REGISTRY</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const txt = JSON.stringify(workbenchBrief, null, 2);
                    handleCopyText(txt, "workbench-copy");
                    addNotification("Copied JSON Data", "Workbench creative brief data structure copied to clipboard.", "info");
                  }}
                  className={`w-full py-2.5 rounded-lg text-xs font-mono font-semibold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    isDark 
                      ? "bg-slate-900 border-border text-slate-300 hover:border-slate-700 hover:text-white" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY BRIEF JSON DATA</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={`border rounded-xl flex flex-col justify-center items-center p-8 h-full text-center ${
              isDark ? "bg-sidebar/30 border-border/80 border-dashed" : "bg-slate-50/50 border-slate-200 border-dashed"
            }`}>
              <FileText className="w-10 h-10 text-slate-600 mb-3" />
              <h4 className="text-sm font-semibold text-slate-400">Creative Workbench Empty</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px] leading-relaxed">
                When you ask the AI Partner to generate a brief, the workspace will automatically parse and display it here!
              </p>
              <div className="mt-4 p-3 bg-violet-600/5 rounded-lg border border-violet-500/10 text-left max-w-xs">
                <div className="flex items-start space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-slate-400 leading-normal">
                    Try asking: <em className="text-violet-300">"Draft a LinkedIn brief speaking to the main concerns of busy CMOs."</em>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
