import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, ExternalLink, Lock, X } from "lucide-react";
import { ResourceCaptureForm } from "./ResourceCaptureForm";
import { RESOURCES, type Resource } from "../data/resourcesData";
import { crumbs, freeTools } from "../content/siteContent";
import { SEO } from "./SEO";
import { ogImage } from "../lib/seo";
import { Breadcrumbs, Card, Container, PageHero, PillButton, Reveal, SiteShell, ToolIcon } from "./site";

const t = freeTools.page;

/** Rounded dialog for the unlock form. Escape or the backdrop closes it. */
const UnlockDialog: React.FC<{ resource: Resource; onClose: () => void; onUnlock: () => void }> = ({ resource, onClose, onUnlock }) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-site-ink/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-card bg-white p-6 shadow-xl sm:p-8"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-site-paper text-site-ink cursor-pointer hover:bg-[#ece6d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <ResourceCaptureForm resourceId={resource.id} resourceTitle={resource.title} onUnlock={onUnlock} />
      </div>
    </div>
  );
};

export const ResourcesPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  // Links like /resources?unlock=leads-tracker (from the blog strip and homepage card) open that tool's form.
  useEffect(() => {
    const id = params.get("unlock");
    if (!id) return;
    const r = RESOURCES.find((x) => x.id === id && !x.comingSoon);
    if (r) setActiveResource(r);
    params.delete("unlock");
    setParams(params, { replace: true });
  }, [params, setParams]);

  const closeDialog = useCallback(() => setActiveResource(null), []);

  const handleUnlock = (resource: Resource) => {
    setUnlockedIds((prev) => (prev.includes(resource.id) ? prev : [...prev, resource.id]));
    setActiveResource(null);
    window.open(resource.fileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <SiteShell>
      <SEO title={t.seo.title} description={t.seo.description} path="/resources" image={ogImage("resources")} />
      <Breadcrumbs currentPath="/resources" items={[{ label: crumbs.home, to: "/home" }, { label: t.crumb }]} />
      <PageHero tight title={t.title} subtitle={t.intro} />

      <Container className="mt-12">
        <ul className="grid gap-4 md:grid-cols-2">
          {RESOURCES.map((r, i) => {
            const unlocked = unlockedIds.includes(r.id);
            return (
              <Reveal as="li" key={r.id} delay={i * 0.08} className="h-full">
                <Card as="article" className="flex h-full flex-col" bodyClassName="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <ToolIcon id={r.id} />
                    {r.comingSoon && (
                      <span className="rounded-full bg-site-paper px-3 py-1 text-[13px] font-semibold text-site-ink">{t.soon}</span>
                    )}
                  </div>
                  <p className="mt-5 font-mono text-xs text-site-cyanotype">{r.category}</p>
                  <h2 className="mt-1 text-2xl font-semibold leading-tight text-site-ink">{r.title}</h2>
                  <p className="mt-2 flex-1 text-base leading-normal text-site-slate">{r.description}</p>
                  <div className="mt-6">
                    {r.comingSoon ? (
                      <PillButton variant="soft" to={r.fileUrl} className="bg-site-paper! hover:bg-[#ece6d8]!">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {t.waitlist}
                      </PillButton>
                    ) : unlocked ? (
                      <PillButton variant="primary" href={r.fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        {t.open}
                      </PillButton>
                    ) : (
                      <PillButton variant="dark" onClick={() => setActiveResource(r)}>
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        {t.unlock}
                      </PillButton>
                    )}
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </ul>
      </Container>

      {activeResource && (
        <UnlockDialog resource={activeResource} onClose={closeDialog} onUnlock={() => handleUnlock(activeResource)} />
      )}
    </SiteShell>
  );
};
