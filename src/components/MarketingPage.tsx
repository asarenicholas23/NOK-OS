import React from "react";
import { Check } from "lucide-react";
import { useCms } from "../context/CmsContext";
import { DEFAULT_DEPOSIT_PERCENT, ServicePackage } from "../data/cmsData";
import { clientTestimonials, crumbs, marketingPage as dd, servicePageTestimonial } from "../content/siteContent";
import { SEO } from "./SEO";
import { buildServiceJsonLd, ogImage } from "../lib/seo";
import {
  JsonLd,
  Breadcrumbs,
  BrowserFrame,
  Container,
  CtaBlock,
  FAQAccordion,
  H2,
  ImageSlot,
  Lead,
  PageHero,
  PillButton,
  Reveal,
  ScrollFillText,
  Section,
  SiteShell,
  TestimonialSlot,
  useBooking,
} from "./site";

const StageCard: React.FC<{ s: ServicePackage; n: number }> = ({ s, n }) => {
  const { openBooking } = useBooking();
  return (
    <article className={`flex h-full flex-col rounded-card p-7 ${s.featured ? "bg-site-ink text-site-paper" : "bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`font-mono text-xs ${s.featured ? "text-site-amber" : "text-site-cyanotype"}`}>{dd.stages.label(n)}</p>
        {s.featured && (
          <span className="rounded-full bg-site-amber px-3 py-1 text-[13px] font-semibold text-site-ink">{dd.stages.mostPicked}</span>
        )}
      </div>
      <h3 className={`mt-2 text-[26px] font-semibold leading-tight ${s.featured ? "" : "text-site-ink"}`}>{s.title}</h3>
      <p className={`mt-2 text-base leading-normal ${s.featured ? "text-site-paper/75" : "text-site-slate"}`}>{s.desc}</p>
      <p className="mt-5">
        <span className={`font-mono text-2xl ${s.featured ? "text-site-amber" : "text-site-ink"}`}>{s.ghsPrice}</span>
        <span className={`ml-2 text-[15px] ${s.featured ? "text-site-paper/75" : "text-site-slate"}`}>{s.period}</span>
      </p>
      <ul className="mt-5 space-y-2">
        {s.features.map((f) => (
          <li key={f} className={`flex items-start gap-2 text-[15px] leading-snug ${s.featured ? "text-site-paper/85" : "text-site-graphite"}`}>
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${s.featured ? "text-site-amber" : "text-site-cyanotype"}`} aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <PillButton
          variant={s.featured ? "primary" : "soft"}
          onClick={() => openBooking(s.title)}
          className={s.featured ? "focus-visible:ring-offset-site-ink" : "bg-site-paper! hover:bg-[#ece6d8]!"}
        >
          {dd.stages.discuss(s.title)}
        </PillButton>
      </div>
    </article>
  );
};

export const MarketingPage: React.FC = () => (
  <SiteShell>
    <MarketingContent />
  </SiteShell>
);

const MarketingContent: React.FC = () => {
  const { services, callAvailability } = useCms();
  const stages = services.filter((s) => s.category !== "website");

  return (
    <>
      <SEO title={dd.seo.title} description={dd.seo.description} path="/services/marketing" image={ogImage("marketing")} />
      <JsonLd
        data={buildServiceJsonLd({
          name: "Marketing",
          description: dd.seo.description,
          path: "/services/marketing",
          packages: services.filter((s) => s.category !== "website"),
        })}
      />
      <Breadcrumbs
        currentPath="/services/marketing"
        items={[{ label: crumbs.home, to: "/" }, { label: crumbs.services, to: "/services" }, { label: dd.tag }]}
      />
      <PageHero
        tight
        tag={dd.tag}
        title={dd.title}
        subtitle={dd.subtitle}
        primaryCta={dd.primaryCta}
        secondaryCta={dd.secondaryCta}
        secondaryHref="#stages"
      />

      <Section tone="ink" className="mt-14 sm:mt-16" aria-label="The problem">
        <ScrollFillText text={dd.problem.text} className="max-w-[900px] text-[24px] font-semibold leading-[1.25] sm:text-[34px]" />
      </Section>

      <section id="stages" aria-labelledby="stages-title" className="mt-16 scroll-mt-6 sm:mt-20">
        <Container>
          <H2 id="stages-title">{dd.stages.title}</H2>
          <Lead>{dd.stages.intro}</Lead>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {stages.map((s, i) => (
              <Reveal key={s.id} delay={(i % 2) * 0.08} className="h-full">
                <StageCard s={s} n={i + 1} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="report-title" className="mt-16 sm:mt-20">
        <Container>
          <H2 id="report-title">{dd.report.title}</H2>
          <Lead>{dd.report.body}</Lead>
          <Reveal className="mt-6">
            <figure>
              <BrowserFrame>
                <ImageSlot
                  label="Screenshot: monthly report"
                  src={dd.report.image.src}
                  width={dd.report.image.width}
                  height={dd.report.image.height}
                  alt={dd.report.image.alt}
                  aspect={`${dd.report.image.width} / ${dd.report.image.height}`}
                  tint="blue"
                />
              </BrowserFrame>
              <figcaption className="mt-2 text-[15px] text-site-slate">{dd.report.caption}</figcaption>
            </figure>
          </Reveal>
          {/* Renders nothing on the live site until a real, approved testimonial exists. */}
          <TestimonialSlot
            testimonial={clientTestimonials[servicePageTestimonial.marketing]}
            sample={clientTestimonials[servicePageTestimonial.marketing]?.sample}
            className="mt-6"
          />
        </Container>
      </section>

      <section aria-labelledby="dd-faq-title" className="mt-16 sm:mt-20">
        <Container className="max-w-[860px]">
          <H2 id="dd-faq-title" className="mb-5">
            {dd.faq.title}
          </H2>
          <FAQAccordion items={dd.faq.items(services, DEFAULT_DEPOSIT_PERCENT)} />
        </Container>
      </section>

      <CtaBlock title={dd.cta.title} body={dd.cta.body(callAvailability.slotMinutes)} button={dd.cta.button} />
    </>
  );
};

export default MarketingPage;
