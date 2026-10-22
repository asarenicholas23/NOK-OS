/**
 * DEV ONLY: component preview for the redesign (/dev/components).
 * Only routed when running `npm run dev`; excluded from production builds.
 * Everything here is sample content for checking the components. It is not
 * site copy and none of the numbers are real.
 */
import React from "react";
import { AppWindow, BadgeCheck, Check, Smartphone, TrendingUp } from "lucide-react";
import { SEO } from "../SEO";
import {
  BrowserFrame,
  Card,
  FAQAccordion,
  FloatingStat,
  Highlight,
  ImageSlot,
  PhoneFrame,
  PillButton,
  Reveal,
  ScrollFillText,
  Section,
  SiteShell,
  StepPanel,
  TestimonialSlot,
  useBooking,
} from ".";

const SWATCHES = [
  { name: "site-ink", hex: "#14213D", cls: "bg-site-ink text-site-paper", note: "Paper text 14.2:1" },
  { name: "site-cyanotype", hex: "#2E5EAA", cls: "bg-site-cyanotype text-white", note: "On paper 5.6:1 · not on ink" },
  { name: "site-paper", hex: "#F5F1E8", cls: "bg-site-paper text-site-ink ring-1 ring-black/5", note: "Page background" },
  { name: "site-slate", hex: "#5B6270", cls: "bg-site-slate text-white", note: "On paper 5.4:1" },
  { name: "site-amber", hex: "#E8A33D", cls: "bg-site-amber text-site-ink", note: "Fill only on paper" },
  { name: "site-graphite", hex: "#14171A", cls: "bg-site-graphite text-site-paper", note: "Body text 16:1" },
];

const SAMPLE_STEPS = [
  { title: "Sample step one", desc: "Sample description for the first step. Real steps arrive in Phase 2." },
  { title: "Sample step two", desc: "Click a step, use the arrow keys, or wait: it advances on its own until you pick one." },
  { title: "Sample step three", desc: "On phones this becomes an accordion." },
  { title: "Sample step four", desc: "The amber bar shows progress through the steps." },
  { title: "Sample step five", desc: "With reduced motion on, nothing advances or animates." },
];

const SAMPLE_FAQ = [
  { question: "Sample question one?", answer: "Sample answer. Real FAQ content is split per page in Phase 6." },
  { question: "Sample question two?", answer: "Answers stay in the page while closed, so they match the FAQ structured data." },
  { question: "Sample question three?", answer: "Tab to a question and press Enter or Space to open it." },
];

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-4 mt-16 text-[34px] font-bold leading-tight text-site-ink">{children}</h2>
);
const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4 font-mono text-xs text-site-slate">{children}</p>
);

const BookingDemo: React.FC = () => {
  const { openBooking } = useBooking();
  return (
    <PillButton variant="primary" size="lg" onClick={() => openBooking()}>
      Opens the booking form
    </PillButton>
  );
};

