import React, { useState } from "react";
import { useBrand } from "../context/BrandContext";
import { Plus, FileText, ClipboardList, AlertCircle, Sparkles, UserCheck, Milestone } from "lucide-react";

export const BriefsPage: React.FC = () => {
  const { 
    activeBrand, 
    briefs, 
    addCreativeBrief, 
    updateCreativeBrief, 
    deleteCreativeBrief, 
    theme, 
    accentColor 
  } = useBrand();
  const [showForm, setShowForm] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyMessage, setKeyMessage] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [status, setStatus] = useState<"Draft" | "Approved" | "In Progress">("Draft");

  // Inline editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editObjective, setEditObjective] = useState("");
  const [editTargetAudience, setEditTargetAudience] = useState("");
  const [editKeyMessage, setEditKeyMessage] = useState("");
  const [editDeliverables, setEditDeliverables] = useState("");

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  const getBrandTextColor = () => {
    if (activeColor === "emerald") return "text-emerald-500 dark:text-emerald-400";
    if (activeColor === "rose") return "text-rose-500 dark:text-rose-400";
    if (activeColor === "amber") return "text-amber-500 dark:text-amber-400";
    return "text-violet-500 dark:text-violet-400";
  };

  const getBrandBgButton = () => {
    if (activeColor === "emerald") return "bg-emerald-600 hover:bg-emerald-500 text-white";
    if (activeColor === "rose") return "bg-rose-600 hover:bg-rose-500 text-white";
    if (activeColor === "amber") return "bg-amber-600 hover:bg-amber-500 text-white";
    return "bg-violet-600 hover:bg-violet-500 text-white";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !objective || !targetAudience || !keyMessage) return;
    try {
      await addCreativeBrief({
        title,
        objective,
        targetAudience,
        keyMessage,
        deliverables: deliverables || "N/A",
        status
      });
      setTitle("");
      setObjective("");
      setTargetAudience("");
      setKeyMessage("");
      setDeliverables("");
      setShowForm(false);
    } catch (err) {
      console.error("Error creating creative brief:", err);
    }
  };

  const getStatusBadge = (st: typeof status) => {
    switch (st) {
      case "Approved":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "In Progress":
        if (activeColor === "emerald") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        if (activeColor === "rose") return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
        if (activeColor === "amber") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
      case "Draft":
        return "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700";
    }
  };

  return (
    <div 
      id="briefs-view" 
      className={`space-y-8 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Creative Briefs Desk
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Author and manage active creative campaign requirements for <strong className={getBrandTextColor()}>{activeBrand ? activeBrand.name : "active brand"}</strong>.
          </p>
        </div>
        <button
          id="btn-trigger-add-brief"
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-md shadow-md transition-colors font-mono cursor-pointer self-start md:self-auto ${
            showForm ? "bg-rose-600 hover:bg-rose-500 text-white" : getBrandBgButton()
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showForm ? "Cancel Brief" : "Create Brief"}</span>
        </button>
      </div>

      {/* Brief creation form */}
      {showForm && (
        <div 
          id="brief-form-card" 
          className={`border rounded-xl p-6 shadow-xl animate-in slide-in-from-top-3 duration-200 ${
            isDark ? "bg-[#161616] border-slate-800/80" : "bg-white border-slate-200"
          }`}
        >
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center">
            <Sparkles className={`w-3.5 h-3.5 mr-2 ${getBrandTextColor()}`} />
            Initialize Creative Brief Spec
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Brief Title *</label>
                <input
                  id="brief-input-title"
                  type="text"
                  required
                  placeholder="e.g., Q3 Cloud Migration Campaign Pack"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Status Level</label>
                <select
                  id="brief-input-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="Draft">Draft Mode</option>
                  <option value="In Progress">In Progress Pipeline</option>
                  <option value="Approved">Approved for Release</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Core Campaign Objective *</label>
                <textarea
                  id="brief-input-objective"
                  required
                  rows={2}
                  placeholder="Define primary marketing, telemetry, or user acquisition goals..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Target Audience Segment *</label>
                <textarea
                  id="brief-input-audience"
                  required
                  rows={2}
                  placeholder="Describe demographic, technical background, or segment archetype..."
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Key Marketing Message *</label>
                <textarea
                  id="brief-input-message"
                  required
                  rows={2}
                  placeholder="Primary core copy line or positioning statement..."
                  value={keyMessage}
                  onChange={(e) => setKeyMessage(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Deliverables Scope</label>
                <textarea
                  id="brief-input-deliverables"
                  rows={2}
                  placeholder="e.g., 3x LinkedIn graphics, 1x telemetry analytics report..."
                  value={deliverables}
                  onChange={(e) => setDeliverables(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="brief-submit-action"
                type="submit"
                className={`px-4 py-2 text-xs font-semibold rounded-md shadow-md font-mono cursor-pointer ${getBrandBgButton()}`}
              >
                Execute Brief Registry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of existing briefs */}
      <div id="briefs-list-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {briefs.map((brief) => {
          const isEditing = editingId === brief.id;

          const startEditing = () => {
            setEditingId(brief.id);
            setEditTitle(brief.title);
            setEditObjective(brief.objective);
            setEditTargetAudience(brief.targetAudience);
            setEditKeyMessage(brief.keyMessage);
            setEditDeliverables(brief.deliverables);
          };

          const cancelEditing = () => {
            setEditingId(null);
          };

          const saveEditing = async () => {
            if (!editTitle || !editObjective || !editTargetAudience || !editKeyMessage) return;
            try {
              await updateCreativeBrief(brief.id, {
                title: editTitle,
                objective: editObjective,
                targetAudience: editTargetAudience,
                keyMessage: editKeyMessage,
                deliverables: editDeliverables
              });
              setEditingId(null);
            } catch (err) {
              console.error("Failed to save brief edit:", err);
            }
          };

          const handleApprove = async () => {
            try {
              await updateCreativeBrief(brief.id, { status: "Approved" });
            } catch (err) {
              console.error("Failed to approve brief:", err);
            }
          };

          const handleDelete = async () => {
            if (window.confirm("Are you sure you want to delete this brief?")) {
              try {
                await deleteCreativeBrief(brief.id);
              } catch (err) {
                console.error("Failed to delete brief:", err);
              }
            }
          };

          return (
            <div
              key={brief.id}
              className={`border rounded-xl p-6 flex flex-col justify-between transition-all duration-200 shadow-md ${
                isDark ? "bg-[#161616] border-slate-800/80 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              {isEditing ? (
                <div className="space-y-4 w-full">
                  <div className="text-xs font-mono text-slate-400 border-b pb-1.5 uppercase font-bold tracking-wider">
                    Edit Creative Brief
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Brief Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Objective</label>
                      <textarea
                        rows={2}
                        value={editObjective}
                        onChange={(e) => setEditObjective(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Target Audience</label>
                      <textarea
                        rows={2}
                        value={editTargetAudience}
                        onChange={(e) => setEditTargetAudience(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Key Message</label>
                      <textarea
                        rows={2}
                        value={editKeyMessage}
                        onChange={(e) => setEditKeyMessage(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Scope / Deliverables</label>
                      <input
                        type="text"
                        value={editDeliverables}
                        onChange={(e) => setEditDeliverables(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 rounded text-[11px] font-mono bg-slate-700 hover:bg-slate-600 text-white font-semibold cursor-pointer uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEditing}
                      className="px-3 py-1.5 rounded text-[11px] font-mono bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer uppercase"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full justify-between">
                  <div>
                    {/* Header Row: Left badges, Right flat solid high-contrast buttons */}
                    <div className="flex justify-between items-center mb-4.5 gap-2">
                      <div className="flex items-center space-x-1.5 overflow-hidden">
                        <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border bg-violet-500/10 text-violet-500 border-violet-500/20 truncate`}>
                          Brand Brief
                        </span>
                        <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${getStatusBadge(brief.status as any)}`}>
                          {brief.status}
                        </span>
                      </div>

                      {/* Solid, flat actions exactly matching the screenshot style */}
                      <div className="flex items-center space-x-1 shrink-0">
                        {brief.status !== "Approved" && (
                          <button
                            id={`btn-approve-${brief.id}`}
                            onClick={handleApprove}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono px-2 py-1 rounded transition-colors uppercase font-bold cursor-pointer shrink-0"
                            title="Approve brief status"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          id={`btn-edit-${brief.id}`}
                          onClick={startEditing}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono px-2 py-1 rounded transition-colors uppercase font-bold cursor-pointer shrink-0"
                          title="Edit brief details"
                        >
                          Edit
                        </button>
                        <button
                          id={`btn-delete-${brief.id}`}
                          onClick={handleDelete}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono px-2 py-1 rounded transition-colors uppercase font-bold cursor-pointer shrink-0"
                          title="Delete creative brief"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <h4 className={`text-base font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{brief.title}</h4>
                    
                    <div className="space-y-4.5 mt-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center">
                          <Milestone className="w-3 h-3 mr-1" /> Campaign Objective
                        </span>
                        <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{brief.objective}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center">
                          <UserCheck className="w-3 h-3 mr-1" /> Target Audience
                        </span>
                        <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{brief.targetAudience}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide flex items-center">
                          <ClipboardList className="w-3 h-3 mr-1" /> Core Positioning Copy
                        </span>
                        <p className={`text-xs leading-relaxed italic ${isDark ? "text-slate-300" : "text-slate-600"}`}>"{brief.keyMessage}"</p>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-6 pt-3 border-t flex justify-between items-center text-[10px] font-mono ${
                    isDark ? "border-slate-800/60 text-slate-500" : "border-slate-150 text-slate-400"
                  }`}>
                    <span>Deliverables: {brief.deliverables}</span>
                    <span>ID: {brief.id.substring(0, 8)}...</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {briefs.length === 0 && (
          <div className="col-span-full text-center py-16 border rounded-xl border-dashed border-slate-800 text-slate-500 text-xs font-mono">
            No creative briefs logged for this brand. Click "Create Brief" to register your first.
          </div>
        )}
      </div>
    </div>
  );
};
