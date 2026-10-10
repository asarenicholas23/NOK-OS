import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, PhoneCall, MonitorSmartphone, ArrowRight } from "lucide-react";
import { useCms } from "../context/CmsContext";
import { isWebsiteBuild, DEFAULT_DEPOSIT_PERCENT } from "../data/cmsData";

export const BUILD_STEPS = [
  { title: "Free discovery call", desc: "We learn what your business needs and what the site or system has to do." },
  { title: "Tailored proposal", desc: "You get a project build plan and price, and we adjust it with you until it's right." },
  { title: `${DEFAULT_DEPOSIT_PERCENT}% deposit to start`, desc: "Paying the deposit accepts the proposal and books your build in." },
  { title: "Build & review", desc: "We build in phases and you review each one along the way." },
  { title: "Launch", desc: "The balance is due on delivery, then we hand everything over." }
];

// Website & Systems Builds: a standalone service, separate from the social &
// growth services. Shown on the homepage and on /website-builds.
export const WebsiteBuildsSection: React.FC<{
  onBook: (serviceTitle: string) => void;
  learnMoreLink?: boolean;
}> = ({ onBook, learnMoreLink }) => {
  const { services } = useCms();
  const websiteServices = services.filter(isWebsiteBuild);
  if (websiteServices.length === 0) return null;

  return (
    <section id="website-builds" className="px-4 sm:px-8 py-20 max-w-7xl mx-auto border-t border-[#1C1C22]">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <span className="inline-flex items-center space-x-2 text-xs font-mono text-[#C5A065] uppercase tracking-wider font-semibold">
          <MonitorSmartphone className="w-4 h-4" />
          <span>Separate service</span>
        </span>
        <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F2F0EB] tracking-tight">
          Website & Systems Builds
        </h2>
        <p className="text-sm sm:text-base text-zinc-200">
          Need a website, booking system or online ordering, without a monthly social media plan? We build it as a standalone project, scoped and priced for your business.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {websiteServices.map((service) => (
          <div key={service.id} className="p-6 sm:p-8 rounded-2xl neu-raised border border-[#B08D57]/30 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="font-display font-bold text-xl text-[#F2F0EB]">{service.title}</h3>
              <p className="text-sm text-zinc-200 leading-relaxed">{service.desc}</p>
              <div className="p-3.5 rounded-xl neu-pressed space-y-1">
                <div className="text-xl font-bold font-mono text-[#C5A065]">{service.ghsPrice}</div>
                <div className="text-[10px] font-mono text-zinc-200">Billing: {service.period}</div>
              </div>
              <div className="space-y-2">
                {service.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-start space-x-2 text-xs text-[#F2F0EB]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#B08D57] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => onBook(service.title)}
                className="neu-gold-filled w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Book a Discovery Call About Your Build</span>
              </button>
              {learnMoreLink && (
                <Link
                  to="/website-builds"
                  className="w-full py-2.5 rounded-xl neu-raised text-xs font-semibold text-[#F2F0EB] hover:text-[#B08D57] flex items-center justify-center space-x-2"
                >
                  <span>More about website builds</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#B08D57]" />
                </Link>
              )}
            </div>
          </div>
        ))}

        <div className="p-6 sm:p-8 rounded-2xl neu-pressed space-y-4">
          <h3 className="font-display font-bold text-lg text-[#F2F0EB]">How a build works</h3>
          <ol className="space-y-4">
            {BUILD_STEPS.map((step, i) => (
              <li key={step.title} className="flex items-start space-x-3">
                <span className="w-7 h-7 rounded-lg neu-raised flex items-center justify-center text-[11px] font-mono font-bold text-[#B08D57] shrink-0">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold text-[#F2F0EB]">{step.title}</div>
                  <div className="text-xs text-zinc-300 leading-relaxed">{step.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default WebsiteBuildsSection;
