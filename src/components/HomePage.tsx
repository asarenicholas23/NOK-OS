import React, { useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { PublicFooter } from "./PublicFooter";
import { useCms } from "../context/CmsContext";
import { 
  ArrowRight, 
  PhoneCall, 
  CheckCircle2, 
  MapPin
} from "lucide-react";
import { PublicNavbar } from "./PublicNavbar";
import { ClientBrandsSection } from "./ClientBrandsSection";

// Lazy-load modal to reduce initial main-thread JS parse time
const DiscoveryModal = lazy(() => import("./DiscoveryModal"));

export const HomePage: React.FC = () => {
  const { agencyInfo, services } = useCms();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceTier, setSelectedServiceTier] = useState("Growth Retainer");

  const targetAudience = [
    {
      title: "Startups",
      desc: "Early-stage founders building their first real digital presence",
      img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80"
    },
    {
      title: "Small & Local Businesses",
      desc: "Established retail/service brands needing consistent systems",
      img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80"
    },
    {
      title: "Creative & Independent Brands",
      desc: "Artisans, fashion, photography, and craft-led businesses",
      img: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=600&q=80"
    },
    {
      title: "Growth-Stage Teams",
      desc: "Brands past the startup phase, needing a strategic framework to direct execution",
      img: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-[#15151A] text-[#F2F0EB] font-sans selection:bg-[#B08D57]/30">
      <PublicNavbar />

      {/* Main Page Landmark */}
      <main id="main-content">
        {/* Hero Section */}
        <section className="px-4 sm:px-8 py-16 sm:py-24 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              {/* Location & Status Tag - High Contrast Text */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full neu-pressed text-[#C5A065] text-xs font-mono font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>{agencyInfo.name} • Digital Marketing Agency</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F2F0EB] leading-[1.15]">
                {agencyInfo.heroTitle}
              </h1>

              {/* Subheading - Elevated contrast for WCAG AA+ */}
              <p className="text-base sm:text-lg text-zinc-200 leading-relaxed max-w-2xl font-normal">
                {agencyInfo.heroSubtitle}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="neu-gold-filled px-6 py-3.5 rounded-xl text-sm font-bold flex items-center space-x-2 cursor-pointer shadow-lg"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Book a Discovery Call</span>
                </button>

                <Link
                  to="/blog"
                  className="neu-raised px-6 py-3.5 rounded-xl text-sm font-semibold text-[#F2F0EB] hover:text-[#B08D57] flex items-center space-x-2 transition-all"
                >
                  <span>Read Strategy Blog</span>
                  <ArrowRight className="w-4 h-4 text-[#B08D57]" />
                </Link>
              </div>

              {/* Quick trust metrics */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#1C1C22]">
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-[#F2F0EB]">5 Tiers</div>
                  <div className="text-xs text-zinc-200 mt-0.5">Service Infrastructure</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-[#C5A065]">100%</div>
                  <div className="text-xs text-zinc-200 mt-0.5">Data-Backed Workflows</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-[#F2F0EB]">Direct</div>
                  <div className="text-xs text-zinc-200 mt-0.5">Strategy Support</div>
                </div>
              </div>
            </div>

            {/* Hero Soft-Pressed Graphic Card - Who We Serve */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-3xl neu-raised-lg relative space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div>
                    <h2 className="font-display font-semibold text-base text-[#F2F0EB]">Who We Serve</h2>
                    <p className="text-[11px] font-mono text-zinc-200 mt-0.5">Startups, Local Businesses, Creatives & Growth Teams</p>
                  </div>
                  <span className="bg-[#B08D57]/20 text-[#C5A065] font-mono text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase">
                    TARGET AUDIENCE
                  </span>
                </div>

                {/* Target Audience Image Cards */}
                <div className="space-y-3">

                  <div className="grid grid-cols-2 gap-3">
                    {targetAudience.map((audience, i) => (
                      <div key={i} className="p-3 rounded-xl neu-pressed flex flex-col justify-between space-y-2 group hover:border-[#B08D57]/30 transition-all">
                        <img 
                          src={audience.img} 
                          alt={audience.title} 
                          className="w-full h-20 object-cover rounded-lg neu-pressed bg-[#111115]"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                        <div>
                          <div className="text-xs font-semibold text-[#F2F0EB] leading-tight">{audience.title}</div>
                          <div className="text-[10px] text-zinc-300 mt-1 line-clamp-2 leading-tight">{audience.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brands We've Worked With Section */}
        <ClientBrandsSection />

        {/* Services Section */}
        <section id="services" className="px-4 sm:px-8 py-20 max-w-7xl mx-auto border-t border-[#1C1C22]">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F2F0EB] tracking-tight">
              5-Tier Service Structure
            </h2>
            <p className="text-sm sm:text-base text-zinc-200">
              Structured solutions for every stage of your business — from brand foundation to monthly growth retainers.
            </p>
          </div>

          {/* Pressed Tile Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.map((service, sIdx) => {
              return (
                <div
                  key={service.id}
                  className={`p-6 sm:p-8 rounded-2xl neu-raised flex flex-col justify-between space-y-6 relative group transition-all duration-300 ${
                    service.featured ? "border border-[#B08D57]/40" : ""
                  }`}
                >
                  {service.featured && (
                    <span className="absolute -top-3 right-6 bg-[#B08D57] text-[#15151A] text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full shadow-md">
                      Recommended
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#B08D57] bg-[#15151A] px-3 py-1 rounded-lg neu-pressed">
                        Stage 0{sIdx + 1}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-200 uppercase tracking-wider bg-[#15151A] px-2.5 py-1 rounded-lg neu-pressed">
                        {service.tier}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-lg text-[#F2F0EB] group-hover:text-[#B08D57] transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-xs text-zinc-200 mt-2 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>

                    {/* Pricing Box */}
                    <div className="p-3.5 rounded-xl neu-pressed space-y-1">
                      <div className="text-xl font-bold font-mono text-[#C5A065]">
                        {service.ghsPrice}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-200">
                        Billing: {service.period}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 pt-2">
                      <div className="text-[10px] font-mono text-[#C5A065] uppercase tracking-wider font-semibold">
                        Includes:
                      </div>
                      {service.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start space-x-2 text-xs text-[#F2F0EB]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#B08D57] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedServiceTier(service.title);
                      setIsModalOpen(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl neu-raised-sm hover:neu-pressed text-xs font-bold text-[#F2F0EB] hover:text-[#B08D57] transition-all flex items-center justify-center space-x-2 cursor-pointer border border-[#B08D57]/30"
                  >
                    <span>Select {service.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Free Resources Banner */}
        <section className="px-4 sm:px-8 py-20 max-w-7xl mx-auto">
          <Link
            to="/resources"
            className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-8 sm:p-12 rounded-3xl neu-raised-lg hover:neu-pressed transition-all duration-200"
          >
            <div className="space-y-3">
              <span className="text-xs font-mono text-[#C5A065] uppercase tracking-wider font-semibold">
                Free Tools & Templates
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F2F0EB]">
                Grab our free resources — no strings attached.
              </h2>
              <p className="text-sm text-zinc-200 leading-relaxed max-w-xl">
                Lead trackers, audit checklists, and other tools we use ourselves — free to unlock in seconds.
              </p>
            </div>
            <div className="shrink-0">
              <span className="neu-gold-btn px-5 py-3 rounded-xl text-xs font-bold font-mono inline-flex items-center space-x-2">
                <span>Browse Free Resources</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-8 py-16 max-w-7xl mx-auto border-t border-[#1C1C22]">
          <div className="p-8 sm:p-12 rounded-3xl neu-raised text-center space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F2F0EB]">
              Ready to upgrade your digital presence?
            </h2>
            <p className="text-sm text-zinc-200 max-w-xl mx-auto leading-relaxed">
              Book a 30-minute discovery session with NOK Social. We'll audit your current social channels and outline a step-by-step roadmap.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="neu-gold-filled px-6 py-3.5 rounded-xl text-sm font-bold flex items-center space-x-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Book Discovery Call</span>
              </button>

              <Link
                to="/ighealthcheck"
                className="neu-raised px-6 py-3.5 rounded-xl text-sm font-semibold text-[#F2F0EB] hover:text-[#B08D57] transition-all"
              >
                <span>Get IG Account Audit</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Navigation */}
      <PublicFooter />

      {/* Discovery Call Modal with Suspense Lazy Loading */}
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
