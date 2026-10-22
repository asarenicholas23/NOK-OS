import React, { Suspense, createContext, lazy, useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { useCms } from "../../context/CmsContext";
import { SiteNavbar } from "./SiteNavbar";
import { SiteFooter } from "./SiteFooter";

const DiscoveryModal = lazy(() => import("../DiscoveryModal"));

interface BookingContextValue {
  /** Opens the discovery-call form, optionally preselecting a service package by title. */
  openBooking: (serviceTitle?: string) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <SiteShell>");
  return ctx;
};

interface SiteShellProps {
  children: React.ReactNode;
  /** Hide the navbar/footer (e.g. for a bare preview). Defaults to showing both. */
  bare?: boolean;
}

/**
 * On page change: scroll to the #section in the URL once it has rendered
 * (e.g. "/#work" from another page), otherwise to the top.
 */
const useScrollOnNavigate = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    let tries = 0;
    const id = decodeURIComponent(hash.slice(1));
    const t = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 20) {
        window.clearInterval(t);
        el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    }, 100);
    return () => window.clearInterval(t);
  }, [pathname, hash]);
};

/**
 * Wraps every redesigned public page: paper background, Baloo 2, the navbar
 * and footer, the booking form, and motion settings that follow the visitor's
 * reduced-motion preference.
 */
export const SiteShell: React.FC<SiteShellProps> = ({ children, bare = false }) => {
  useScrollOnNavigate();
  const { services } = useCms();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [serviceTier, setServiceTier] = useState("");

  const openBooking = useCallback((serviceTitle?: string) => {
    setServiceTier(serviceTitle ?? "");
    setBookingOpen(true);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <BookingContext.Provider value={{ openBooking }}>
        <div className="min-h-screen bg-site-paper font-site text-site-graphite antialiased selection:bg-site-amber/40">
          {!bare && <SiteNavbar />}
          <main id="main">{children}</main>
          {!bare && <SiteFooter />}
        </div>

        {bookingOpen && (
          <Suspense fallback={null}>
            <DiscoveryModal
              isOpen={bookingOpen}
              onClose={() => setBookingOpen(false)}
              serviceTier={serviceTier}
              services={services}
            />
          </Suspense>
        )}
      </BookingContext.Provider>
    </MotionConfig>
  );
};
