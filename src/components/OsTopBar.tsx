import React, { useEffect, useMemo, useState } from "react";
import { Menu, Search, Sun, Moon, Bell, LogOut, ChevronDown, Building, Trash2, Volume2 } from "lucide-react";
import { useBrand } from "../context/BrandContext";
import { OS_NAV } from "./OsSidebar";

interface OsTopBarProps {
  title: string;
  onMenu: () => void; // toggles the desktop rail / opens the mobile drawer
  onNavigate: (view: string) => void;
}

const ALL_VIEWS = OS_NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })));

export const OsTopBar: React.FC<OsTopBarProps> = ({ title, onMenu, onNavigate }) => {
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
    setTheme,
    user,
    logout
  } = useBrand();

  const [notifOpen, setNotifOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_VIEWS.filter((v) => v.label.toLowerCase().includes(q) || v.group.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const goTo = (id: string) => {
    onNavigate(id);
    setQuery("");
    setSearchOpen(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const email: string = user?.email || "";
  const initials = (user?.displayName || email || "NO")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join("");

  return (
    <header id="global-header" className="fin-topbar sticky top-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6">
      <button onClick={onMenu} className="fin-iconbtn w-9 h-9 shrink-0" aria-label="Toggle navigation">
        <Menu className="w-[18px] h-[18px]" />
      </button>

      <div className="min-w-0 flex items-baseline gap-2 text-sm">
        <span className="font-semibold text-[var(--fin-ink)] truncate">{activeBrand?.name || "NOK OS"}</span>
        <span className="hidden sm:inline text-[var(--fin-faint)]">·</span>
        <span className="hidden sm:inline text-[var(--fin-faint)] truncate">{title}</span>
      </div>

      {/* Jump-to-view search */}
      <div className="relative ml-auto hidden md:block w-56 lg:w-72">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fin-faint)] pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && matches[0]) goTo(matches[0].id);
            if (e.key === "Escape") setQuery("");
          }}
          placeholder="Search the workspace…"
          aria-label="Search the workspace"
          className="fin-input w-full rounded-full pl-10 pr-4 py-2 text-[13px]"
        />
        {searchOpen && matches.length > 0 && (
          <ul className="absolute left-0 right-0 mt-2 fin-card p-1.5 z-50">
            {matches.map((m) => {
              const Icon = m.icon;
              return (
                <li key={m.id}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goTo(m.id)}
                    className="fin-nav-item w-full flex items-center gap-2.5 px-3 py-2 text-[13px] cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[var(--fin-ink)]">{m.label}</span>
                    <span className="ml-auto text-[11px] text-[var(--fin-faint)]">{m.group}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto md:ml-0">
        <span
          className="hidden xl:flex items-center gap-1.5 text-[12px] text-[var(--fin-sub)] px-2"
          title={online ? "Connected: changes sync live" : "Offline: changes will sync when you reconnect"}
        >
          <span className={`w-2 h-2 rounded-full ${online ? "bg-[var(--fin-up)]" : "bg-[var(--fin-warn)]"}`} />
          {online ? "Live" : "Offline"}
        </span>

        {/* Brand switcher */}
        <div className="relative">
          <button
            id="brand-switcher-trigger"
            onClick={() => setBrandOpen(!brandOpen)}
            disabled={loading || brands.length === 0}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full fin-card-sm text-[13px] font-semibold text-[var(--fin-ink)] cursor-pointer disabled:opacity-60"
          >
            <span className="w-6 h-6 rounded-full bg-[var(--fin-accent)] text-[var(--fin-on-accent)] flex items-center justify-center text-[10px] font-bold">
              {activeBrand?.logoText || <Building className="w-3 h-3" />}
            </span>
            <span className="hidden sm:inline max-w-[130px] truncate">{activeBrand ? activeBrand.name : "Select brand"}</span>
            <ChevronDown className={`w-3 h-3 text-[var(--fin-faint)] transition-transform ${brandOpen ? "rotate-180" : ""}`} />
          </button>
          {brandOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBrandOpen(false)} />
              <div className="absolute right-0 mt-2 w-60 fin-card p-2 z-50 space-y-1">
                <div className="px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase text-[var(--fin-faint)]">Switch active brand</div>
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer ${
                        isActive ? "fin-badge-accent font-semibold" : "fin-nav-item"
                      }`}
                    >
                      <span>{brand.name}</span>
                      <span className="text-[10px] text-[var(--fin-faint)]">{brand.domain}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="fin-iconbtn w-9 h-9"
          title={theme === "dark" ? "Switch to Day Mode" : "Switch to Night Mode"}
          aria-label="Toggle colour mode"
        >
          {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            id="notification-bell-trigger"
            onClick={() => setNotifOpen(!notifOpen)}
            className="fin-iconbtn w-9 h-9 relative"
            title="System alerts"
            aria-label="System alerts"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-[var(--fin-accent)] text-[var(--fin-on-accent)] text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 fin-card p-3 z-50">
                <div className="px-1 pb-2 mb-2 flex items-center justify-between border-b border-[var(--fin-line)] text-xs font-semibold">
                  <span className="flex items-center text-[var(--fin-accent-text)]">
                    <Volume2 className="w-3.5 h-3.5 mr-1.5" />
                    System alerts
                  </span>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        clearAllNotifications();
                        setNotifOpen(false);
                      }}
                      className="text-[var(--fin-down)] flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2 fin-scrollbar">
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`p-2.5 rounded-lg text-xs fin-inset ${notif.read ? "opacity-60" : ""}`}>
                      <div className="font-semibold text-[var(--fin-ink)] flex justify-between gap-2">
                        <span className="truncate">{notif.title}</span>
                        <span className="text-[10px] text-[var(--fin-faint)] shrink-0">{notif.timestamp}</span>
                      </div>
                      <p className="text-[var(--fin-sub)] text-[11px] mt-0.5 leading-relaxed">{notif.message}</p>
                      {!notif.read && (
                        <button
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="text-[10px] font-semibold text-[var(--fin-accent-text)] hover:underline mt-1 cursor-pointer"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-6 text-center text-[var(--fin-faint)] text-xs">No system alerts</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <span
          className="w-9 h-9 rounded-full bg-[var(--fin-accent-wash)] text-[var(--fin-accent-text)] text-[12px] font-bold flex items-center justify-center"
          title={email || "Signed in"}
        >
          {initials || "NO"}
        </span>

        <button onClick={() => logout()} className="fin-iconbtn w-9 h-9" title="Sign out" aria-label="Sign out">
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
};

export default OsTopBar;
