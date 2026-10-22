import React, { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { BarChart3, CheckCircle2, Clock, LayoutGrid, Link2, Loader2, Send } from "lucide-react";
import { db } from "../lib/firebase";
import { crumbs, freeTools, igHealthCheck as t } from "../content/siteContent";
import { SEO } from "./SEO";
import { ogImage } from "../lib/seo";
import { Breadcrumbs, Container, H2, PageHero, Reveal, SiteShell } from "./site";

const FEATURE_ICONS = [BarChart3, Link2, LayoutGrid];

const inputCls =
  "w-full rounded-2xl bg-site-paper px-4 py-3 text-base text-site-graphite placeholder:text-site-slate/70 outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype";
const labelCls = "mb-1.5 block text-[15px] font-medium text-site-ink";

/** Waitlist form. Entries go to the same "leads" list as the free tools, tagged as waitlist. */
const Waitlist: React.FC = () => {
  const f = t.form;
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const cleanHandle = handle.trim().replace(/^@+/, "");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !cleanHandle) return;
    setSubmitting(true);
    setError("");
    try {
      await addDoc(collection(db, "leads"), {
        name: "",
        email: email.trim(),
        businessName: `@${cleanHandle}`,
        instagramHandle: cleanHandle,
        resourceId: "ig-health-check",
        resourceTitle: "Instagram health check (waitlist)",
        source: "ig-health-check-waitlist",
        timestamp: serverTimestamp(),
      });
      setDone(true);
    } catch (err) {
      console.error("Failed to join waitlist:", err);
      setError(f.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div role="status" className="rounded-card bg-white p-7 text-center sm:p-9">
        <CheckCircle2 className="mx-auto h-9 w-9 text-site-cyanotype" aria-hidden="true" />
        <h2 className="mt-3 text-2xl font-semibold text-site-ink">{f.doneTitle}</h2>
        <p className="mt-1.5 text-base leading-normal text-site-slate">{f.done(email.trim(), cleanHandle)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} aria-labelledby="waitlist-title" className="rounded-card bg-white p-6 sm:p-9">
      <h2 id="waitlist-title" className="text-2xl font-semibold leading-tight text-site-ink">
        {f.title}
      </h2>
      <p className="mt-1.5 text-base leading-normal text-site-slate">{f.body}</p>
      <div className="mt-5 space-y-3">
        <div>
          <label htmlFor="ig-handle" className={labelCls}>{f.handle}</label>
          <input id="ig-handle" type="text" required autoComplete="off" placeholder={f.handlePlaceholder} value={handle} onChange={(e) => setHandle(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="ig-email" className={labelCls}>{f.email}</label>
          <input id="ig-email" type="email" required autoComplete="email" placeholder={f.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-[15px] text-[#B42318]">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-site-amber px-6 py-3.5 text-base font-semibold text-site-ink cursor-pointer transition-[filter] duration-300 ease-soft hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
        {submitting ? f.submitting : f.submit}
      </button>
    </form>
  );
};

export const IgHealthCheckPage: React.FC = () => (
  <SiteShell>
    <SEO title={t.seo.title} description={t.seo.description} path="/ighealthcheck" image={ogImage("ighealthcheck")} />
    <Breadcrumbs
      currentPath="/ighealthcheck"
      items={[{ label: crumbs.home, to: "/home" }, { label: freeTools.page.crumb, to: "/resources" }, { label: t.crumb }]}
    />
    <PageHero tight tag={t.tag} title={t.title} subtitle={t.subtitle} />

    <Container className="mt-12 grid items-start gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-10">
      <section aria-labelledby="ig-features">
        <H2 id="ig-features" className="flex items-center gap-2.5">
          {t.featuresTitle}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-site-ink">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {t.tag}
          </span>
        </H2>
        <ul className="mt-5 space-y-3">
          {t.features.map((feat, i) => {
            const Icon = FEATURE_ICONS[i] ?? BarChart3;
            return (
              <Reveal as="li" key={feat.title} delay={i * 0.08}>
                <article className="flex gap-4 rounded-card bg-white p-5 sm:p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E4ECF7] text-site-cyanotype">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold leading-tight text-site-ink">{feat.title}</h3>
                    <p className="mt-1 text-base leading-normal text-site-slate">{feat.desc}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </section>
      <Reveal delay={0.1} className="md:sticky md:top-28">
        <Waitlist />
      </Reveal>
    </Container>
  </SiteShell>
);
