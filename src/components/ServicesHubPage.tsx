import React from "react";
import { crumbs, servicesHub } from "../content/siteContent";
import { SEO } from "./SEO";
import { ogImage } from "../lib/seo";
import { Breadcrumbs, Container, PageHero, PillButton, Reveal, ServiceLineCards, SiteShell, useBooking } from "./site";

const NotSure: React.FC = () => {
  const { openBooking } = useBooking();
  const n = servicesHub.notSure;
  return (
    <Container className="mt-6">
      <Reveal className="flex flex-col items-start justify-between gap-4 rounded-card bg-white p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <h2 className="text-2xl font-semibold text-site-ink">{n.title}</h2>
          <p className="mt-1 max-w-[560px] text-base leading-normal text-site-slate">{n.body}</p>
        </div>
        <PillButton variant="dark" size="lg" onClick={() => openBooking()}>
          {n.button}
        </PillButton>
      </Reveal>
    </Container>
  );
};

export const ServicesHubPage: React.FC = () => (
  <SiteShell>
    <SEO title={servicesHub.seo.title} description={servicesHub.seo.description} path="/services" image={ogImage("services")} />
    <Breadcrumbs currentPath="/services" items={[{ label: crumbs.home, to: "/" }, { label: crumbs.services }]} />
    <PageHero tight title={servicesHub.title} subtitle={servicesHub.intro} />
    <Container className="mt-12">
      <ServiceLineCards large titleAs="h2" />
    </Container>
    <NotSure />
  </SiteShell>
);

export default ServicesHubPage;
