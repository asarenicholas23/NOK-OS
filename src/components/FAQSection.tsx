import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { AgencyInfo, ServicePackage, isWebsiteBuild, DEFAULT_DEPOSIT_PERCENT } from "../data/cmsData";
import { FAQItem } from "../lib/seo";

// Every answer here is derived directly from live agencyInfo/services data —
// no invented pricing, policies, or claims. If the CMS content changes, the
// FAQ updates with it automatically.
export function buildHomeFaqItems(agencyInfo: AgencyInfo, services: ServicePackage[]): FAQItem[] {
  const items: FAQItem[] = [
    {
      question: `What does ${agencyInfo.name} do?`,
      answer: agencyInfo.heroSubtitle,
    },
  ];

  const socialServices = services.filter((s) => !isWebsiteBuild(s));
  const websiteServices = services.filter(isWebsiteBuild);
  const describe = (list: ServicePackage[]) => list.map((s) => `${s.title} (${s.ghsPrice}, ${s.period})`).join("; ");

  if (socialServices.length > 0) {
    items.push({
      question: "What social media services do you offer, and what do they cost?",
      answer: `We offer ${socialServices.length} social & growth services: ${describe(socialServices)}. Final pricing is confirmed in a proposal tailored to your brand.`,
    });

    const periods = new Set(socialServices.map((s) => s.period.toLowerCase()));
    const hasOneTime = [...periods].some((p) => p.includes("one-time") || p.includes("project"));
    const hasOngoing = [...periods].some((p) => p.includes("per month") || p.includes("per campaign"));
    if (hasOneTime && hasOngoing) {
      items.push({
        question: "Do you offer one-time projects, or only ongoing retainers?",
        answer: "Both. Some tiers (like Brand Foundation and Digital Presence Setup) are one-time projects, while others (like the Growth Retainer) are ongoing monthly engagements — pick whichever fits where your brand is right now.",
      });
    }
  }

  if (websiteServices.length > 0) {
    items.push({
      question: "Do I need a monthly social media plan to get a website built?",
      answer: `No. Website and systems builds are a separate, standalone service: ${describe(websiteServices)}. Each build is scoped and priced for your business after a free discovery call.`,
    });
  }

  items.push({
    question: `Where is ${agencyInfo.name} based?`,
    answer: `${agencyInfo.name} is based in ${agencyInfo.address}, Ghana.`,
  });

  items.push({
    question: "How do I get started?",
    answer: `Book a free discovery call using the button on this page, or reach us directly on WhatsApp at ${agencyInfo.whatsapp}. After the call we send you a tailored proposal with a project plan and price, and a ${DEFAULT_DEPOSIT_PERCENT}% deposit accepts it and starts the work.`,
  });

  return items;
}

export const FAQSection: React.FC<{ items: FAQItem[] }> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <section id="faq" className="px-4 sm:px-8 py-20 max-w-4xl mx-auto border-t border-[#1C1C22]">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full neu-pressed text-[#C5A065] text-xs font-mono font-semibold">
          <HelpCircle className="w-3.5 h-3.5 text-[#B08D57]" />
          <span>FAQ</span>
        </div>
        <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F2F0EB] tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="rounded-2xl neu-raised overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer"
              >
                <span className="font-display font-semibold text-sm sm:text-base text-[#F2F0EB]">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#B08D57] shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {/* Always rendered (not conditionally mounted) so the answer
                  is present in the static HTML crawlers see, regardless of
                  which item is visually expanded — keeps this in sync with
                  the FAQPage JSON-LD, which lists every answer. */}
              <div
                className={`px-5 sm:px-6 text-sm text-zinc-200 leading-relaxed ${
                  isOpen ? "pb-5 sm:pb-6" : "sr-only"
                }`}
              >
                {item.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
