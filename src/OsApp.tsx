/**
 * The NOK OS admin app (/os/*). Loaded on its own, only when someone opens
 * /os, so none of it is downloaded by visitors to the public site.
 */
import React, { Suspense, lazy, useEffect, useState } from "react";
import { useCms } from "./context/CmsContext";
import { BrandProvider, useBrand } from "./context/BrandContext";
import { OsSidebar, groupOfView } from "./components/OsSidebar";
import { OsTopBar } from "./components/OsTopBar";
import { PageHeader } from "./components/PageHeader";

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

// Loading Spinner Component for Suspense Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-xs text-[var(--fin-sub)] space-y-4">
    <div className="w-8 h-8 rounded-full border-2 border-t-[var(--fin-accent)] border-[var(--fin-track)] animate-spin" />
    <div className="animate-pulse font-medium">Loading view…</div>
  </div>
);

// Per-view title + subtitle for the page header.
const VIEW_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Overview", subtitle: "Your live brand workspace at a glance." },
  cms: { title: "CMS & Sales", subtitle: "Discovery calls, proposals and payments, blog, services and site content." },
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Desktop sidebar collapses to an icon rail; remembered per browser.
  const [navCollapsed, setNavCollapsed] = useState(() => {
    try {
      return localStorage.getItem("nok-os-nav-collapsed") === "1";
    } catch {
      return false;
    }
  });
  const toggleNav = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setNavCollapsed((c) => {
        try {
          localStorage.setItem("nok-os-nav-collapsed", c ? "0" : "1");
        } catch {}
        return !c;
      });
    } else {
      setMobileNavOpen(true);
    }
  };
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
      <div className="fin-scope fin-page min-h-screen flex flex-col items-center justify-center text-xs text-[var(--fin-sub)] space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-t-[var(--fin-accent)] border-[var(--fin-track)] animate-spin" />
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
    <div id="app-shell" className="fin-scope fin-page min-h-screen flex font-sans">
      <OsSidebar
        activeView={activeView}
        onNavigate={setActiveView}
        collapsed={navCollapsed}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <OsTopBar title={meta.title} onMenu={toggleNav} onNavigate={setActiveView} />

        <main id="main-view-container" className="flex-1 px-4 sm:px-8 pt-7 pb-12">
          <div className="max-w-[1400px] mx-auto w-full">
            <PageHeader badge={groupOfView(activeView)} title={meta.title} subtitle={meta.subtitle} />
            <Suspense fallback={<PageLoadingFallback />}>
              {renderActiveView()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

const OsApp: React.FC = () => {
  // The admin edits live CMS data, so connect to it straight away.
  const { requestLiveData } = useCms();
  useEffect(requestLiveData, [requestLiveData]);
  return (
    <BrandProvider>
      <OsAppShell />
    </BrandProvider>
  );
};

export default OsApp;
