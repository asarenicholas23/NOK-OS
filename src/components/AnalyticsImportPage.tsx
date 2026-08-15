import React, { useState, useRef } from "react";
import { useBrand } from "../context/BrandContext";
import { apiFetch } from "../lib/apiBase";
import { cleanAndNormalizeData } from "../utils/dataCleaner";
import { 
  UploadCloud, 
  CheckCircle2, 
  FileSpreadsheet, 
  AlertCircle, 
  Database, 
  FileCode, 
  Check, 
  Loader2, 
  Sparkles,
  FileText,
  Table
} from "lucide-react";

export const AnalyticsImportPage: React.FC = () => {
  const { 
    activeBrand, 
    theme, 
    accentColor, 
    saveRawAnalyticsRows, 
    clearRawAnalytics,
    rawAnalytics,
    addInsight, 
    addNotification 
  } = useBrand();

  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "parsing" | "saving" | "complete">("idle");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [targetDatasetType, setTargetDatasetType] = useState<"baseline" | "comparison">("baseline");
  const [clearing, setClearing] = useState<boolean>(false);
  const [rawFileContent, setRawFileContent] = useState<string>("");
  const [activePreviewTab, setActivePreviewTab] = useState<"raw" | "cleaned">("raw");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  const getAccentClass = () => {
    if (activeColor === "emerald") return "text-emerald-500 border-emerald-500 focus:border-emerald-500";
    if (activeColor === "rose") return "text-rose-500 border-rose-500 focus:border-rose-500";
    if (activeColor === "amber") return "text-amber-500 border-amber-500 focus:border-amber-500";
    return "text-violet-500 border-violet-500 focus:border-violet-500";
  };

  const getAccentPillClass = (status: string) => {
    if (status === "complete") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (activeColor === "emerald") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (activeColor === "rose") return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    if (activeColor === "amber") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
  };

  const getBorderDragClass = () => {
    if (isDragOver) {
      if (activeColor === "emerald") return "border-emerald-500 bg-emerald-500/5";
      if (activeColor === "rose") return "border-rose-500 bg-rose-500/5";
      if (activeColor === "amber") return "border-amber-500 bg-amber-500/5";
      return "border-violet-500 bg-violet-550/5";
    }
    return isDark ? "border-border hover:border-slate-700 hover:bg-slate-950/20" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50";
  };

  const handleGenerateInsights = async () => {
    if (!activeBrand) return;
    setGeneratingInsights(true);
    try {
      const response = await apiFetch("/api/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: activeBrand.tagline,
          voiceTone: activeBrand.voiceTone,
          brandGuide: {
            contentPillars: activeBrand.contentPillars || "",
            audiencePersonas: activeBrand.audiencePersonas || "",
            competitorContext: activeBrand.competitorContext || "",
            platformNotes: activeBrand.platformNotes || ""
          },
          analyticsData: parsedRows.slice(0, 150)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate strategic insights");
      }

      const list = await response.json();
      
      for (const item of list) {
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
        "Insights Discovered",
        `Discovered ${list.length} new strategic growth recommendations in Pending status. Check the Strategic Insights dashboard!`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      addNotification("Generation Interrupted", err.message || "Network communication barrier encountered.", "warning");
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Real CSV and JSON File parser
  const parseFileContent = (content: string, filename: string) => {
    try {
      // Replicate Python cleaning logic via cleanAndNormalizeData
      const normalized = cleanAndNormalizeData(content, filename, activeBrand?.id || "acme-corp");

      if (normalized.length === 0) {
        throw new Error("No readable performance records detected in payload.");
      }

      setParsedRows(normalized);
      setUploadState("saving");

      // Save to Firebase Context
      setTimeout(async () => {
        try {
          await saveRawAnalyticsRows(normalized, targetDatasetType);
          setUploadState("complete");
          setActivePreviewTab("cleaned"); // Auto-focus the cleaned metrics view!
          addNotification(
            "Spreadsheet Digested",
            `Successfully processed and synced ${normalized.length} raw performance rows to active client store.`,
            "success"
          );
        } catch (err: any) {
          console.error(err);
          setUploadState("idle");
          addNotification("Ingestion Blocked", "Failed to compile database write transaction.", "warning");
        }
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setUploadState("idle");
      addNotification("Parsing Failure", err.message || "Spreadsheet format validation mismatch.", "warning");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      readAndProcessFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      readAndProcessFile(selectedFile);
    }
  };

  const readAndProcessFile = (selectedFile: File) => {
    setFile({ name: selectedFile.name, size: selectedFile.size, type: selectedFile.type });
    setUploadState("parsing");

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawFileContent(content);
      setActivePreviewTab("raw"); // focus on the raw CSV view first as requested
      parseFileContent(content, selectedFile.name);
    };
    reader.onerror = () => {
      setUploadState("idle");
      addNotification("Upload Interrupted", "Disk read error, file load terminated.", "warning");
    };
    reader.readAsText(selectedFile);
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const baselineCount = rawAnalytics.filter(r => r.datasetType === "baseline" || !r.datasetType).length;
  const comparisonCount = rawAnalytics.filter(r => r.datasetType === "comparison").length;

  const handleClearData = async (type: "baseline" | "comparison" | "all") => {
    setClearing(true);
    try {
      await clearRawAnalytics(type);
      if (type === "all") {
        setRawFileContent("");
        setFile(null);
        setUploadState("idle");
        setParsedRows([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClearing(false);
    }
  };

  const getActiveTabStyle = (tab: "baseline" | "comparison") => {
    if (targetDatasetType === tab) {
      if (activeColor === "emerald") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      if (activeColor === "rose") return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      if (activeColor === "amber") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      return "bg-violet-500/10 text-violet-500 border-violet-500/20";
    }
    return isDark ? "bg-slate-950 text-slate-400 border-slate-900 hover:text-slate-200" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100";
  };

  return (
    <div 
      id="analytics-import-view" 
      className={`space-y-8 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}
    >
      {/* Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Analytics Import Console
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Import standard client performance spreadsheets or JSON files into the brand database.
          </p>
        </div>
      </div>

      {/* Active Database Overview */}
      <div className={`border p-5 rounded-xl ${isDark ? "bg-card/90 border-border" : "bg-white border-slate-200 shadow-sm"} space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center">
            <Database className="w-4 h-4 mr-1.5 text-slate-400" />
            Active Database Overview
          </h3>
          {(baselineCount > 0 || comparisonCount > 0) && (
            <button
              onClick={() => handleClearData("all")}
              disabled={clearing}
              className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded border font-mono transition-all ${
                isDark 
                  ? "bg-rose-950/20 border-rose-500/30 text-rose-400 hover:bg-rose-950/40" 
                  : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
              }`}
            >
              {clearing ? "Clearing..." : "Clear All Custom Data"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baseline Dataset Card */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${
            isDark ? "bg-slate-950 border-slate-900" : "bg-slate-50 border-slate-150"
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Baseline Dataset</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  baselineCount > 0 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "bg-slate-500/10 text-slate-400"
                }`}>
                  {baselineCount > 0 ? "CUSTOM ACTIVE" : "SIMULATED FALLBACK"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Standard baseline engagement, reach, and performance logs.
              </p>
              <div className="text-lg font-bold font-mono mt-3">
                {baselineCount > 0 ? `${baselineCount} raw rows` : "30 simulated rows"}
              </div>
            </div>
            {baselineCount > 0 && (
              <button
                onClick={() => handleClearData("baseline")}
                disabled={clearing}
                className="mt-3 text-left text-[10px] font-semibold text-rose-500 hover:underline"
              >
                Clear Baseline Dataset
              </button>
            )}
          </div>

          {/* Comparison Dataset Card */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${
            isDark ? "bg-slate-950 border-slate-900" : "bg-slate-50 border-slate-150"
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Comparison Dataset</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  comparisonCount > 0 
                    ? "bg-amber-500/10 text-amber-500" 
                    : "bg-slate-500/10 text-slate-400"
                }`}>
                  {comparisonCount > 0 ? "CUSTOM ACTIVE" : "SIMULATED FALLBACK"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Post-campaign feedback analytics used for comparisons.
              </p>
              <div className="text-lg font-bold font-mono mt-3">
                {comparisonCount > 0 ? `${comparisonCount} raw rows` : "24 simulated rows"}
              </div>
            </div>
            {comparisonCount > 0 && (
              <button
                onClick={() => handleClearData("comparison")}
                disabled={clearing}
                className="mt-3 text-left text-[10px] font-semibold text-rose-500 hover:underline"
              >
                Clear Comparison Dataset
              </button>
            )}
          </div>
        </div>

        {baselineCount === 0 && comparisonCount === 0 && (
          <div className={`p-3 rounded-lg border text-[11px] leading-relaxed ${
            isDark ? "bg-amber-500/5 border-amber-500/10 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700"
          }`}>
            ⚠️ <strong>Simulation Sandbox is Active</strong>: No custom data uploaded yet. You are currently viewing high-fidelity default brand campaigns. Uploading your own spreadsheet will automatically disable simulated records and load your files!
          </div>
        )}
      </div>

      {/* Target Dataset Selection */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
          Target Dataset Destination for Ingestion
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setTargetDatasetType("baseline")}
            className={`flex-1 p-3 border rounded-xl text-left transition-all ${getActiveTabStyle("baseline")}`}
          >
            <div className="font-semibold text-xs">Baseline Performance Ingest</div>
            <div className="text-[10px] opacity-70 mt-0.5">Upload initial/general campaign stats.</div>
          </button>
          <button
            onClick={() => setTargetDatasetType("comparison")}
            className={`flex-1 p-3 border rounded-xl text-left transition-all ${getActiveTabStyle("comparison")}`}
          >
            <div className="font-semibold text-xs">Feedback / Comparison Ingest</div>
            <div className="text-[10px] opacity-70 mt-0.5">Upload comparison data (e.g., specific post-campaign stats).</div>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div
            id="analytics-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all flex flex-col items-center justify-center min-h-[280px] ${getBorderDragClass()}`}
          >
            <input 
              id="analytics-file-input"
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".csv,.xlsx,.json" 
            />
            
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center mb-4 ${
              isDark ? "bg-slate-950 border-border" : "bg-slate-50 border-slate-200"
            }`}>
              <UploadCloud className={`w-6 h-6 ${
                activeColor === "emerald" ? "text-emerald-500" : activeColor === "rose" ? "text-rose-500" : activeColor === "amber" ? "text-amber-500" : "text-violet-500"
              }`} />
            </div>
            
            <div>
              <h4 className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Drag & drop files here to parse</h4>
              <p className={`text-xs max-w-sm mt-1.5 leading-relaxed ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                Uploading as <strong className="uppercase">{targetDatasetType}</strong>. Supports CSV, Excel spreadsheets, or standard JSON data payloads.
              </p>
            </div>

            <button
              id="analytics-upload-trigger"
              onClick={triggerSelect}
              className={`mt-6 px-4 py-2 border text-xs font-semibold font-mono rounded-md shadow-md transition-colors cursor-pointer ${
                isDark 
                  ? "bg-slate-950 border-border text-slate-300 hover:border-slate-700" 
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Manually Select File
            </button>
          </div>

          {/* Secure pipeline description */}
          <div className={`border rounded-xl p-5 space-y-3 ${isDark ? "bg-slate-900/40 border-border" : "bg-white border-slate-200 shadow-sm"}`}>
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center">
              <Database className={`w-3.5 h-3.5 mr-1.5 ${
                activeColor === "emerald" ? "text-emerald-500" : activeColor === "rose" ? "text-rose-500" : activeColor === "amber" ? "text-amber-500" : "text-violet-500"
              }`} />
              Secure Ingestion Protocol
            </h4>
            <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Files are sanitized and run through an inline verification compiler client-side before write transactions are executed to prevent collection injections or structure contamination.
            </p>
          </div>
        </div>

        {/* Parsing state and Results */}
        <div 
          id="analytics-results-card" 
          className={`border rounded-xl p-6 shadow-lg flex flex-col justify-between min-h-[400px] lg:col-span-5 ${
            isDark ? "bg-card border-border/80" : "bg-white border-slate-200"
          }`}
        >
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-4">Import State Pipeline</h3>
            
            {uploadState === "idle" && (
              <div className="text-center py-16 text-slate-500 text-xs font-mono">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div>Awaiting upload payload.</div>
              </div>
            )}

            {uploadState !== "idle" && file && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className={`border p-4 rounded-lg flex items-center justify-between font-mono text-[10px] ${
                  isDark ? "bg-slate-950 border-border" : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center space-x-3">
                    <FileCode className={`w-6 h-6 ${
                      activeColor === "emerald" ? "text-emerald-500" : activeColor === "rose" ? "text-rose-500" : activeColor === "amber" ? "text-amber-500" : "text-violet-500"
                    }`} />
                    <div>
                      <div className={`font-bold max-w-[180px] truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{file.name}</div>
                      <div className="text-slate-400 mt-0.5 font-mono">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] ${getAccentPillClass(uploadState)}`}>
                    {uploadState}
                  </span>
                </div>

                {uploadState !== "parsing" && parsedRows.length > 0 && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Extracted Performance Rows
                    </div>
                    
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {parsedRows.slice(0, 4).map((row, idx) => (
                        <div 
                          key={idx} 
                          className={`border p-3 rounded-md flex justify-between items-center text-xs ${
                            isDark ? "bg-slate-950 border-border" : "bg-slate-50/50 border-slate-200"
                          }`}
                        >
                          <div className="min-w-0 flex-1 mr-2">
                            <div className={`font-semibold truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{row.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{row.platform} • {row.type} • {row.dayOfWeek}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`font-bold font-mono ${isDark ? "text-slate-200" : "text-slate-800"}`}>{row.impressions.toLocaleString()} views</div>
                            <div className="text-[10px] text-emerald-500 font-mono mt-0.5">{row.engagementRate.toFixed(1)}% CTR</div>
                          </div>
                        </div>
                      ))}
                      {parsedRows.length > 4 && (
                        <div className="text-center text-[10px] font-mono text-slate-500 py-1">
                          + {parsedRows.length - 4} more records loaded
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {uploadState === "complete" && (
            <div className="mt-6 space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg flex items-start space-x-3">
                <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-emerald-500">Database synchronization complete</h5>
                  <p className={`text-[10px] mt-1 leading-normal ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    Cleaned metrics successfully updated the brand's performance metrics & historical analytics collections.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="generate-insights-import-btn"
                  onClick={handleGenerateInsights}
                  disabled={generatingInsights}
                  className={`w-full py-3 px-4 rounded-lg font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer ${
                    generatingInsights
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : activeColor === "emerald"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : activeColor === "rose"
                          ? "bg-rose-600 hover:bg-rose-500 text-white"
                          : activeColor === "amber"
                            ? "bg-amber-600 hover:bg-amber-500 text-slate-900"
                            : "bg-violet-600 hover:bg-violet-500 text-white"
                  }`}
                >
                  {generatingInsights ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini Dissecting Analytics...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>Generate Strategic Insights from Loaded Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Data Preview Section */}
      {file && rawFileContent && (
        <div className={`border rounded-xl p-6 ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"} space-y-4 animate-in fade-in duration-300`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4 border-slate-200 dark:border-border">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                <span>Payload Verification & Analytics Inspect</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Inspect raw incoming data structures versus standardized client-side calculated metrics.
              </p>
            </div>
            
            {/* Tab Toggles */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-border text-xs font-mono">
              <button
                onClick={() => setActivePreviewTab("raw")}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
                  activePreviewTab === "raw"
                    ? "bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 shadow"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. Raw CSV Content</span>
              </button>
              <button
                onClick={() => setActivePreviewTab("cleaned")}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
                  activePreviewTab === "cleaned"
                    ? "bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 shadow"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>2. Cleaned Metrics Preview</span>
              </button>
            </div>
          </div>

          {activePreviewTab === "raw" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Displaying first few lines of raw file text payload:</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-semibold">
                  Source Raw Encoding
                </span>
              </div>
              <div className={`p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-[300px] border ${
                isDark ? "bg-slate-950 border-border text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                {rawFileContent ? (
                  rawFileContent
                    .split(/\r?\n/)
                    .slice(0, 8)
                    .map((line, idx) => (
                      <div key={idx} className="flex gap-4 py-0.5 hover:bg-slate-900/40 px-1 rounded">
                        <span className="text-slate-500 select-none text-right w-6 inline-block">{idx + 1}</span>
                        <span className="whitespace-pre">{line || " "}</span>
                      </div>
                    ))
                ) : (
                  <span className="text-slate-500">No raw contents available.</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                * Real-time file streaming preserves your double quote boundaries, escaped commas, and Unix/Windows carriage line breaks before parsing begins.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Standardized, casted, and data-aligned target outputs ({parsedRows.length} total rows cleaned):</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold">
                  Python-Equivalent Compliant
                </span>
              </div>

              {parsedRows.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  No cleaned rows available. Clean validation pending.
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto border-slate-200 dark:border-border">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className={`${isDark ? "bg-slate-950 text-slate-400 border-b border-border" : "bg-slate-50 text-slate-600 border-b border-slate-200"} text-[10px] uppercase font-bold`}>
                        <th className="py-2.5 px-3">Post Title / Description</th>
                        <th className="py-2.5 px-3">Platform</th>
                        <th className="py-2.5 px-3">Format</th>
                        <th className="py-2.5 px-3 text-right">Impressions</th>
                        <th className="py-2.5 px-3 text-right">Engagement</th>
                        <th className="py-2.5 px-3 text-right">Eng. Rate</th>
                        <th className="py-2.5 px-3 text-right">Day</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                      {parsedRows.slice(0, 6).map((row, idx) => (
                        <tr 
                          key={idx} 
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors ${
                            isDark ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          <td className="py-2.5 px-3 font-semibold max-w-[200px] truncate" title={row.title}>
                            {row.title}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-[10px] font-bold">
                              {row.platform}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{row.type}</td>
                          <td className="py-2.5 px-3 text-right font-bold">{(row.impressions || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right">{(row.engagement || 0).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-500 font-bold">{(row.engagementRate || 0).toFixed(2)}%</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">{row.dayOfWeek || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 6 && (
                    <div className={`p-2.5 text-center text-[10px] font-mono border-t border-slate-200 dark:border-border text-slate-400 ${
                      isDark ? "bg-slate-950" : "bg-slate-50"
                    }`}>
                      + {parsedRows.length - 6} additional rows successfully converted to standard relational schema
                    </div>
                  )}
                </div>
              )}

              {/* Cleansing rules callout */}
              <div className={`p-4 rounded-lg text-xs leading-relaxed ${
                isDark ? "bg-emerald-500/5 border border-emerald-500/10 text-emerald-400" : "bg-emerald-50 border border-emerald-100 text-emerald-800"
              }`}>
                <strong>⚡ Algorithmic Cleansing Rules Applied</strong>:
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-[11px]">
                  <li>Headers normalized (e.g. stripped, lowercase, spaces replaced with underscores).</li>
                  <li>Metrics validated (computed as: <code>likes + comments + shares + saves</code>).</li>
                  <li>Defective metrics aligned: verified <code>impressions &ge; engagement</code> (automatic lower-bound safety clip).</li>
                  <li>Engagement rate computed safely: <code>(total_engagement / impressions) * 100</code> percentage representation.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