export const DevPreviewPage: React.FC = () => (
  <SiteShell>
    <SEO title="Component preview (dev)" description="Dev-only component preview." path="/dev/components" noindex />

    <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
      <header className="pt-12 text-center">
        <p className="font-mono text-xs text-site-cyanotype">Dev only · Phase 1</p>
        <h1 className="mt-2 text-[44px] font-bold leading-[1.02] text-site-ink sm:text-[60px]">
          Component <Highlight>preview</Highlight>
        </h1>
        <p className="mx-auto mt-4 max-w-[600px] text-xl leading-normal text-site-slate">
          Every building block for the new public pages. All content on this page is sample text.
        </p>
      </header>

      <H>Colours</H>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SWATCHES.map((s) => (
          <li key={s.name} className={`rounded-card p-5 ${s.cls}`}>
            <span className="block font-semibold">{s.name}</span>
            <span className="block font-mono text-xs opacity-90">{s.hex}</span>
            <span className="mt-2 block text-sm opacity-90">{s.note}</span>
          </li>
        ))}
      </ul>

      <H>Type</H>
      <Card>
        <p className="text-[60px] font-bold leading-[1.02] text-site-ink">Baloo 2 headline</p>
        <p className="mt-3 text-xl leading-normal text-site-slate">Supporting text in slate, 20px.</p>
        <p className="mt-3 text-base leading-relaxed text-site-graphite">
          Body text in graphite, 16px. Headlines and body both use Baloo 2, in sentence case.
        </p>
        <p className="mt-3 font-mono text-xs text-site-cyanotype">IBM Plex Mono · labels and real numbers only · Step 01</p>
      </Card>

      <H>Buttons</H>
      <div className="flex flex-wrap items-center gap-3">
        <PillButton variant="primary" size="lg">Primary</PillButton>
        <PillButton variant="soft" size="lg">Soft</PillButton>
        <PillButton variant="dark" size="lg">Dark</PillButton>
        <PillButton variant="primary">Primary md</PillButton>
        <PillButton variant="dark" to="/">Link to /home</PillButton>
        <BookingDemo />
      </div>
    </div>

    <H2Wrap>Sections</H2Wrap>
    <Section tone="ink">
      <p className="text-2xl font-semibold">Ink section, rounded (28px).</p>
      <p className="mt-2 text-site-paper/75">Paper text on ink. Amber is the accent here: <span className="text-site-amber">7.4:1</span>.</p>
    </Section>
    <div className="h-4" />
    <Section tone="paper" shape="bleed" className="bg-white">
      <p className="text-2xl font-semibold text-site-ink">Full-bleed section (shown on white so the edge is visible).</p>
    </Section>

    <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
      <H>Scroll-fill text</H>
      <Note>Scroll: words fill in as the block moves up. With reduced motion it shows fully filled.</Note>
    </div>
    <Section tone="ink">
      <ScrollFillText
        className="max-w-[900px] text-[26px] font-semibold leading-tight sm:text-[34px]"
        text="This is sample statement text for checking the scroll-fill effect. Each word starts faded and turns solid as you scroll down the page, and the whole paragraph is solid before it leaves the middle of the screen."
      />
    </Section>

    <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
      <H>Cards, image slots and reveal</H>
      <Note>Cards fade up once as they scroll into view.</Note>
      <div className="grid gap-4 md:grid-cols-2">
        <Reveal>
          <Card media={<ImageSlot label="Photo: sample placeholder" tint="blue" aspect="16 / 8" />}>
            <p className="font-mono text-xs text-site-cyanotype">Sample tag</p>
            <p className="mt-1 text-[26px] font-semibold leading-tight text-site-ink">Card with a media slot</p>
            <p className="mt-2 text-base leading-normal text-site-slate">White card on paper, 24px radius.</p>
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card media={<ImageSlot label="Screenshot: sample placeholder" tint="amber" aspect="16 / 8" icon={<Smartphone className="h-6 w-6" />} />}>
            <p className="font-mono text-xs text-site-cyanotype">Sample tag</p>
            <p className="mt-1 text-[26px] font-semibold leading-tight text-site-ink">Second card, delayed reveal</p>
            <p className="mt-2 text-base leading-normal text-site-slate">The image slot becomes a real image when given a src.</p>
          </Card>
        </Reveal>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(["sand", "blue", "amber", "rose", "teal"] as const).map((t) => (
          <ImageSlot key={t} label={`Tint: ${t}`} tint={t} aspect="1 / 1" />
        ))}
      </div>

      <H>Frames and floating stats</H>
      <Note>The floating cards bob gently (static with reduced motion). Real pages fill them from data only.</Note>
      <div className="relative mx-auto max-w-[960px] pb-16 md:h-[440px] md:pb-0">
        <BrowserFrame className="md:absolute md:left-[4%] md:right-[20%] md:top-2.5">
          <ImageSlot label="Sample: client site screenshot" aspect="16 / 9" icon={<AppWindow className="h-6 w-6" />} />
        </BrowserFrame>
        <div className="mt-4 flex justify-end md:absolute md:right-[4%] md:top-[50px] md:mt-0">
          <PhoneFrame className="w-[190px]">
            <div className="grid grid-cols-3 gap-1">
              {["rose", "teal", "sand", "teal", "sand", "rose", "sand", "rose", "teal"].map((t, i) => (
                <ImageSlot key={i} label="" tint={t as "rose" | "teal" | "sand"} aspect="1 / 1" className="rounded-md!" icon={<span />} />
              ))}
            </div>
            <p className="mt-2 text-center font-mono text-[11px] text-site-slate">Sample grid</p>
          </PhoneFrame>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 md:contents">
          <FloatingStat
            className="md:absolute md:bottom-2.5 md:left-0"
            icon={<TrendingUp className="h-4 w-4" />}
            title="Sample stat"
            titleMono
            detail="Not a real number"
            period={6}
            delay={1}
          />
          <FloatingStat
            className="md:absolute md:bottom-0 md:right-[16%]"
            icon={<Check className="h-4 w-4" />}
            accent="amber"
            title="Sample event"
            detail="GH₵ 0 · sample"
            detailMono
            period={5.5}
            delay={0.5}
          />
        </div>
      </div>

      <H>Step panel</H>
      <Note>Desktop: list drives the panel. Phone width: accordion.</Note>
      <StepPanel steps={SAMPLE_STEPS} />

      <H>Testimonial slot</H>
      <Note>Empty (no real testimonial): renders nothing. Below it is a sample with permission set.</Note>
      <div className="rounded-card border-2 border-dashed border-site-slate/30 p-4 font-mono text-xs text-site-slate">
        ↓ empty slot renders nothing here ↓
        <TestimonialSlot testimonial={null} />
      </div>
      <TestimonialSlot
        className="mt-4"
        testimonial={{ quote: "Sample quote for layout only. Not a real testimonial.", name: "Sample Name", role: "Sample role", permission: true }}
      />

      <H>FAQ accordion</H>
      <FAQAccordion items={SAMPLE_FAQ} jsonLd={false} />
    </div>

    <div className="mx-auto mt-16 max-w-[1120px] px-4 sm:px-6">
      <Section tone="ink" shape="rounded" className="px-0!" innerClassName="text-center">
        <BadgeCheck className="mx-auto h-8 w-8 text-site-amber" aria-hidden="true" />
        <p className="mt-3 text-[40px] font-bold leading-[1.1]">Ink call-to-action block</p>
        <p className="mt-2 text-lg text-site-paper/75">Sample text under the heading.</p>
        <div className="mt-6">
          <BookingDemo />
        </div>
      </Section>
    </div>
  </SiteShell>
);

const H2Wrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
    <H>{children}</H>
  </div>
);

export default DevPreviewPage;
