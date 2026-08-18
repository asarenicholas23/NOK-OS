/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BrandProvider, useBrand } from "./context/BrandContext";
import { CmsProvider } from "./context/CmsContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";

// Lazy-loaded route & view components for code splitting & ~1.4MB bundle reduction
const LoginScreen = lazy(() => import("./components/LoginScreen").then(m => ({ default: m.LoginScreen })));
const DashboardPage = lazy(() => import("./components/DashboardPage").then(m => ({ default: m.DashboardPage })));
const BrandsPage = lazy(() => import("./components/BrandsPage").then(m => ({ default: m.BrandsPage })));
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

// Loading Spinner Component for Suspense Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center font-mono text-xs text-[#B08D57] space-y-4">
    <div className="w-8 h-8 rounded-full border-2 border-t-[#B08D57] border-[#1C1C22] animate-spin" />
    <div className="animate-pulse">Loading view assets...</div>
  </div>
);

// NOK OS Dashboard Shell (Auth-gated specifically for /os/*)
const OsAppShell: React.FC = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { loading, user } = useBrand();

  const getPageLabel = () => {
    switch (activeView) {
      case "dashboard": return "Control Dashboard";
      case "cms": return "Blog & CMS Manager";
      case "brands": return "Brand Registry";
      case "calendar": return "Content Calendar & Briefs";
      case "performance": return "Performance AI";
      case "import": return "Analytics Import";
      case "directions": return "Brand Directions";
      case "insights": return "Strategic Insights";
      case "guide": return "Style Guides";
      case "chatbot": return "AI Creative Partner";
      case "sandbox": return "Creative Sandbox";
      default: return "Dashboard";
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard": return <DashboardPage />;
      case "cms": return <CmsPage />;
      case "brands": return <BrandsPage />;
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
      <div className="min-h-screen bg-[#15151A] flex flex-col items-center justify-center font-mono text-xs text-[#B08D57] space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-t-[#B08D57] border-[#1C1C22] animate-spin" />
        <div className="animate-pulse">Mounting NOK OS Brand Workspace...</div>
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
      className="min-h-screen flex font-sans select-none overflow-hidden bg-[#15151A] text-[#F2F0EB]"
    >
      {/* Persistent left sidebar navigation */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Main dashboard control stage */}
      <div 
        id="main-content-stage" 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "pl-16" : "pl-64"
        }`}
      >
        {/* Global sticky header with Brand Switcher */}
        <Header viewLabel={getPageLabel()} />

        {/* Dynamic page container with semantic <main> landmark */}
        <main id="main-view-container" className="flex-1 overflow-y-auto p-6 sm:p-8 max-h-[calc(100vh-4rem)] scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<PageLoadingFallback />}>
              {renderActiveView()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrandProvider>
      <CmsProvider>
        <BrowserRouter>
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
              <Route path="/os/*" element={<OsAppShell />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CmsProvider>
    </BrandProvider>
  );
}
