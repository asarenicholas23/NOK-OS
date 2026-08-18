import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X, Sun, Moon } from "lucide-react";
import { useBrand } from "../context/BrandContext";

export const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useBrand();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isActive = (path: string) => {
    if (path === "/home" && (location.pathname === "/home" || location.pathname === "/")) return true;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-8 py-4 bg-[#15151A]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-3 sm:p-4 rounded-2xl neu-raised relative">
        {/* Brand Identity */}
        <Link to="/home" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl neu-pressed flex items-center justify-center text-[#B08D57] transition-transform duration-200 group-hover:scale-105">
            <svg width="24" height="24" viewBox="0 0 46 46" aria-hidden="true">
              <circle cx="12" cy="23" r="5" fill="#B08D57" />
              <circle cx="32" cy="11" r="5" fill="currentColor" />
              <circle cx="32" cy="35" r="5" fill="currentColor" />
              <line x1="12" y1="23" x2="32" y2="11" stroke="#B08D57" strokeWidth="2" />
              <line x1="12" y1="23" x2="32" y2="35" stroke="#B08D57" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <span className="font-display font-bold text-lg text-[#F2F0EB] tracking-tight group-hover:text-[#B08D57] transition-colors">
              NOK Social
            </span>
            <span className="block text-[10px] font-mono text-[#C5C3B8] -mt-1 tracking-wider uppercase font-medium">
              Digital Marketing Agency
            </span>
          </div>
        </Link>

        {/* Desktop Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-2 p-1.5 rounded-xl neu-pressed">
          <Link
            to="/home"
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              isActive("/home")
                ? "neu-pressed text-[#C5A065] font-semibold"
                : "text-zinc-200 hover:text-[#F2F0EB]"
            }`}
          >
            Agency Home
          </Link>
          <a
            href="/home#brands-worked-with"
            className="px-4 py-2 text-xs font-medium text-zinc-200 hover:text-[#F2F0EB] transition-colors"
          >
            Client Brands
          </a>
          <a
            href="/home#services"
            className="px-4 py-2 text-xs font-medium text-zinc-200 hover:text-[#F2F0EB] transition-colors"
          >
            Services
          </a>
          <Link
            to="/blog"
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              isActive("/blog")
                ? "neu-pressed text-[#C5A065] font-semibold"
                : "text-zinc-200 hover:text-[#F2F0EB]"
            }`}
          >
            Blog
          </Link>
          <Link
            to="/resources"
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              isActive("/resources")
                ? "neu-pressed text-[#C5A065] font-semibold"
                : "text-zinc-200 hover:text-[#F2F0EB]"
            }`}
          >
            Free Resources
          </Link>
        </nav>

        {/* Right Action buttons & Theme Switcher */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Day / Night Mode Switcher */}
          <button
            id="theme-switcher-desktop"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl neu-raised text-zinc-200 hover:text-[#B08D57] transition-all flex items-center space-x-2 cursor-pointer group"
            title={theme === "dark" ? "Switch to Day Mode (Light Cream)" : "Switch to Night Mode (Dark/Black)"}
            aria-label={theme === "dark" ? "Switch to Day Mode" : "Switch to Night Mode"}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-[#C5A065] group-hover:rotate-45 transition-transform duration-300" />
                <span className="text-[11px] font-mono font-medium hidden lg:inline">Day Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#8C6428] group-hover:-rotate-12 transition-transform duration-300" />
                <span className="text-[11px] font-mono font-medium hidden lg:inline">Night Mode</span>
              </>
            )}
          </button>

          <a
            href="/home#services"
            className="neu-gold-btn px-4 py-2.5 rounded-xl text-xs font-semibold font-mono flex items-center space-x-2"
          >
            <span>Our Services</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile Toggle & Theme Buttons */}
        <div className="md:hidden flex items-center space-x-2">
          {/* Quick Mobile Theme Switcher */}
          <button
            id="theme-switcher-mobile-quick"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl neu-raised text-zinc-200 hover:text-[#B08D57] cursor-pointer"
            aria-label={theme === "dark" ? "Switch to Day Mode" : "Switch to Night Mode"}
            title={theme === "dark" ? "Switch to Day Mode" : "Switch to Night Mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-[#C5A065]" />
            ) : (
              <Moon className="w-4 h-4 text-[#8C6428]" />
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl neu-raised text-zinc-200 hover:text-[#F2F0EB] cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#B08D57]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-3 p-4 rounded-2xl neu-raised-lg bg-[#15151A] z-50 border border-[#1C1C22] space-y-3 md:hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <Link
              to="/home"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-xs font-medium ${
                isActive("/home") ? "neu-pressed text-[#C5A065] font-semibold" : "text-zinc-200 hover:text-[#F2F0EB]"
              }`}
            >
              Agency Home
            </Link>
            <a
              href="/home#brands-worked-with"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-200 hover:text-[#F2F0EB]"
            >
              Brands We've Worked With
            </a>
            <a
              href="/home#services"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-200 hover:text-[#F2F0EB]"
            >
              Services & Packages
            </a>
            <Link
              to="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-xs font-medium ${
                isActive("/blog") ? "neu-pressed text-[#C5A065] font-semibold" : "text-zinc-200 hover:text-[#F2F0EB]"
              }`}
            >
              Strategy Blog
            </Link>
            <Link
              to="/resources"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-xs font-medium ${
                isActive("/resources") ? "neu-pressed text-[#C5A065] font-semibold" : "text-zinc-200 hover:text-[#F2F0EB]"
              }`}
            >
              Free Resources
            </Link>

            {/* Mobile Theme Toggle Pill inside menu */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl neu-pressed text-xs font-mono font-medium text-[#F2F0EB] cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                {theme === "dark" ? <Sun className="w-4 h-4 text-[#C5A065]" /> : <Moon className="w-4 h-4 text-[#8C6428]" />}
                <span>Appearance: {theme === "dark" ? "Night Mode" : "Day Mode (Cream)"}</span>
              </span>
              <span className="text-[10px] text-[#B08D57] font-bold uppercase">
                {theme === "dark" ? "Switch to Day" : "Switch to Night"}
              </span>
            </button>

            <div className="pt-2 border-t border-white/5">
              <a
                href="/home#services"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl neu-gold-filled text-xs font-bold font-mono flex items-center justify-center space-x-2"
              >
                <span>View Our Services</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

