/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { BrandProvider, useBrand } from "./context/BrandContext";
import { CmsProvider } from "./context/CmsContext";
import { ThemeProvider } from "./context/ThemeContext";
import { TopNav } from "./components/TopNav";
import { PageHeader } from "./components/PageHeader";
import { logAnalyticsEvent } from "./lib/firebase";

// Lazy-loaded route & view components for code splitting & ~1.4MB bundle reduction
const LoginScreen = lazy(() => import("./components/LoginScreen").then(m => ({ default: m.LoginScreen })));
const DashboardPage = lazy(() => import("./components/DashboardPage").then(m => ({ default: m.DashboardPage })));
const BrandsPage = lazy(() => import("./components/BrandsPage").then(m => ({ default: m.BrandsPage })));
const LeadsPage = lazy(() => import("./components/LeadsPage").then(m => ({ default: m.LeadsPage })));
const CalendarPage = lazy(() => import("./components/CalendarPage").then(m => ({ default: m.CalendarPage })));
const PerformanceIntelligencePage = lazy(() => import("./components/PerformanceIntelligencePage").then(m => ({ default: m.PerformanceIntelligencePage })));
const AnalyticsImportPage = lazy(() => import("./components/AnalyticsImportPage").then(m => ({ default: m.AnalyticsImportPage })));
const DirectionsPage = lazy(() => import("./components/DirectionsPage").then(m => ({ default: m.DirectionsPage })));
const InsightsPage = lazy(() => import("./components/InsightsPage").then(m => ({ default: m.InsightsPage })));
const BrandGuidePage = lazy(() => import("./components/BrandGuidePage").then(m => ({ default: m.BrandGuidePage })));
const AIChatbotPage = lazy(() => import("./components/AIChatbotPage").then(m => ({ default: m.AIChatbotPage })));
const CreativeSandboxPage = lazy(() => import("./components/CreativeSandboxPage").then(m => ({ default: m.CreativeSandboxPage })));
const CmsPage = lazy(() => import("./components/CmsPage").then(m => ({ default: m.CmsPage })));
const HomePage = lazy(() => import("./components/HomePage").then(m => ({ default: m.HomePage })));
const BlogPage = lazy(() => import("./components/BlogPage").then(m => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() => import("./components/BlogPostPage").then(m => ({ default: m.BlogPostPage })));
const IgHealthCheckPage = lazy(() => import("./components/IgHealthCheckPage").then(m => ({ default: m.IgHealthCheckPage })));
const ResourcesPage = lazy(() => import("./components/ResourcesPage").then(m => ({ default: m.ResourcesPage })));
const ClientCalendarApprovalView = lazy(() => import("./components/ClientCalendarApprovalView").then(m => ({ default: m.ClientCalendarApprovalView })));

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

// Loading Spinner Component for Suspense Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-xs text-[#667085] space-y-4">
    <div className="w-8 h-8 rounded-full border-2 border-t-[#4F46E5] border-[#E4E6EE] animate-spin" />
    <div className="animate-pulse font-medium">Loading view…</div>
  </div>
);

// Per-view title + subtitle for the Finnova-style page header.
const VIEW_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Overview", subtitle: "Your live brand workspace at a glance." },
  cms: { title: "Blog & CMS", subtitle: "Write, manage and publish all your content." },
  brands: { title: "Brand Registry", subtitle: "Every client brand workspace you operate." },
  leads: { title: "Resource Leads", subtitle: "Inbound leads captured from your resources." },
  calendar: { title: "Content Calendar", subtitle: "Plan, brief and schedule everything in one place." },
  sandbox: { title: "Creative Sandbox", subtitle: "Experiment with creative concepts freely." },
  performance: { title: "AI Intelligence", subtitle: "Automated performance analysis and signals." },
  insights: { title: "Strategic Insights", subtitle: "Deep-dive intelligence across your brands." },
  chatbot: { title: "AI Creative Partner", subtitle: "Your always-on creative collaborator." },
  import: { title: "Analytics Import", subtitle: "Bring performance exports into the OS." },
  directions: { title: "Brand Directions", subtitle: "Creative and strategic direction sets." },
  guide: { title: "Style & Guides", subtitle: "Brand rules, tokens and visual standards." }
};

// NOK OS Dashboard Shell (Auth-gated specifically for /os/*)
const OsAppShell: React.FC = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const { loading, user } = useBrand();
  const meta = VIEW_META[activeView] || VIEW_META.dashboard;

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard": return <DashboardPage />;
      case "cms": return <CmsPage />;
      case "brands": return <BrandsPage />;
      case "leads": return <LeadsPage />;
      case "calendar": return <CalendarPage />;
      case "performance": return <PerformanceIntelligencePage />;
      case "import": return <AnalyticsImportPage />;
      case "directions": return <DirectionsPage />;
      case "insights": return <InsightsPage />;
      case "guide": return <BrandGuidePage />;
      case "chatbot": return <AIChatbotPage />;
      case "sandbox": return <CreativeSandboxPage />;
      default: return <DashboardPage />;
    }
  };

  if (loading) {
    return (
      <div className="fin-scope fin-page min-h-screen flex flex-col items-center justify-center text-xs text-[#667085] space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-t-[#4F46E5] border-[#E4E6EE] animate-spin" />
        <div className="animate-pulse font-medium">Mounting NOK OS Brand Workspace…</div>
      </div>
    );
  }

  // Auth gate intercepts only /os/*
  if (!user) {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <LoginScreen />
      </Suspense>
    );
  }

  return (
    <div
      id="app-shell"
      className="fin-scope fin-page min-h-screen flex flex-col font-sans select-none"
    >
      {/* Finnova-style top bar: logo · centered pill nav · icon actions */}
      <TopNav activeView={activeView} setActiveView={setActiveView} />

      {/* Dynamic page container with semantic <main> landmark */}
      <main
        id="main-view-container"
        className="flex-1 overflow-y-auto fin-scrollbar px-4 sm:px-8 pb-12 pt-2"
      >
        <div className="max-w-[1400px] mx-auto w-full">
          <PageHeader
            title={meta.title}
            subtitle={meta.subtitle}
            showFilter
            onBack={activeView === "dashboard" ? undefined : () => setActiveView("dashboard")}
          />
          <Suspense fallback={<PageLoadingFallback />}>
            {renderActiveView()}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <CmsProvider>
        <BrowserRouter>
          <AnalyticsPageViewTracker />
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/ighealthcheck" element={<IgHealthCheckPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/review/:token" element={<ClientCalendarApprovalView />} />
              <Route path="/review" element={<ClientCalendarApprovalView />} />
              <Route path="/approve/:token" element={<ClientCalendarApprovalView />} />
              <Route path="/approve" element={<ClientCalendarApprovalView />} />
              <Route
                path="/os/*"
                element={
                  <BrandProvider>
                    <OsAppShell />
                  </BrandProvider>
                }
              />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CmsProvider>
    </ThemeProvider>
  );
}
