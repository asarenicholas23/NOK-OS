import React from "react";
import { ArrowUpRight, Check, MessageCircle, TrendingUp } from "lucide-react";
import { useCms } from "../context/CmsContext";
import { DEFAULT_DEPOSIT_PERCENT } from "../data/cmsData";
import { about, contact, home } from "../content/siteContent";
import { buildBusinessJsonLd, ogImage } from "../lib/seo";
import { SEO } from "./SEO";
import {
  BrowserFrame,
  Container,
  CtaBlock,
  FAQAccordion,
  FloatingStat,
  FreeToolCard,
  H2,
  JsonLd,
  Highlight,
  ImageSlot,
  Lead,
  PhoneFrame,
  PillButton,
  Reveal,
  ScrollFillText,
  Section,
  ServiceLineCards,
  SiteShell,
  StepPanel,
  useBooking,
  WorkGrid,
} from "./site";

const Hero: React.FC = () => {
  const { openBooking } = useBooking();
  const h = home.hero;
  const [reach, paid] = h.stats;

  return (
    <>
      <Container>
        <Reveal as="section" className="mx-auto max-w-[760px] pt-12 text-center sm:pt-[72px]">
          <h1 className="text-[38px] font-bold leading-[1.06] text-site-ink sm:text-[60px] sm:leading-[1.02]">
            {h.titleBefore} <Highlight>{h.titleHighlight}</Highlight>
            {h.titleAfter}
          </h1>
          <p className="mx-auto mt-[18px] max-w-[600px] text-lg leading-normal text-site-slate sm:text-xl">{h.subtitle}</p>
          <div className="mt-[26px] flex flex-wrap justify-center gap-3">
            <PillButton variant="primary" size="lg" onClick={() => openBooking()}>
              {h.primaryCta}
            </PillButton>
            <PillButton variant="soft" size="lg" href="#work">
              {h.secondaryCta}
            </PillButton>
          </div>
        </Reveal>
      </Container>

      {/* Collage: client site, Instagram grid, and two real results */}
      <Container>
        <Reveal delay={0.25} className="relative mx-auto mt-10 max-w-[960px] sm:mt-12 sm:h-[460px]">
          <BrowserFrame className="relative mr-[16%] sm:absolute sm:left-[4%] sm:right-[20%] sm:top-2.5 sm:mr-0">
            <ImageSlot
              label="Screenshot: client website"
              src={home.work.images["standout-clothing"].src}
              width={1200}
              height={750}
              alt={h.siteImageAlt}
              aspect="16 / 9"
              objectPosition="top"
              priority
            />
          </BrowserFrame>

          <div className="absolute right-0 top-6 w-[104px] sm:right-[4%] sm:top-[50px] sm:w-[190px]">
            <PhoneFrame className="rounded-[24px] p-1.5 sm:rounded-[32px] sm:p-2.5">
              <img
                src={h.grid.src}
                width={h.grid.width}
                height={h.grid.height}
                alt={h.grid.alt}
                loading="eager"
                decoding="async"
                className="block w-full rounded-md"
              />
              <p className="mt-2 text-center font-mono text-[9px] leading-tight text-site-slate sm:text-[11px]">{h.gridLabel}</p>
            </PhoneFrame>
          </div>

          <div className="mt-4 flex flex-col items-start gap-3 sm:contents">
          <FloatingStat
            className="sm:absolute sm:bottom-2.5 sm:left-0"
            icon={<TrendingUp className="h-4 w-4" />}
            title={reach.title}
            titleMono
            detail={reach.detail}
            period={6}
            delay={1}
          />
          <FloatingStat
            className="self-end sm:absolute sm:bottom-0 sm:right-[16%]"
            icon={<Check className="h-4 w-4" />}
            accent="amber"
            title={paid.title}
            detail={paid.detail}
            period={5.5}
            delay={0.5}
          />
          </div>
        </Reveal>
      </Container>
    </>
  );
};

const Work: React.FC = () => (
  <section id="work" aria-labelledby="work-title" className="mt-16 scroll-mt-6 sm:mt-20">
    <Container>
      <H2 id="work-title">{home.work.title}</H2>
      <Lead>{home.work.intro}</Lead>
      <WorkGrid className="mt-6" />
    </Container>
  </section>
);

