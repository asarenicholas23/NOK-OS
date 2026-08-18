import React, { useState, useEffect } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const LEAD_EMAIL_STORAGE_KEY = "nok_lead_email";

interface ResourceCaptureFormProps {
  resourceId: string;
  resourceTitle: string;
  onUnlock: () => void;
}

export const ResourceCaptureForm: React.FC<ResourceCaptureFormProps> = ({
  resourceId,
  resourceTitle,
  onUnlock
}) => {
  const [savedEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LEAD_EMAIL_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Returning visitor shortcut: skip the form entirely and unlock immediately.
  useEffect(() => {
    if (savedEmail) {
      onUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !businessName) return;
    setSubmitting(true);
    setError("");
    try {
      await addDoc(collection(db, "leads"), {
        name,
        email,
        businessName,
        resourceId,
        resourceTitle,
        source: "resources-page",
        timestamp: serverTimestamp()
      });
      try {
        localStorage.setItem(LEAD_EMAIL_STORAGE_KEY, email);
      } catch {
        // Ignore storage failures (private browsing, etc.) — unlock still proceeds.
      }
      onUnlock();
    } catch (err) {
      console.error("Failed to save lead:", err);
      setError("Something went wrong submitting your details. Please try again.");
      setSubmitting(false);
    }
  };

  if (savedEmail) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-12 h-12 rounded-2xl neu-pressed text-[#B08D57] mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-[#B08D57]" />
        </div>
        <p className="text-xs text-zinc-200">Welcome back — unlocking your resource...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="text-xs font-mono text-[#B08D57] uppercase tracking-wider font-semibold">Free Resource</div>
        <h3 className="font-display text-xl font-bold text-[#F2F0EB]">Unlock "{resourceTitle}"</h3>
        <p className="text-xs text-zinc-200 mt-1">
          Enter your details once and every future resource unlocks instantly.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <div>
          <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Your Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Ama Osei"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Email Address *</label>
          <input
            type="email"
            required
            placeholder="e.g. ama@brand.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-zinc-200 mb-1">Business or Brand Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Osu Vintage Kicks"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
          />
        </div>
      </div>

      {error && <p className="text-[11px] text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl neu-gold-filled text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-md mt-4 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        <span>{submitting ? "Unlocking..." : "Unlock Resource"}</span>
      </button>
    </form>
  );
};
