import React, { useId, useState } from "react";
import { Plus } from "lucide-react";
import { buildFaqJsonLd, type FAQItem } from "../../lib/seo";

interface FAQAccordionProps {
  items: FAQItem[];
  /** Emit FAQPage JSON-LD for these items. Turn off if the page already outputs it. */
  jsonLd?: boolean;
  /** Index open on first render; null for all closed. */
  defaultOpen?: number | null;
  className?: string;
}

/**
 * Rounded, keyboard-accessible FAQ. Answers stay in the DOM when closed so
 * the visible content always matches the FAQPage structured data.
 */
export const FAQAccordion: React.FC<FAQAccordionProps> = ({ items, jsonLd = true, defaultOpen = null, className = "" }) => {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const baseId = useId();

  if (items.length === 0) return null;

  return (
    <div className={className}>
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(buildFaqJsonLd(items)).replace(/</g, "\\u003c")}</script>
      )}
      <ul className="flex flex-col gap-2.5">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={i} className="rounded-card bg-white">
              <h3>
                <button
                  type="button"
                  id={`${baseId}-q-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`${baseId}-a-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 rounded-card px-6 py-5 text-left text-lg font-semibold text-site-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
                >
                  <span>{item.question}</span>
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-site-paper transition-transform duration-300 ease-soft motion-reduce:transition-none ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
              </h3>
              <div
                id={`${baseId}-a-${i}`}
                role="region"
                aria-labelledby={`${baseId}-q-${i}`}
                className={`grid transition-[grid-template-rows] duration-500 ease-soft motion-reduce:transition-none ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden" inert={!isOpen}>
                  <p className="px-6 pb-6 text-base leading-relaxed text-site-slate">{item.answer}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