const CaseStudy: React.FC = () => {
  const c = home.caseStudy;
  return (
    <Section
      tone="ink"
      className="mt-16 sm:mt-20"
      aria-labelledby="case-title"
      innerClassName="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-6 [scrollbar-width:none] md:grid md:snap-none md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center md:gap-8 md:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      {/* Phones: two slides (story, then the shop) in a swipe row. md+: side by side. */}
      <Reveal className="w-[86%] shrink-0 snap-start md:w-auto">
        <p className="font-mono text-xs text-site-amber">{c.tag}</p>
        <h2 id="case-title" className="mt-2 text-[30px] font-bold leading-[1.08] sm:text-[40px]">
          {c.title}
        </h2>
        <p className="mt-4 max-w-[480px] text-lg leading-normal text-site-paper/75">{c.body}</p>
        <dl className="mt-8 grid max-w-[480px] grid-cols-2 items-start gap-5 sm:gap-6">
          {c.stats.map((st) => (
            <div key={st.label} className="flex flex-col-reverse">
              <dt className="mt-1.5 text-[15px] leading-snug text-site-paper/75">{st.label}</dt>
              <dd className="whitespace-nowrap font-mono text-[28px] leading-none text-site-amber sm:text-[40px]">{st.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-7 max-w-[480px]">
          <div>
            <h3 className="text-[15px] font-semibold text-site-paper">{c.whatWeDidTitle}</h3>
            <ul className="mt-2 space-y-1.5">
              {c.whatWeDid.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[15px] leading-snug text-site-paper/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-site-amber" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <PillButton
          variant="soft"
          href={c.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 focus-visible:ring-offset-site-ink"
        >
          {c.linkLabel}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </PillButton>
      </Reveal>

      <Reveal delay={0.15} className="flex w-[62%] shrink-0 snap-start items-center justify-center md:w-auto">
        <PhoneFrame className="w-full max-w-[230px] bg-[#0c1426] sm:max-w-[260px]">
          <div className="overflow-hidden rounded-[16px]" style={{ aspectRatio: "9 / 16" }}>
            <img
              src="/images/site/case-standout-phone.webp"
              width={520}
              height={1125}
              alt="Standout Clothing's shop on a phone, showing products with prices"
              loading="lazy"
              decoding="async"
              className="block w-full"
            />
          </div>
        </PhoneFrame>
      </Reveal>
    </Section>
  );
};

const HomeContent: React.FC = () => {
  const { services, callAvailability } = useCms();
  const { openBooking } = useBooking();
  const faqItems = home.faq.items(services, DEFAULT_DEPOSIT_PERCENT);

  return (
    <>
      <SEO title={home.seo.title} description={home.seo.description} path="/home" image={ogImage("home")} />
      <JsonLd
        data={buildBusinessJsonLd({
          description: home.seo.description,
          email: contact.email,
          telephone: contact.whatsapp,
          founder: about.founder.name,
        })}
      />

      <Hero />

      <Section tone="ink" className="mt-14 sm:mt-16" aria-label="Why we exist">
        <ScrollFillText
          text={home.problem.text}
          className="max-w-[900px] text-[24px] font-semibold leading-[1.25] sm:text-[34px]"
        />
      </Section>

      <Container className="mt-4">
        <h2 className="sr-only">{home.serviceLines.srTitle}</h2>
        <ServiceLineCards />
      </Container>

      <Work />

      <CaseStudy />

      <section aria-labelledby="how-title" className="mt-16 sm:mt-20">
        <Container>
          <H2 id="how-title">{home.howWeWork.title}</H2>
          <Lead className="mb-6">{home.howWeWork.intro}</Lead>
          <StepPanel steps={home.howWeWork.steps(DEFAULT_DEPOSIT_PERCENT)} stepLabel={home.howWeWork.stepLabel} />
        </Container>
      </section>

      <Container className="mt-16 sm:mt-20">
        <FreeToolCard />
      </Container>

      <section aria-labelledby="faq-title" className="mt-16 sm:mt-20">
        {/* Phones: heading, questions, then the "still have a question" panel.
            md+: heading and panel in the left column, questions on the right. */}
        <Container className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] md:grid-rows-[auto_1fr] md:gap-x-10">
          <H2 id="faq-title" className="md:col-start-1 md:row-start-1">
            {home.faq.title}
          </H2>
          <FAQAccordion items={faqItems} className="mt-1 md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0" />
          <div className="mt-4 self-start rounded-card bg-white p-6 md:col-start-1 md:row-start-2 md:mt-0">
            <p className="text-lg font-semibold text-site-ink">{home.faq.asideTitle}</p>
            <p className="mt-1.5 text-base leading-normal text-site-slate">{home.faq.asideBody}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <PillButton variant="dark" href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {home.faq.asideWhatsapp}
              </PillButton>
              <PillButton variant="soft" onClick={() => openBooking()} className="bg-site-paper! hover:bg-[#ece6d8]!">
                {home.faq.asideBook}
              </PillButton>
            </div>
          </div>
        </Container>
      </section>

      <CtaBlock title={home.cta.title} body={home.cta.body(callAvailability.slotMinutes)} button={home.cta.button} />
    </>
  );
};

export const HomePage: React.FC = () => (
  <SiteShell>
    <HomeContent />
  </SiteShell>
);
