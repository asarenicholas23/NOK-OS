import React from "react";
import { Container } from "./Layout";
import { PillButton } from "./PillButton";
import { Reveal } from "./Reveal";
import { useBooking } from "./SiteShell";

interface PageHeroProps {
  tag?: string;
  title: string;
  subtitle: string;
  primaryCta?: string;
  /** Service package to preselect when the primary button opens the booking form. */
  serviceTitle?: string;
  secondaryCta?: string;
  /** In-page anchor for the secondary button, e.g. "#stages". */
  secondaryHref?: string;
  /** Less top space, for pages with breadcrumbs above the hero. */
  tight?: boolean;
}

/** Top of an inner page: tag, headline, line, and up to two buttons. */
export const PageHero: React.FC<PageHeroProps> = ({ tag, title, subtitle, primaryCta, serviceTitle, secondaryCta, secondaryHref, tight = false }) => {
  const { openBooking } = useBooking();
  return (
    <Container>
      <Reveal as="section" className={`mx-auto max-w-[800px] text-center ${tight ? "pt-6 sm:pt-10" : "pt-12 sm:pt-[72px]"}`}>
        {tag && <p className="font-mono text-xs text-site-cyanotype">{tag}</p>}
        <h1 className="mt-2 text-[36px] font-bold leading-[1.06] text-site-ink sm:text-[54px] sm:leading-[1.04]">{title}</h1>
        <p className="mx-auto mt-[18px] max-w-[620px] text-lg leading-normal text-site-slate sm:text-xl">{subtitle}</p>
        {(primaryCta || secondaryCta) && (
          <div className="mt-[26px] flex flex-wrap justify-center gap-3">
            {primaryCta && (
              <PillButton variant="primary" size="lg" onClick={() => openBooking(serviceTitle)}>
                {primaryCta}
              </PillButton>
            )}
            {secondaryCta && secondaryHref && (
              <PillButton variant="soft" size="lg" href={secondaryHref}>
                {secondaryCta}
              </PillButton>
            )}
          </div>
        )}
      </Reveal>
    </Container>
  );
};
