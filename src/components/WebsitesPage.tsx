import React from "react";
import { CalendarCheck, Check, ClipboardList, FileSpreadsheet, Globe, Mail, ShoppingBag } from "lucide-react";
import { useCms } from "../context/CmsContext";
import { DEFAULT_DEPOSIT_PERCENT } from "../data/cmsData";
import { clientTestimonials, crumbs, flows, servicePageTestimonial, websitesPage as pb } from "../content/siteContent";
import { SEO } from "./SEO";
import { buildServiceJsonLd, ogImage } from "../lib/seo";
import {
  JsonLd,
  Breadcrumbs,
  Card,
  Container,
  CtaBlock,
  FAQAccordion,
  H2,
  Lead,
  PageHero,
  PillButton,
  Reveal,
  ScrollFillText,
  Section,
  SiteShell,
  StatusFlip,
  StepPanel,
  TestimonialSlot,
  useBooking,
  WorkGrid,
} from "./site";

const ICONS = {
  website: { from: <Globe className="h-4 w-4" />, to: <Mail className="h-4 w-4" />, tint: "bg-[#E6EDF7]" },
  booking: { from: <CalendarCheck className="h-4 w-4" />, to: <Check className="h-4 w-4" />, tint: "bg-[#FBEFD9]" },
  ordering: { from: <ShoppingBag className="h-4 w-4" />, to: <Check className="h-4 w-4" />, tint: "bg-[#E7C9C2]" },
  toolkit: { from: <ClipboardList className="h-4 w-4" />, to: <FileSpreadsheet className="h-4 w-4" />, tint: "bg-[#C9DDDA]" },
};

const BuildTypes: React.FC = () => (
  <ul className="mt-6 grid gap-4 sm:grid-cols-2">
    {pb.build.items.map((item, i) => {
      const icons = ICONS[item.key];
      const flow = flows[item.key];
      return (
        <Reveal as="li" key={item.key} delay={(i % 2) * 0.08} className="h-full">
          <Card
            as="article"
            className="h-full"
            media={
              <div className={`flex items-center justify-center rounded-frame ${icons.tint}`} style={{ aspectRatio: "16 / 5" }}>
                <StatusFlip
                  intervalMs={2600 + i * 350}
                  from={{ ...flow.from, icon: icons.from }}
                  to={{ ...flow.to, icon: icons.to }}
                />
              </div>
            }
          >
            <h3 className="text-[22px] font-semibold leading-tight text-site-ink">{item.title}</h3>
            <p className="mt-1.5 text-base leading-normal text-site-slate">{item.desc}</p>
          </Card>
        </Reveal>
      );
    })}
  </ul>
);

