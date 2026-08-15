import React, { useState } from "react";
import { PublicNavbar } from "./PublicNavbar";
import { PublicFooter } from "./PublicFooter";
import { Instagram, Sparkles, Send, CheckCircle2, BarChart3, Radio } from "lucide-react";

export const IgHealthCheckPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && handle) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#15151A] text-[#F2F0EB] font-sans selection:bg-[#B08D57]/30">
      <PublicNavbar />

      <main id="main-content" className="px-4 sm:px-8 py-16 sm:py-24 max-w-4xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl neu-raised-lg space-y-8 text-center relative overflow-hidden">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full neu-pressed text-[#C5A065] text-xs font-mono font-semibold">
            <Radio className="w-3.5 h-3.5 text-[#B08D57] animate-pulse" />
            <span>Public Utility • Launching Q3 2026</span>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#F2F0EB] tracking-tight">
              Instagram Account Health Check & Audit Tool
            </h1>
            <p className="font-display text-lg text-[#C5A065] font-semibold">
              Automated Audit Engine for Ghanaian Digital Brands
            </p>
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal">
              We're building an automated audit engine for Ghanaian brands to evaluate profile bio conversion rates, grid visual rhythm, engagement consistency, and hashtag reach.
            </p>
          </div>

          {/* Features Preview Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-4">
            <div className="p-4 rounded-2xl neu-pressed space-y-2">
              <BarChart3 className="w-5 h-5 text-[#B08D57]" />
              <h2 className="text-xs font-bold text-[#F2F0EB]">Engagement Benchmark</h2>
              <p className="text-[11px] text-zinc-200">Compares your likes & comments against Ghanaian sector averages.</p>
            </div>
            <div className="p-4 rounded-2xl neu-pressed space-y-2">
              <Instagram className="w-5 h-5 text-[#B08D57]" />
              <h2 className="text-xs font-bold text-[#F2F0EB]">Bio & Link Conversion</h2>
              <p className="text-[11px] text-zinc-200">Audits CTA strength and link-in-bio navigation speed.</p>
            </div>
            <div className="p-4 rounded-2xl neu-pressed space-y-2">
              <Sparkles className="w-5 h-5 text-[#B08D57]" />
              <h2 className="text-xs font-bold text-[#F2F0EB]">AI Grid Rhythm Score</h2>
              <p className="text-[11px] text-zinc-200">Analyzes color consistency, typography contrast, and visual flow.</p>
            </div>
          </div>

          {/* Early Access Form */}
          <div className="max-w-md mx-auto pt-4">
            {submitted ? (
              <div className="p-6 rounded-2xl neu-pressed space-y-3 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#B08D57] mx-auto" />
                <h2 className="text-sm font-bold text-[#F2F0EB]">You're on the Priority List!</h2>
                <p className="text-xs text-zinc-200">
                  We'll notify <span className="text-[#F2F0EB]">{email}</span> as soon as the audit tool opens for @{handle.replace("@", "")}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 rounded-2xl neu-pressed space-y-4 text-left">
                <h2 className="text-xs font-mono text-[#C5A065] uppercase font-bold">
                  Get Early Access & Free Audit Report
                </h2>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-200 uppercase mb-1 font-medium">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="@yourbrand"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-200 uppercase mb-1 font-medium">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@brand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl neu-gold-filled text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Notify Me at Launch</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
