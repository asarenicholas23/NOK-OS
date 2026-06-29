/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BrandProvider, useBrand } from "./context/BrandContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { LoginScreen } from "./components/LoginScreen";
import { DashboardPage } from "./components/DashboardPage";
import { BrandsPage } from "./components/BrandsPage";
import { QueuePage } from "./components/QueuePage";
import { CalendarPage } from "./components/CalendarPage";
import { PerformanceIntelligencePage } from "./components/PerformanceIntelligencePage";
import { AnalyticsImportPage } from "./components/AnalyticsImportPage";
import { BriefsPage } from "./components/BriefsPage";
import { DirectionsPage } from "./components/DirectionsPage";
import { InsightsPage } from "./components/InsightsPage";
import { BrandGuidePage } from "./components/BrandGuidePage";
import { Terminal, ShieldAlert } from "lucide-react";

const MainAppContent: React.FC = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { loading, activeBrand, user, theme } = useBrand();

  const getPageLabel = () => {
    switch (activeView) {
      case "dashboard": return "Control Dashboard";
      case "brands": return "Brand Registry";
      case "queue": return "Operations Queue";
      case "calendar": return "Content Calendar";
      case "performance": return "Performance AI";
      case "import": return "Analytics Import";
      case "briefs": return "Creative Briefs";
      case "directions": return "Brand Directions";
      case "insights": return "Strategic Insights";
      case "guide": return "Style Guides";
      default: return "Dashboard";
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard": return <DashboardPage />;
      case "brands": return <BrandsPage />;
      case "queue": return <QueuePage />;
      case "calendar": return <CalendarPage />;
      case "performance": return <PerformanceIntelligencePage />;
      case "import": return <AnalyticsImportPage />;
      case "briefs": return <BriefsPage />;
      case "directions": return <DirectionsPage />;
      case "insights": return <InsightsPage />;
      case "guide": return <BrandGuidePage />;
      default: return <DashboardPage />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center font-mono text-xs text-slate-400 space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-t-violet-500 border-slate-900 animate-spin"></div>
        <div className="animate-pulse">Mounting N.O.K Os Brand Workspace...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const isDark = theme === "dark";

  return (
    <div 
      id="app-shell" 
      className={`min-h-screen flex font-sans select-none overflow-hidden transition-colors duration-200 ${
        isDark ? "bg-[#111] text-slate-100" : "bg-slate-100/40 text-slate-800"
      }`}
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

        {/* Dynamic page container */}
        <main id="main-view-container" className="flex-1 overflow-y-auto p-8 max-h-[calc(100vh-4rem)] scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrandProvider>
      <MainAppContent />
    </BrandProvider>
  );
}