const Compare: React.FC = () => {
  const c = pb.compare;
  // Website is the featured option (ink); the business toolkit is the lighter way in.
  const cols = [
    { ...c.website, dark: true },
    { ...c.toolkit, dark: false },
  ];
  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {cols.map((col, i) => (
          <Reveal key={col.label} delay={i * 0.08} className="h-full">
            <article className={`flex h-full flex-col rounded-card p-7 ${col.dark ? "bg-site-ink text-site-paper" : "bg-white"}`}>
              <p className={`font-mono text-xs ${col.dark ? "text-site-amber" : "text-site-cyanotype"}`}>{col.label}</p>
              <h3 className={`mt-1 text-[26px] font-semibold leading-tight ${col.dark ? "" : "text-site-ink"}`}>{col.title}</h3>
              <p className={`mt-1.5 text-lg leading-normal ${col.dark ? "text-site-paper/80" : "text-site-slate"}`}>{col.summary}</p>
              <ul className="mt-5 space-y-2.5">
                {col.points.map((pt, j) => {
                  const lead = pt.endsWith(":");
                  return (
                    <li
                      key={pt}
                      className={`flex items-start gap-2.5 text-base leading-snug ${
                        lead ? "font-semibold" : ""
                      } ${col.dark ? "text-site-paper/90" : "text-site-graphite"}`}
                    >
                      {!lead && (
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${col.dark ? "text-site-amber" : "text-site-cyanotype"}`} aria-hidden="true" />
                      )}
                      {pt}
                    </li>
                  );
                })}
              </ul>
              <p className={`mt-auto pt-6 text-[15px] ${col.dark ? "text-site-paper/75" : "text-site-slate"}`}>{col.bestFor}</p>
            </article>
          </Reveal>
        ))}
      </div>
      <p className="mt-4 text-base text-site-slate">{c.note}</p>
    </>
  );
};

const PriceCard: React.FC = () => {
  const { services } = useCms();
  const { openBooking } = useBooking();
  const build = services.find((s) => s.category === "website");
  if (!build) return null;
  return (
    <Reveal>
      <div className="grid gap-8 rounded-card bg-white p-7 sm:p-9 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-12">
        <div>
          <H2 id="price-title">{pb.price.title}</H2>
          <p className="mt-2 text-lg leading-normal text-site-slate">{pb.price.body}</p>
          <p className="mt-6">
            <span className="font-mono text-[36px] leading-none text-site-ink">{build.ghsPrice}</span>
            <span className="ml-2 text-[15px] text-site-slate">{build.period}</span>
          </p>
          <PillButton variant="dark" size="lg" className="mt-6" onClick={() => openBooking(build.title)}>
            {pb.price.button}
          </PillButton>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-site-ink">{pb.price.includesTitle}</h3>
          <ul className="mt-3 space-y-2.5">
            {build.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-base leading-snug text-site-graphite">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-site-amber text-site-ink">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
};

const WebsitesContent: React.FC = () => {
  const { services, callAvailability } = useCms();
  const buildTitle = services.find((s) => s.category === "website")?.title;

  return (
    <>
      <SEO title={pb.seo.title} description={pb.seo.description} path="/services/websites" image={ogImage("websites")} />
      <JsonLd
        data={buildServiceJsonLd({
          name: "Websites",
          description: pb.seo.description,
          path: "/services/websites",
          packages: services.filter((s) => s.category === "website"),
        })}
      />
      <Breadcrumbs
        currentPath="/services/websites"
        items={[{ label: crumbs.home, to: "/" }, { label: crumbs.services, to: "/services" }, { label: pb.tag }]}
      />
      <PageHero
        tight
        tag={pb.tag}
        title={pb.title}
        subtitle={pb.subtitle}
        primaryCta={pb.primaryCta}
        serviceTitle={buildTitle}
        secondaryCta={pb.secondaryCta}
        secondaryHref="#builds"
      />

      <Section tone="ink" className="mt-14 sm:mt-16" aria-label="The problem">
        <ScrollFillText text={pb.problem.text} className="max-w-[900px] text-[24px] font-semibold leading-[1.25] sm:text-[34px]" />
      </Section>

      <section aria-labelledby="build-title" className="mt-16 sm:mt-20">
        <Container>
          <H2 id="build-title">{pb.build.title}</H2>
          <Lead>{pb.build.intro}</Lead>
          <BuildTypes />
        </Container>
      </section>

      <section aria-labelledby="compare-title" className="mt-16 sm:mt-20">
        <Container>
          <H2 id="compare-title">{pb.compare.title}</H2>
          <Lead>{pb.compare.intro}</Lead>
          <Compare />
        </Container>
      </section>

      <section id="builds" aria-labelledby="builds-title" className="mt-16 scroll-mt-6 sm:mt-20">
        <Container>
          <H2 id="builds-title">{pb.work.title}</H2>
          <Lead>{pb.work.intro}</Lead>
          <WorkGrid className="mt-6" />
        </Container>
      </section>

      <section aria-labelledby="steps-title" className="mt-16 sm:mt-20">
        <Container>
          <H2 id="steps-title">{pb.steps.title}</H2>
          <Lead className="mb-6">{pb.steps.intro}</Lead>
          <StepPanel steps={pb.steps.items(DEFAULT_DEPOSIT_PERCENT)} stepLabel={pb.steps.stepLabel} />
        </Container>
      </section>

      <section aria-labelledby="price-title" className="mt-16 sm:mt-20">
        <Container>
          <PriceCard />
          {/* Renders nothing on the live site until a real, approved testimonial exists. */}
          <TestimonialSlot
            testimonial={clientTestimonials[servicePageTestimonial.websites]}
            sample={clientTestimonials[servicePageTestimonial.websites]?.sample}
            className="mt-6"
          />
        </Container>
      </section>

      <section aria-labelledby="pb-faq-title" className="mt-16 sm:mt-20">
        <Container className="max-w-[860px]">
          <H2 id="pb-faq-title" className="mb-5">
            {pb.faq.title}
          </H2>
          <FAQAccordion items={pb.faq.items(services, DEFAULT_DEPOSIT_PERCENT)} />
        </Container>
      </section>

      <CtaBlock title={pb.cta.title} body={pb.cta.body(callAvailability.slotMinutes)} button={pb.cta.button} serviceTitle={buildTitle} />
    </>
  );
};

export const WebsitesPage: React.FC = () => (
  <SiteShell>
    <WebsitesContent />
  </SiteShell>
);

export default WebsitesPage;
