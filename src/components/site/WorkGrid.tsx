import React from "react";
import { ArrowUpRight } from "lucide-react";
import { useCms } from "../../context/CmsContext";
import { brandDisplayName, clientTestimonials, home } from "../../content/siteContent";
import { BrowserFrame } from "./Frames";
import { ImageSlot } from "./ImageSlot";
import { Reveal } from "./Reveal";
import { TestimonialSlot } from "./TestimonialSlot";

/**
 * Client sites in browser frames, from the CMS client brands. A swipe row on
 * phones, three columns from md up.
 */
export const WorkGrid: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { clientBrands } = useCms();
  const w = home.work;
  if (clientBrands.length === 0) return null;

  return (
    <ul
      className={`-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scroll-px-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {clientBrands.map((b, i) => {
        const name = brandDisplayName(b);
        const img = w.images[b.slug];
        const what = w.whatWeDid[b.slug] ?? b.tagline;
        return (
          <Reveal as="li" key={b.id} delay={i * 0.08} className="w-[80%] shrink-0 snap-start sm:w-[55%] md:w-auto">
            <article>
              <BrowserFrame className="p-2">
                <ImageSlot
                  label={`Screenshot: ${name} website`}
                  src={img?.src}
                  width={img?.width}
                  height={img?.height}
                  alt={`${name} website`}
                  aspect="16 / 10"
                  tint="sand"
                />
              </BrowserFrame>
              <h3 className="mt-3 text-lg font-semibold text-site-ink">{name}</h3>
              <p className="text-[15px] leading-snug text-site-slate">{what}</p>
              {b.website && (
                <a
                  href={b.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${w.visitLabel}: ${name} (opens in a new tab)`}
                  className="mt-2 inline-flex items-center gap-1 rounded-full text-[15px] font-semibold text-site-cyanotype hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
                >
                  {w.visitLabel}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              <TestimonialSlot
                compact
                testimonial={clientTestimonials[b.slug]}
                sample={clientTestimonials[b.slug]?.sample}
                className="mt-4"
              />
            </article>
          </Reveal>
        );
      })}
    </ul>
  );
};
