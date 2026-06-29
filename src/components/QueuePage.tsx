import React, { useState } from "react";
import { useBrand } from "../context/BrandContext";
import { ListOrdered, Plus, Filter, RefreshCw, Send, CheckCircle2, Clock, PlayCircle, Eye, AlertCircle } from "lucide-react";
import { CampaignQueue } from "../lib/firebase";

export const QueuePage: React.FC = () => {
  const { 
    activeBrand, 
    queues, 
    addCampaign, 
    updateCampaign, 
    deleteCampaign, 
    theme, 
    accentColor 
  } = useBrand();
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState<CampaignQueue["channel"]>("LinkedIn");
  const [status, setStatus] = useState<CampaignQueue["status"]>("scheduled");
  const [scheduledTime, setScheduledTime] = useState("");
  const [content, setContent] = useState("");
  const [estimatedReach, setEstimatedReach] = useState(15000);
  const [engagementRate, setEngagementRate] = useState(4.5);

  // Inline editing states for Campaign Queue
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editChannel, setEditChannel] = useState<CampaignQueue["channel"]>("LinkedIn");
  const [editContent, setEditContent] = useState("");
  const [editScheduledTime, setEditScheduledTime] = useState("");
  const [editStatus, setEditStatus] = useState<CampaignQueue["status"]>("scheduled");

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !scheduledTime) return;
    try {
      await addCampaign({
        title,
        channel,
        status,
        scheduledTime,
        content,
        metrics: {
          estimatedReach,
          engagementRate
        }
      });
      // Reset form
      setTitle("");
      setContent("");
      setScheduledTime("");
      setShowAddModal(false);
    } catch (error) {
      console.error("Error creating campaign queue item:", error);
    }
  };

  const getStatusBadge = (status: CampaignQueue["status"]) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "processing":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "scheduled":
        if (activeColor === "emerald") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        if (activeColor === "rose") return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
        if (activeColor === "amber") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
      case "completed":
        return "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700";
    }
  };

  const getStatusIcon = (status: CampaignQueue["status"]) => {
    switch (status) {
      case "active":
        return <PlayCircle className="w-3.5 h-3.5 mr-1 animate-pulse" />;
      case "processing":
        return <Clock className="w-3.5 h-3.5 mr-1 animate-spin" />;
      case "scheduled":
        return <Clock className="w-3.5 h-3.5 mr-1" />;
      case "completed":
        return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
    }
  };

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

  return (
    <div 
      id="queue-view" 
      className={`space-y-8 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}
    >
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Campaign Operations Pipeline
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Real-time Firestore-synced queue for campaign schedules belonging to <strong className={getBrandTextColor()}>{activeBrand ? activeBrand.name : "active brand"}</strong>.
          </p>
        </div>
        <button
          id="btn-trigger-add-campaign"
          onClick={() => setShowAddModal(!showAddModal)}
          className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-md shadow-md transition-colors font-mono cursor-pointer self-start md:self-auto ${
            showAddModal ? "bg-rose-600 hover:bg-rose-500 text-white" : getBrandBgButton()
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Queue Campaign</span>
        </button>
      </div>

      {/* Add Campaign Modal/Card (Conditional rendering) */}
      {showAddModal && (
        <div 
          id="add-campaign-card" 
          className={`border rounded-xl p-6 shadow-xl animate-in slide-in-from-top-3 duration-200 ${
            isDark ? "bg-[#161616] border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4">
            Queue Campaign Transaction
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Campaign/Post Title *</label>
                <input
                  id="campaign-input-title"
                  type="text"
                  required
                  placeholder="e.g., Serverless Scale Release"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-slate-880 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Distribution Channel</label>
                <select
                  id="campaign-input-channel"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as CampaignQueue["channel"])}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-slate-880 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="Twitter/X">Twitter/X</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Newsletter">Newsletter</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Scheduling Target *</label>
                <input
                  id="campaign-input-sched"
                  type="text"
                  required
                  placeholder="e.g., 2026-06-30 02:30 PM"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-slate-880 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Pipeline State</label>
                <select
                  id="campaign-input-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CampaignQueue["status"])}
                  className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                    isDark ? "bg-slate-950 border-slate-880 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active (Processing Immediate)</option>
                  <option value="processing">Processing</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Est. Reach</label>
                  <input
                    id="campaign-input-reach"
                    type="number"
                    value={estimatedReach}
                    onChange={(e) => setEstimatedReach(Number(e.target.value))}
                    className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                      isDark ? "bg-slate-950 border-slate-880 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Engagement Rate %</label>
                  <input
                    id="campaign-input-engage"
                    type="number"
                    step="0.1"
                    value={engagementRate}
                    onChange={(e) => setEngagementRate(Number(e.target.value))}
                    className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans ${
                      isDark ? "bg-slate-950 border-slate-880 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono tracking-wide uppercase text-slate-400 mb-1.5">Content Body / Creative Copy *</label>
              <textarea
                id="campaign-input-content"
                rows={4}
                required
                placeholder="Write your campaign messaging here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:border-violet-500 font-sans resize-none ${
                  isDark ? "bg-slate-950 border-slate-880 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                }`}
              />
            </div>

            <div className="flex justify-end pt-2 space-x-3">
              <button
                id="campaign-cancel-btn"
                type="button"
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 border text-xs rounded-md font-mono cursor-pointer ${
                  isDark ? "border-slate-800 text-slate-400 hover:text-slate-200" : "border-slate-200 text-slate-500 hover:text-slate-800"
                }`}
              >
                Cancel Transaction
              </button>
              <button
                id="campaign-submit-btn"
                type="submit"
                className={`px-4 py-2 text-xs font-semibold rounded-md shadow-md font-mono cursor-pointer ${getBrandBgButton()}`}
              >
                Dispatch to Pipeline
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Queue items pipeline tracking list */}
      <div className={`border rounded-xl overflow-hidden shadow-lg ${
        isDark ? "bg-[#161616] border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? "border-slate-800/60 bg-slate-900/20" : "border-slate-150 bg-slate-50/50"
        }`}>
          <div className="flex items-center space-x-2">
            <ListOrdered className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-500 font-mono">Live Campaign Registry ({queues.length} total)</h3>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-mono text-slate-400">Live Listening to Firestore</span>
          </div>
        </div>

        <div className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
          {queues.map((item) => {
            const isEditing = editingId === item.id;

            const startEditing = () => {
              setEditingId(item.id);
              setEditTitle(item.title);
              setEditChannel(item.channel);
              setEditContent(item.content);
              setEditScheduledTime(item.scheduledTime);
              setEditStatus(item.status);
            };

            const cancelEditing = () => {
              setEditingId(null);
            };

            const saveEditing = async () => {
              if (!editTitle || !editContent || !editScheduledTime) return;
              try {
                await updateCampaign(item.id, {
                  title: editTitle,
                  channel: editChannel,
                  content: editContent,
                  scheduledTime: editScheduledTime,
                  status: editStatus
                });
                setEditingId(null);
              } catch (err) {
                console.error("Failed to update campaign queue item:", err);
              }
            };

            const handleApprove = async () => {
              try {
                await updateCampaign(item.id, { status: "completed" });
              } catch (err) {
                console.error("Failed to approve/complete campaign:", err);
              }
            };

            const handleDelete = async () => {
              if (window.confirm("Are you sure you want to delete this campaign queue item?")) {
                try {
                  await deleteCampaign(item.id);
                } catch (err) {
                  console.error("Failed to delete campaign queue item:", err);
                }
              }
            };

            return (
              <div
                key={item.id}
                id={`queue-item-${item.id}`}
                className={`p-6 transition-colors ${
                  isDark ? "hover:bg-slate-950/10" : "hover:bg-slate-50/10"
                }`}
              >
                {isEditing ? (
                  <div className="space-y-4 w-full">
                    <div className="text-xs font-mono text-slate-400 border-b pb-1.5 uppercase font-bold tracking-wider">
                      Edit Pipeline Post
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Campaign Title</label>
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
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Channel</label>
                        <select
                          value={editChannel}
                          onChange={(e) => setEditChannel(e.target.value as CampaignQueue["channel"])}
                          className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        >
                          <option value="Twitter/X">Twitter/X</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Instagram">Instagram</option>
                          <option value="Newsletter">Newsletter</option>
                          <option value="YouTube">YouTube</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Scheduling Target</label>
                        <input
                          type="text"
                          value={editScheduledTime}
                          onChange={(e) => setEditScheduledTime(e.target.value)}
                          className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Status State</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as CampaignQueue["status"])}
                          className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans ${
                            isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                          }`}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="active">Active</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wide text-slate-400 mb-1">Content Copy</label>
                      <textarea
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:border-violet-500 font-sans resize-none ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
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
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0 md:space-x-6">
                    <div className="space-y-2.5 flex-1">
                      {/* Meta channel & state & High-contrast solid action buttons */}
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase tracking-wide ${
                            isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                          }`}>
                            {item.channel}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center ${getStatusBadge(item.status)}`}>
                            {getStatusIcon(item.status)}
                            <span className="capitalize">{item.status}</span>
                          </span>
                        </div>

                        {/* Solid flat buttons styled like HTML */}
                        <div className="flex items-center space-x-1">
                          {item.status !== "completed" && (
                            <button
                              id={`btn-approve-queue-${item.id}`}
                              onClick={handleApprove}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono px-2 py-1 rounded transition-colors uppercase font-bold cursor-pointer shrink-0"
                              title="Set status to completed"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            id={`btn-edit-queue-${item.id}`}
                            onClick={startEditing}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono px-2 py-1 rounded transition-colors uppercase font-bold cursor-pointer shrink-0"
                            title="Edit campaign queue details"
                          >
                            Edit
                          </button>
                          <button
                            id={`btn-delete-queue-${item.id}`}
                            onClick={handleDelete}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono px-2 py-1 rounded transition-colors uppercase font-bold cursor-pointer shrink-0"
                            title="Delete queue item"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <h4 className={`text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.title}</h4>
                      <p className={`text-xs leading-relaxed max-w-3xl whitespace-pre-line border rounded-lg p-3 font-normal font-sans ${
                        isDark ? "bg-slate-950/40 border-slate-800/40 text-slate-300" : "bg-slate-50 border-slate-200/60 text-slate-600"
                      }`}>
                        {item.content}
                      </p>

                      {/* Sched target */}
                      <div className="flex items-center space-x-2.5 text-[10px] font-mono text-slate-400">
                        <span className="font-semibold text-slate-400">Scheduled for:</span>
                        <span className={`${isDark ? "text-slate-300" : "text-slate-700"}`}>{item.scheduledTime}</span>
                      </div>
                    </div>

                    {/* Metrics projections block */}
                    {item.metrics && (
                      <div className={`border rounded-lg p-4 min-w-[200px] flex flex-col justify-between font-mono ${
                        isDark ? "bg-slate-950 border-slate-850/60" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="text-[9px] uppercase tracking-wide text-slate-400 font-bold border-b pb-1.5 mb-2.5 border-slate-200 dark:border-slate-800">
                          Operations Estimate
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Est. Reach:</span>
                            <span className={`font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{(item.metrics.estimatedReach).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Eng. Factor:</span>
                            <span className={`font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{item.metrics.engagementRate}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {queues.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-xs font-mono">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div>No campaigns currently registered in this client brand pipeline.</div>
              <p className="text-[11px] text-slate-500 mt-1">Click the "Queue Campaign" button above to insert data records into Firestore.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
