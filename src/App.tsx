/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CmsProvider } from "./context/CmsContext";
import { ThemeProvider, ThemeClassSync } from "./context/ThemeContext";
import { logAnalyticsEvent } from "./lib/loadFirebase";

/**
 * React.lazy plus a `preload()`. Once preloaded, the page renders straight
 * away instead of suspending, so when the script takes over a pre-rendered
 * page it swaps in the same content with no loading-state flash.
 */
function lazyPage<P extends object>(load: () => Promise<{ default: React.ComponentType<P> }>) {
  let Loaded: React.ComponentType<P> | null = null;
  const preload = () =>
    load().then((m) => {
      Loaded = m.default;
      return m;
    });
  const Lazy = lazy(preload);
  const Page = (props: P) => (Loaded ? <Loaded {...props} /> : <Lazy {...props} />);
  return Object.assign(Page, { preload });
}

// Lazy-loaded routes. The /os admin app is its own chunk (src/OsApp.tsx).
const OsApp = lazy(() => import("./OsApp"));
const HomePage = lazyPage(() => import("./components/HomePage").then(m => ({ default: m.HomePage })));
const BlogPage = lazyPage(() => import("./components/BlogPage").then(m => ({ default: m.BlogPage })));
const BlogPostPage = lazyPage(() => import("./components/BlogPostPage").then(m => ({ default: m.BlogPostPage })));
const IgHealthCheckPage = lazyPage(() => import("./components/IgHealthCheckPage").then(m => ({ default: m.IgHealthCheckPage })));
const ServicesHubPage = lazyPage(() => import("./components/ServicesHubPage").then(m => ({ default: m.ServicesHubPage })));
const MarketingPage = lazyPage(() => import("./components/MarketingPage").then(m => ({ default: m.MarketingPage })));
const WebsitesPage = lazyPage(() => import("./components/WebsitesPage").then(m => ({ default: m.WebsitesPage })));
const AboutPage = lazyPage(() => import("./components/AboutPage").then(m => ({ default: m.AboutPage })));
const ProposalReviewPage = lazy(() => import("./components/ProposalReviewPage").then(m => ({ default: m.ProposalReviewPage })));
const ResourcesPage = lazyPage(() => import("./components/ResourcesPage").then(m => ({ default: m.ResourcesPage })));
const ClientCalendarApprovalView = lazy(() => import("./components/ClientCalendarApprovalView").then(m => ({ default: m.ClientCalendarApprovalView })));
// Dev-only component preview for the redesign. The condition is a build-time
// constant, so production builds drop this import entirely.
const DevPreviewPage = import.meta.env.DEV ? lazy(() => import("./components/site/DevPreviewPage")) : null;

/** Loads the code for the public page at `pathname`, if it is one. Called before the first render (main.tsx). */
export const preloadRoute = (pathname: string): Promise<unknown> => {
  const p = pathname.replace(/\/+$/, "") || "/";
  const page =
    p === "/" || p === "/home" ? HomePage
    : p === "/blog" ? BlogPage
    : p.startsWith("/blog/") ? BlogPostPage
    : p === "/ighealthcheck" ? IgHealthCheckPage
    : p === "/services" ? ServicesHubPage
    : p === "/services/marketing" ? MarketingPage
    : p === "/services/websites" ? WebsitesPage
    : p === "/about" ? AboutPage
    : p === "/resources" ? ResourcesPage
    : null;
  return page ? page.preload() : Promise.resolve();
};

// GA4 has no automatic pageview tracking for client-side route changes in an
// SPA, so this fires one on every path change instead.
const AnalyticsPageViewTracker: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    logAnalyticsEvent("page_view", {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title
    });
  }, [location.pathname, location.search]);
  return null;
};

/** /home → / , keeping any #section (e.g. /home#work → /#work). */
const ToHome: React.FC = () => {
  const { hash } = useLocation();
  return <Navigate to={{ pathname: "/", hash }} replace />;
};

/** Keeps the page background in step with the route: paper for the public site, dark for the admin. */
const isPublicPath = (p: string) => !/^\/(os|proposal|review|approve)(\/|$)/.test(p);
const SiteToneSync: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const pub = isPublicPath(pathname);
    document.documentElement.classList.toggle("site-public", pub);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", pub ? "#F5F1E8" : "#15151A");
  }, [pathname]);
  return null;
};

// Loading Spinner Component for Suspense Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-xs text-[var(--fin-sub)] space-y-4">
    <div className="w-8 h-8 rounded-full border-2 border-t-[var(--fin-accent)] border-[var(--fin-track)] animate-spin" />
    <div className="animate-pulse font-medium">Loading view…</div>
  </div>
);


export default function App() {
  return (
    <ThemeProvider>
      <CmsProvider>
        <BrowserRouter>
          <AnalyticsPageViewTracker />
          <SiteToneSync />
          <ThemeClassSync />
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* Fallback only: Firebase Hosting already 301s /home to / (firebase.json). */}
              <Route path="/home" element={<ToHome />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/ighealthcheck" element={<IgHealthCheckPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/services" element={<ServicesHubPage />} />
              <Route path="/services/marketing" element={<MarketingPage />} />
              <Route path="/services/websites" element={<WebsitesPage />} />
              <Route path="/about" element={<AboutPage />} />
              {/* Fallback only: Firebase Hosting already 301s /website-builds (firebase.json). */}
              <Route path="/website-builds" element={<Navigate to="/services/websites" replace />} />
              {DevPreviewPage && <Route path="/dev/components" element={<DevPreviewPage />} />}
              <Route path="/proposal/:token" element={<ProposalReviewPage />} />
              <Route path="/review/:token" element={<ClientCalendarApprovalView />} />
              <Route path="/review" element={<ClientCalendarApprovalView />} />
              <Route path="/approve/:token" element={<ClientCalendarApprovalView />} />
              <Route path="/approve" element={<ClientCalendarApprovalView />} />
              <Route
                path="/os/*"
                element={<OsApp />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CmsProvider>
    </ThemeProvider>
  );
}
