import React from "react";
import { Link } from "react-router-dom";
import { useCms } from "../context/CmsContext";
import { useBrand } from "../context/BrandContext";
import { Mail, Phone, MapPin, Sun, Moon } from "lucide-react";

export const PublicFooter: React.FC = () => {
  const { agencyInfo } = useCms();
  const { theme, setTheme } = useBrand();
  const cleanWhatsapp = agencyInfo.whatsapp.replace(/[^0-9+]/g, "");

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <footer className="px-4 sm:px-8 pt-16 pb-12 max-w-7xl mx-auto border-t border-[#1C1C22]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-white/5">
        {/* Col 1: Brand Info */}
        <div className="space-y-4 md:col-span-1">
          <Link to="/home" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl neu-pressed flex items-center justify-center text-[#B08D57]">
              <svg width="24" height="24" viewBox="0 0 46 46" aria-hidden="true">
                <circle cx="12" cy="23" r="5" fill="#B08D57" />
                <circle cx="32" cy="11" r="currentColor" />
                <circle cx="32" cy="35" r="currentColor" />
                <line x1="12" y1="23" x2="32" y2="11" stroke="#B08D57" strokeWidth="2" />
                <line x1="12" y1="23" x2="32" y2="35" stroke="#B08D57" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <span className="font-display font-bold text-lg text-[#F2F0EB]">
                {agencyInfo.name}
              </span>
              <span className="block text-[10px] font-mono text-[#C5C3B8] -mt-1 tracking-wider uppercase font-medium">
                Digital Marketing Agency
              </span>
            </div>
          </Link>
          <p className="text-xs text-zinc-200 leading-relaxed font-normal">
            Data-driven social media management, sales funnel engineering, and campaign execution for growing brands, startups, and digital businesses.
          </p>
        </div>

        {/* Col 2: Navigation Links */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-[#C5A065] uppercase font-bold tracking-wider">
            Navigation
          </div>
          <ul className="space-y-2 text-xs text-zinc-200">
            <li>
              <Link to="/home" className="hover:text-[#F2F0EB] transition-colors">
                Agency Home
              </Link>
            </li>
            <li>
              <a href="/home#brands-worked-with" className="hover:text-[#F2F0EB] transition-colors">
                Brands We've Worked With
              </a>
            </li>
            <li>
              <a href="/home#services" className="hover:text-[#F2F0EB] transition-colors">
                Our Services & Pricing
              </a>
            </li>
            <li>
              <Link to="/blog" className="hover:text-[#F2F0EB] transition-colors">
                Strategy Blog & Articles
              </Link>
            </li>
            <li>
              <Link to="/ighealthcheck" className="hover:text-[#F2F0EB] transition-colors flex items-center space-x-1.5">
                <span>IG Account Audit Tool</span>
                <span className="text-[9px] font-mono bg-[#B08D57]/20 text-[#C5A065] px-1.5 py-0.2 rounded font-semibold">Soon</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Services Offered */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-[#C5A065] uppercase font-bold tracking-wider">
            Capabilities
          </div>
          <ul className="space-y-2 text-xs text-zinc-200">
            <li>Full-Funnel Social Engine</li>
            <li>Sales Funnel Mastery</li>
            <li>Content & Creative Direction</li>
            <li>Paid Ad Campaign Management</li>
          </ul>
        </div>

        {/* Col 4: Contact & Location */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-[#C5A065] uppercase font-bold tracking-wider">
            Contact Agency
          </div>
          <ul className="space-y-2 text-xs text-zinc-200">
            <li className="flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-[#B08D57] shrink-0" />
              <span>{agencyInfo.address}</span>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className="w-3.5 h-3.5 text-[#B08D57] shrink-0" />
              <a href={`mailto:${agencyInfo.email}`} className="hover:text-[#F2F0EB] truncate">
                {agencyInfo.email}
              </a>
            </li>
            <li className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-[#B08D57] shrink-0" />
              <a 
                href={`https://wa.me/${cleanWhatsapp}`} 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-[#F2F0EB]"
              >
                {agencyInfo.whatsapp} (WhatsApp/Call)
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright & Theme Toggle */}
      <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-200 gap-4">
        <div>
          © {new Date().getFullYear()} {agencyInfo.name} • {agencyInfo.address}. All rights reserved.
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="neu-raised-sm px-2.5 py-1 rounded-lg text-xs flex items-center space-x-1.5 hover:text-[#B08D57] cursor-pointer"
            aria-label="Toggle Day and Night mode"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3 h-3 text-[#C5A065]" />
                <span>Day Mode (Cream)</span>
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 text-[#8C6428]" />
                <span>Night Mode (Dark)</span>
              </>
            )}
          </button>
          <Link to="/home" className="hover:text-[#F2F0EB]">Home</Link>
          <Link to="/blog" className="hover:text-[#F2F0EB]">Blog</Link>
          <Link to="/ighealthcheck" className="hover:text-[#F2F0EB]">Audit</Link>
        </div>
      </div>
    </footer>
  );
};

