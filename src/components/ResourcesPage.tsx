import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "./PublicNavbar";
import { PublicFooter } from "./PublicFooter";
import { ResourceCaptureForm } from "./ResourceCaptureForm";
import { RESOURCES, Resource } from "../data/resourcesData";
import { Gift, Lock, ExternalLink, X, FileSpreadsheet, Clock } from "lucide-react";

export const ResourcesPage: React.FC = () => {
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  const handleUnlock = (resource: Resource) => {
    setUnlockedIds((prev) => (prev.includes(resource.id) ? prev : [...prev, resource.id]));
    setActiveResource(null);
    window.open(resource.fileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#15151A] text-[#F2F0EB] font-sans selection:bg-[#B08D57]/30">
      <PublicNavbar />

      <main id="main-content" className="px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full neu-pressed text-[#C5A065] text-xs font-mono font-semibold">
            <Gift className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>Free Resources</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#F2F0EB] tracking-tight">
            Free Tools & Templates for Growing Brands
          </h1>
          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
            Practical, no-fluff resources we use ourselves — unlock any of them below with one quick form. New resources are added regularly.
          </p>
        </div>

        {/* Resource Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RESOURCES.map((resource) => {
            const unlocked = unlockedIds.includes(resource.id);
            return (
              <div
                key={resource.id}
                className={`p-6 rounded-3xl neu-raised-lg space-y-4 flex flex-col ${resource.comingSoon ? "opacity-80" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl neu-pressed flex items-center justify-center text-[#B08D57]">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  {resource.comingSoon && (
                    <span className="text-[9px] font-mono bg-[#B08D57]/20 text-[#C5A065] px-2 py-1 rounded-full font-semibold uppercase tracking-wider">
                      Coming Soon
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <span className="text-[10px] font-mono text-[#C5A065] uppercase tracking-wider font-semibold">
                    {resource.category}
                  </span>
                  <h2 className="font-display text-lg font-bold text-[#F2F0EB]">{resource.title}</h2>
                  <p className="text-xs text-zinc-200 leading-relaxed">{resource.description}</p>
                </div>

                {resource.comingSoon ? (
                  <Link
                    to={resource.fileUrl}
                    className="w-full py-3 rounded-xl neu-pressed text-xs font-bold text-zinc-200 hover:text-[#F2F0EB] flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#B08D57]" />
                    <span>Join the Waitlist</span>
                  </Link>
                ) : unlocked ? (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl neu-gold-filled text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Resource</span>
                  </a>
                ) : (
                  <button
                    onClick={() => setActiveResource(resource)}
                    className="w-full py-3 rounded-xl neu-gold-filled text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unlock</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Capture Form Modal, scoped to whichever resource was clicked */}
      {activeResource && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveResource(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl neu-raised-lg p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setActiveResource(null)}
              className="absolute top-6 right-6 p-2 rounded-xl neu-raised text-zinc-200 hover:text-[#F2F0EB] cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <ResourceCaptureForm
              resourceId={activeResource.id}
              resourceTitle={activeResource.title}
              onUnlock={() => handleUnlock(activeResource)}
            />
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
};
