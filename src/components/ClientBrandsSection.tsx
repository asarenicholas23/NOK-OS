import React from "react";
import { useCms } from "../context/CmsContext";
import { ClientBrand } from "../data/cmsData";
import { ExternalLink, Building2, Globe } from "lucide-react";

export const ClientBrandsSection: React.FC = () => {
  const { clientBrands } = useCms();

  // Render authentic SVG or dynamic vector preview based on brand
  const renderBrandLogo = (brand: ClientBrand) => {
    const isNkabom = brand.slug.includes("nkabom");
    const isStandout = brand.slug.includes("standout");
    const isVividel = brand.slug.includes("vividel");

    if (isNkabom) {
      return (
        <div className="w-full h-full flex items-center justify-center p-2">
          <img 
            src="/logos/nkabomworldd.svg" 
            alt="nkabomworldd Logo" 
            className="w-24 h-24 object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105" 
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }

    if (isStandout) {
      return (
        <div className="w-full h-full flex items-center justify-center px-4 py-2">
          <img 
            src="/logos/standout-clothing.svg" 
            alt="standout clothing Logo" 
            className="max-h-20 w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }

    if (isVividel) {
      return (
        <div className="w-full h-full flex items-center justify-center px-4 py-2">
          <img 
            src="/logos/vividel-inc.svg" 
            alt="vividel inc. Logo" 
            className="max-h-16 w-auto max-w-full object-contain filter drop-shadow-[0_0_12px_rgba(27,195,177,0.35)] transition-transform duration-300 group-hover:scale-105" 
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }

    // Fallback for custom added brands
    return (
      <div className="w-full h-full flex items-center justify-center p-3">
        {brand.logoUrl ? (
          <img 
            src={brand.logoUrl} 
            alt={brand.name} 
            className="max-h-20 w-auto max-w-full object-contain" 
            referrerPolicy="no-referrer" 
          />
        ) : (
          <Building2 className="w-10 h-10 text-[#C5A065]" />
        )}
      </div>
    );
  };

  const getWebsiteUrl = (brand: ClientBrand) => {
    if (brand.website) return brand.website;
    if (brand.slug.includes("nkabom")) return "https://nkabomworld-store.web.app";
    if (brand.slug.includes("standout")) return "https://standout-clothing.ai.studio/";
    if (brand.slug.includes("vividel")) return "https://vividel-system.vercel.app/";
    return "#";
  };

  return (
    <section id="brands-worked-with" className="px-4 sm:px-8 py-20 max-w-7xl mx-auto border-t border-[#1C1C22]">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F2F0EB] tracking-tight">
          Brands We've Worked With
        </h2>
        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
          Explore client partner brands and live digital experiences built and supported by NOK Social.
        </p>
      </div>

      {/* Simplified Brand Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {clientBrands.map((brand) => {
          const siteUrl = getWebsiteUrl(brand);
          const hasUrl = siteUrl && siteUrl !== "#";

          return (
            <div
              key={brand.id}
              id={`brand-card-${brand.slug}`}
              className="p-6 sm:p-7 rounded-2xl neu-raised flex flex-col justify-between space-y-6 group transition-all duration-300 hover:border-[#B08D57]/40 border border-transparent"
            >
              <div className="space-y-4">
                {/* Visual Logo Container Box */}
                <div className="h-32 rounded-xl neu-pressed flex items-center justify-center p-3 relative overflow-hidden bg-[#101014]">
                  {renderBrandLogo(brand)}
                </div>

                {/* Brand Name & Short Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold text-[#F2F0EB] group-hover:text-[#B08D57] transition-colors">
                      {brand.name}
                    </h3>
                    {brand.socialHandle && (
                      <span className="text-[11px] font-mono text-zinc-400 bg-[#15151A] px-2.5 py-0.5 rounded neu-pressed">
                        {brand.socialHandle}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed min-h-[44px]">
                    {brand.tagline || brand.overview}
                  </p>
                </div>
              </div>

              {/* Website Link Action */}
              {hasUrl ? (
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl neu-raised-sm hover:neu-pressed text-xs font-bold font-mono text-[#F2F0EB] hover:text-[#B08D57] transition-all flex items-center justify-center space-x-2 cursor-pointer border border-[#B08D57]/30"
                  aria-label={`Visit ${brand.name} website`}
                >
                  <Globe className="w-3.5 h-3.5 text-[#B08D57]" />
                  <span>Visit Website</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#B08D57] ml-0.5" />
                </a>
              ) : (
                <div className="w-full py-3 px-4 rounded-xl neu-pressed text-center text-xs font-mono text-zinc-500">
                  Private Client
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
