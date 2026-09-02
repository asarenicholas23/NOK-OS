import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Trash2,
  Volume2,
  Globe,
  Sun,
  Moon,
  ChevronDown,
  Building,
  Newspaper,
  Layers,
  Inbox,
  Sparkles
} from "lucide-react";
import { useBrand } from "../context/BrandContext";

interface TopNavProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

// Quick-access views rendered as circular icon buttons (like the action icons).
const iconShortcuts = [
  { id: "cms", label: "Blog & CMS", icon: Newspaper },
  { id: "brands", label: "Brands", icon: Layers },
  { id: "leads", label: "Leads", icon: Inbox },
  { id: "sandbox", label: "Sandbox", icon: Sparkles }
];

// Everything else stays as text pills on the dark island.
const islandItems = [
  { id: "dashboard", label: "Overview" },
  { id: "calendar", label: "Calendar" },
  { id: "performance", label: "AI Intel" },
  { id: "insights", label: "Insights" },
  { id: "chatbot", label: "AI Partner" },
  { id: "import", label: "Import" },
  { id: "directions", label: "Directions" },
  { id: "guide", label: "Guides" }
];

const NokMark: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 46 46">
    <circle cx="12" cy="23" r="5" fill="#ffffff" />
    <circle cx="32" cy="11" r="5" fill="#C7D2FE" />
    <circle cx="32" cy="35" r="5" fill="#C7D2FE" />
    <line x1="12" y1="23" x2="32" y2="11" stroke="#ffffff" strokeWidth="2" />
    <line x1="12" y1="23" x2="32" y2="35" stroke="#ffffff" strokeWidth="2" />
  </svg>
);

export const TopNav: React.FC<TopNavProps> = ({ activeView, setActiveView }) => {
  const {
    brands,
    activeBrand,
    activeBrandId,
    setActiveBrandId,
    loading,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    theme,
    setTheme
  } = useBrand();

  const [notifOpen, setNotifOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <header
      id="global-header"
      className="fin-topbar sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3"
    >
      {/* Left cluster: logo + quick-access icon shortcuts */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-[#5B50E3] flex items-center justify-center text-white shadow-[0_10px_22px_-10px_rgba(91,80,227,0.7)]">
          <NokMark />
        </div>
        <span className="hidden md:block w-px h-7 bg-[#dbd9ea] mx-1" />
        {iconShortcuts.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => setActiveView(item.id)}
              className={`w-9 h-9 ${isActive ? "fin-iconbtn fin-iconbtn-active" : "fin-iconbtn"}`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Center island: remaining views as filled-pill tabs */}
      <nav className="fin-topnav flex items-center gap-1 mx-auto overflow-x-auto max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {islandItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => setActiveView(item.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-full ${
                isActive ? "fin-topnav-pill-active" : "fin-topnav-pill"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleTheme}
          className="fin-iconbtn w-9 h-9"
          title={theme === "dark" ? "Switch to Day Mode" : "Switch to Night Mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <Link to="/home" className="fin-iconbtn w-9 h-9" title="Return to Agency Site">
          <Globe className="w-4 h-4" />
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            id="notification-bell-trigger"
            onClick={() => setNotifOpen(!notifOpen)}
            className="fin-iconbtn w-9 h-9 relative"
            title="System alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#5B50E3] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl fin-card p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 flex items-center justify-between border-b border-[#ECEBF3] mb-2 text-xs font-semibold text-[#6B6880]">
                  <span className="flex items-center text-[#5B50E3]">
                    <Volume2 className="w-3.5 h-3.5 mr-1.5" />
                    NOK OS System Alerts
                  </span>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        clearAllNotifications();
                        setNotifOpen(false);
                      }}
                      className="text-rose-500 hover:text-rose-600 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 fin-scrollbar">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 rounded-xl text-xs flex items-start space-x-2.5 fin-inset ${
                        notif.read ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#16151F] flex justify-between items-start">
                          <span className="truncate">{notif.title}</span>
                          <span className="text-[9px] text-[#9D9AB0] ml-1 shrink-0">{notif.timestamp}</span>
                        </div>
                        <p className="text-[#6B6880] text-[11px] mt-0.5 leading-relaxed">{notif.message}</p>
                        {!notif.read && (
                          <button
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="text-[9px] font-semibold text-[#5B50E3] hover:underline mt-1 cursor-pointer"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-6 text-center text-[#9D9AB0] text-xs">No system notifications</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Brand switcher */}
        <div className="relative">
          <button
            id="brand-switcher-trigger"
            onClick={() => setBrandOpen(!brandOpen)}
            disabled={loading || brands.length === 0}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full fin-card-sm text-xs font-semibold text-[#16151F] cursor-pointer"
          >
            <span className="w-6 h-6 rounded-full bg-[#5B50E3] text-white flex items-center justify-center text-[10px] font-bold">
              {activeBrand?.logoText || <Building className="w-3 h-3" />}
            </span>
            <span className="hidden sm:inline max-w-[120px] truncate">{activeBrand ? activeBrand.name : "Select Brand"}</span>
            <ChevronDown className={`w-3 h-3 text-[#9D9AB0] transition-transform ${brandOpen ? "rotate-180" : ""}`} />
          </button>

          {brandOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBrandOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl fin-card p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <div className="px-3 py-1 text-[9px] tracking-[0.12em] uppercase text-[#9D9AB0] border-b border-[#ECEBF3] mb-1">
                  Switch Active Brand
                </div>
                {brands.map((brand) => {
                  const isActive = brand.id === activeBrandId;
                  return (
                    <button
                      key={brand.id}
                      id={`switcher-item-${brand.id}`}
                      onClick={() => {
                        setActiveBrandId(brand.id);
                        setBrandOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isActive ? "fin-badge-accent font-semibold" : "text-[#6B6880] hover:text-[#16151F] hover:bg-[#F0EFF7]"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-[#5B50E3]" />
                        <span>{brand.name}</span>
                      </div>
                      <span className="text-[9px] text-[#9D9AB0]">{brand.domain}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
