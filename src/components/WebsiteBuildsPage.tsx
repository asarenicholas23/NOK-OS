import React, { useState, lazy, Suspense } from "react";
import { PhoneCall, Globe, CalendarCheck, ShoppingBag, Workflow } from "lucide-react";
import { useCms } from "../context/CmsContext";
import { isWebsiteBuild } from "../data/cmsData";
import { PublicNavbar } from "./PublicNavbar";
import { PublicFooter } from "./PublicFooter";
import { SEO } from "./SEO";
import { WebsiteBuildsSection } from "./WebsiteBuildsSection";

const DiscoveryModal = lazy(() => import("./DiscoveryModal"));

const BUILD_TYPES = [
  { icon: Globe, title: "Business websites", desc: "A fast, mobile-first site that explains what you do and turns visitors into enquiries." },
  { icon: CalendarCheck, title: "Booking & scheduling", desc: "Let customers pick a time and book you online, without the back-and-forth on WhatsApp." },
  { icon: ShoppingBag, title: "Online ordering", desc: "Product catalogues and order flows that work with how your customers already pay." },
  { icon: Workflow, title: "Client systems", desc: "Proposals, contracts, e-signatures and automatic email/SMS updates for your clients." }
];

export const WebsiteBuildsPage: React.FC = () => {
  const { services } = useCms();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultTier = services.find(isWebsiteBuild)?.title || "Website & Systems Build";
  const [selectedServiceTier, setSelectedServiceTier] = useState(defaultTier);

  const openBooking = (serviceTitle: string) => {
    setSelectedServiceTier(serviceTitle);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#15151A] text-[#F2F0EB] font-sans selection:bg-[#B08D57]/30">
      <SEO
        title="Website & Systems Builds | NOK Social"
        description="Standalone websites, booking systems and online ordering for Ghanaian businesses. No monthly social media plan needed. Free discovery call, tailored proposal, 40% deposit to start."
        path="/website-builds"
      />
      <PublicNavbar />

      <main id="main-content">
        <section className="px-4 sm:px-8 py-16 sm:py-24 max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full neu-pressed text-[#C5A065] text-xs font-mono font-medium">
            Standalone projects · No retainer needed
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.15]">
            Websites and systems built around how your business works
          </h1>
          <p className="text-base sm:text-lg text-zinc-200 leading-relaxed max-w-2xl mx-auto">
            You don't need one of our social media plans to work with us on a build. Tell us what you need on a free call, and we'll send a proposal with a clear plan and price.
          </p>
          <button
            onClick={() => openBooking(defaultTier)}
            className="neu-gold-filled px-6 py-3.5 rounded-xl text-sm font-bold inline-flex items-center space-x-2 cursor-pointer shadow-lg"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Book a Free Discovery Call</span>
          </button>
        </section>

        <section className="px-4 sm:px-8 pb-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BUILD_TYPES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl neu-raised space-y-3">
                <div className="w-10 h-10 rounded-xl neu-pressed flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#B08D57]" />
                </div>
                <h2 className="font-display font-bold text-base">{title}</h2>
                <p className="text-xs text-zinc-200 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <WebsiteBuildsSection onBook={openBooking} />
      </main>

      <PublicFooter />

      {isModalOpen && (
        <Suspense fallback={null}>
          <DiscoveryModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            serviceTier={selectedServiceTier}
            services={services}
          />
        </Suspense>
      )}
    </div>
  );
};

export default WebsiteBuildsPage;
