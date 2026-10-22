import React from "react";
import { useCms } from "../context/CmsContext";
import { about, crumbs } from "../content/siteContent";
import { SEO } from "./SEO";
import { ogImage } from "../lib/seo";
import { Breadcrumbs, BrowserFrame, Container, CtaBlock, H2, ImageSlot, PageHero, Reveal, Section, SiteShell } from "./site";

/** Renders text with [label](https://url) links as external links. */
const WithLinks: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\[[^\]]+\]\(https?:\/\/[^)\s]+\))/).map((part, i) => {
      const m = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
      return m ? (
        <a
          key={i}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm font-medium text-site-cyanotype underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
        >
          {m[1]}
        </a>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      );
    })}
  </>
);

/**
 * Founder photo + story. Shown on the live site only once the story is
 * written; until then it renders a marked placeholder in local dev only.
 */
const Founder: React.FC = () => {
  const f = about.founder;
  const hasStory = !!f.story && f.story.length > 0;
  if (!hasStory && !import.meta.env.DEV) return null;

  return (
    <section aria-labelledby="founder-title" className="mt-14 sm:mt-16">
      <Container className="grid items-start gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12">
        <Reveal>
          <ImageSlot
            label={f.photo.label}
            src={f.photo.src}
            width={f.photo.width}
            height={f.photo.height}
            alt={f.photo.alt}
            aspect="4 / 5"
            tint="sand"
            priority
            className="rounded-card"
          />
        </Reveal>
        <Reveal delay={0.1}>
          <p className="font-mono text-xs text-site-cyanotype">{f.role}</p>
          <h2 id="founder-title" className="mt-1 text-[30px] font-bold leading-tight text-site-ink sm:text-[36px]">
            {f.name}
          </h2>
          {hasStory ? (
            <div className="mt-4 space-y-4 text-lg leading-relaxed text-site-graphite">
              {f.story!.map((para, i) => (
                <p key={i}>
                  <WithLinks text={para} />
                </p>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-card border-2 border-dashed border-site-cyanotype/40 p-5">
              <p className="font-mono text-xs text-site-cyanotype">Draft · only visible in local dev</p>
              <p className="mt-2 text-base leading-relaxed text-site-slate">{f.placeholder}</p>
            </div>
          )}
        </Reveal>
      </Container>
    </section>
  );
};

const AboutContent: React.FC = () => {
  const { callAvailability } = useCms();

  return (
    <>
      <SEO title={about.seo.title} description={about.seo.description} path="/about" image={ogImage("about")} />
      <Breadcrumbs currentPath="/about" items={[{ label: crumbs.home, to: "/home" }, { label: about.crumb }]} />
      <PageHero tight tag={about.tag} title={about.title} subtitle={about.subtitle} />

      <Founder />

      <section aria-labelledby="background-title" className="mt-16 sm:mt-20">
        <Container className="grid items-center gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-12">
          <div>
            <H2 id="background-title">{about.background.title}</H2>
            <div className="mt-4 space-y-4 text-lg leading-relaxed text-site-graphite">
              {about.background.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
          <Reveal className="mx-auto w-full max-w-[380px] md:max-w-none">
            <ImageSlot
              label="Photo: Nicholas"
              src={about.background.photo.src}
              width={about.background.photo.width}
              height={about.background.photo.height}
              alt={about.background.photo.alt}
              aspect="4 / 5"
              tint="sand"
              className="rounded-card"
            />
          </Reveal>
        </Container>
      </section>

      <section aria-labelledby="beliefs-title" className="mt-16 sm:mt-20">
        <Container>
          <H2 id="beliefs-title">{about.beliefs.title}</H2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {about.beliefs.items.map((b, i) => (
              <Reveal as="li" key={b.title} delay={(i % 2) * 0.08} className="h-full">
                <article className="h-full rounded-card bg-white p-7">
                  <p className="font-mono text-xs text-site-cyanotype">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 text-[22px] font-semibold leading-tight text-site-ink">{b.title}</h3>
                  <p className="mt-2 text-base leading-normal text-site-slate">{b.desc}</p>
                </article>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <Section tone="ink" className="mt-16 sm:mt-20" aria-labelledby="nokos-title">
        <div className="max-w-[640px]">
          <p className="font-mono text-xs text-site-amber">{about.nokOs.tag}</p>
          <h2 id="nokos-title" className="mt-2 text-[30px] font-bold leading-[1.08] sm:text-[40px]">
            {about.nokOs.title}
          </h2>
          <p className="mt-4 text-lg leading-normal text-site-paper/75">{about.nokOs.body}</p>
        </div>
        <Reveal className="mt-8">
          <BrowserFrame className="bg-[#1b1b20]">
            <ImageSlot
              label="Screenshot: NOK OS"
              src={about.nokOs.image.src}
              width={about.nokOs.image.width}
              height={about.nokOs.image.height}
              alt={about.nokOs.image.alt}
              aspect={`${about.nokOs.image.width} / ${about.nokOs.image.height}`}
            />
          </BrowserFrame>
        </Reveal>
      </Section>

      <CtaBlock title={about.cta.title} body={about.cta.body(callAvailability.slotMinutes)} button={about.cta.button} />
    </>
  );
};

export const AboutPage: React.FC = () => (
  <SiteShell>
    <AboutContent />
  </SiteShell>
);

export default AboutPage;
