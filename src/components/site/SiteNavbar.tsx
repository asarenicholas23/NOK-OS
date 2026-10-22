import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { brand, nav } from "../../content/siteContent";
import { NodeLogo } from "./NodeLogo";
import { PillButton } from "./PillButton";
import { useBooking } from "./SiteShell";
import { DURATION, EASE_SOFT } from "./motion";

const isCurrent = (to: string, pathname: string) => {
  const path = to.split("#")[0];
  if (to.includes("#")) return false; // in-page anchors are never "the current page"
  return pathname === path || pathname.startsWith(path + "/");
};

export const SiteNavbar: React.FC = () => {
  const { pathname } = useLocation();
  const { openBooking } = useBooking();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const book = () => {
    setOpen(false);
    openBooking();
  };

  return (
    <header className="relative z-40 mx-auto max-w-[1120px] px-4 pt-5 sm:px-6">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-full focus:bg-site-ink focus:px-4 focus:py-2 focus:text-site-paper"
      >
        Skip to content
      </a>

      <div className="flex items-center justify-between gap-3">
        <Link
          to="/home"
          className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
        >
          <NodeLogo />
          <span className="text-[19px] font-semibold text-site-ink">{brand.name}</span>
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex gap-1 rounded-full bg-white p-[5px] text-[15px] text-site-ink">
            {nav.links.map((l) => {
              const current = isCurrent(l.to, pathname);
              return (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    aria-current={current ? "page" : undefined}
                    className={`block rounded-full px-3.5 py-1 transition-colors duration-300 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype ${
                      current ? "bg-site-paper font-semibold" : "hover:bg-site-paper/70"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <PillButton variant="dark" onClick={book} className="hidden sm:inline-flex">
            {nav.bookCall}
          </PillButton>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            aria-label={open ? nav.closeMenu : nav.openMenu}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-site-ink cursor-pointer md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="site-mobile-menu"
            aria-label="Main"
            className="absolute left-4 right-4 top-full mt-3 rounded-card bg-white p-3 shadow-[0_24px_48px_-24px_rgba(20,33,61,0.35)] md:hidden"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduce ? 0 : DURATION.fast, ease: EASE_SOFT }}
          >
            <ul className="flex flex-col">
              {nav.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    aria-current={isCurrent(l.to, pathname) ? "page" : undefined}
                    className="block rounded-frame px-4 py-3 text-lg font-medium text-site-ink hover:bg-site-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <PillButton variant="dark" size="lg" onClick={book} className="mt-2 w-full">
              {nav.bookCall}
            </PillButton>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};
