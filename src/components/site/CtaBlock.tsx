import React from "react";
import { PillButton } from "./PillButton";
import { Section } from "./Section";
import { useBooking } from "./SiteShell";

interface CtaBlockProps {
  title: string;
  body: string;
  button: string;
  /** Preselects this service package in the booking form. */
  serviceTitle?: string;
  className?: string;
}

/** Ink call-to-action block that opens the booking form. */
export const CtaBlock: React.FC<CtaBlockProps> = ({ title, body, button, serviceTitle, className = "mt-16 sm:mt-20" }) => {
  const { openBooking } = useBooking();
  const id = "cta-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
  return (
    <Section tone="ink" className={className} innerClassName="text-center" aria-labelledby={id}>
      <h2 id={id} className="text-[32px] font-bold leading-[1.1] sm:text-[40px]">
        {title}
      </h2>
      <p className="mx-auto mt-2.5 max-w-[560px] text-lg text-site-paper/75">{body}</p>
      <div className="mt-6">
        <PillButton variant="primary" size="lg" onClick={() => openBooking(serviceTitle)} className="focus-visible:ring-offset-site-ink">
          {button}
        </PillButton>
      </div>
    </Section>
  );
};
