/**
 * All public website copy lives here, grouped by page, so it can be rewritten
 * in one place. Lines marked `// DRAFT` are placeholders waiting for final
 * wording.
 *
 * Contact details and the brand name also live here. They replaced the CMS
 * "Contact & Address Info" tab, and the rest of the app (proposals, booking
 * form, footer) reads them through `useCms().agencyInfo`.
 *
 * Service packages and prices are in `./services.ts`.
 */
import type { ServicePackage } from "../data/cmsData";
import type { FAQItem } from "../lib/seo";
import type { Testimonial } from "../components/site/TestimonialSlot";

export const brand = {
  name: "N.O.K Social",
  descriptor: "Digital Marketing Agency",
};

export const contact = {
  email: "info@noksocial.com",
  whatsapp: "+233235337886",
  address: "Konongo Low Cost, Ghana",
};

export const nav = {
  links: [
    { label: "Work", to: "/#work" },
    { label: "Services", to: "/services" },
    { label: "About", to: "/about" },
    { label: "Blog", to: "/blog" },
  ],
  bookCall: "Book a call",
  openMenu: "Open menu",
  closeMenu: "Close menu",
};

export const footer = {
  // DRAFT
  blurb: "Marketing strategies, campaigns and websites for startups and growing businesses.",
  capabilitiesTitle: "What we do",
  serviceLines: [
    // DRAFT: one-line summaries of the two service lines.
    { name: "Marketing", summary: "Content, social media and ad campaigns", to: "/services/marketing" },
    { name: "Websites", summary: "Websites, booking and online ordering", to: "/services/websites" },
  ],
  pagesTitle: "Pages",
  pages: [
    { label: "Home", to: "/" },
    { label: "Work", to: "/#work" },
    { label: "Services", to: "/services" },
    { label: "About", to: "/about" },
    { label: "Blog", to: "/blog" },
    { label: "Free tools", to: "/resources" },
    { label: "Instagram health check", to: "/ighealthcheck" },
  ],
  contactTitle: "Get in touch",
  whatsappLabel: "WhatsApp",
  emailLabel: "Email",
  rights: "All rights reserved.",
};

/**
 * Two-step flow illustrations on looping cards (StatusFlip). They show how a
 * build behaves, never real figures. DRAFT wording.
 */
export const flows = {
  website: {
    from: { title: "Site live", detail: "Your business, on Google" },
    to: { title: "New enquiry", detail: "From your contact form" },
  },
  booking: {
    from: { title: "New booking request", detail: "Discovery session · Fri, 10:00" },
    to: { title: "Deposit paid", detail: "MoMo · booking confirmed" },
  },
  ordering: {
    from: { title: "Added to cart", detail: "Overshirt, size L" },
    to: { title: "Order paid", detail: "MoMo or card via Paystack" },
  },
  toolkit: {
    from: { title: "Form filled in", detail: "New customer enquiry" },
    to: { title: "Saved to your sheet", detail: "Follow-up reminder set" },
  },
};

/** Discovery-call booking form (the pop-up behind every "Book a call" button). */
export const booking = {
  close: "Close",
  title: "Book a discovery call",
  // DRAFT
  intro: (minutes: number) => `A free ${minutes}-minute call to understand your business. We'll follow up with a tailored proposal.`,
  timeLabel: "Choose a call time",
  timeZoneNote: "Ghana time (GMT)",
  noSlots: "No call times are open right now. Send your details and we'll get in touch to arrange one.",
  selected: "Selected:",
  yourTime: "your time",
  nameLabel: "Your full name",
  namePlaceholder: "e.g. Ama Osei",
  emailLabel: "Email address",
  emailPlaceholder: "e.g. ama@brand.com",
  businessLabel: "Business or brand name",
  businessPlaceholder: "e.g. Osu Vintage Kicks",
  serviceLabel: "Service you're interested in",
  notesLabel: "Your main goal (optional)",
  notesPlaceholder: "Tell us what you'd like more of: followers, orders, bookings…",
  required: "required",
  submit: "Book my discovery call",
  submitting: "Booking…",
  chooseTime: "Choose a time above",
  errors: {
    chooseTime: "Please choose a time for your call.",
    slotTaken: "Sorry, that time was just booked by someone else. Please pick another.",
    timeout:
      "This is taking longer than usual. Your connection may be down. Your booking may still go through once you're back online; if you don't hear from us, message us on WhatsApp.",
    failed: "We couldn't save your booking. Please check your connection and try again, or message us on WhatsApp.",
  },
  whatsappInstead: "Send your details on WhatsApp instead",
  done: {
    titleBooked: "Your call is booked",
    titleRequested: "Request received",
    thanks: "Thank you,",
    bookedFor: "Your call is booked for",
    detailsTo: "We'll send the call details to",
    willReachOut: "We'll get in touch at",
    willReachOutEnd: "to arrange a time for your call.",
    whatsappTitle: "Want a faster reply?",
    whatsappBody: "Message us on WhatsApp and we'll pick it up from there.",
    whatsappButton: "Chat on WhatsApp",
    closeButton: "Close",
  },
  whatsappMessage: {
    booked: `Hello ${brand.name}! I just booked a discovery call on your website.`,
    failed: `Hello ${brand.name}! I tried to book a discovery call on your website but it didn't go through.`,
  },
};

export const home = {
  seo: {
    // DRAFT: page title and meta description for search and link previews.
    // DRAFT (≤60 characters)
    title: "N.O.K Social | Marketing and websites that bring customers",
    // DRAFT
    description:
      // DRAFT: keyword "digital marketing agency in Ghana"
      "N.O.K Social is a digital marketing agency in Ghana. We plan your content, run your ads and build the website behind them, for businesses anywhere.",
  },

  hero: {
    // DRAFT: the brief's headline. `highlight` gets the amber block.
    titleBefore: "Marketing strategies, campaigns and websites that bring you",
    titleHighlight: "customers",
    titleAfter: "",
    // DRAFT
    subtitle:
      "We plan your content, run your ads and build the website behind them. More people find you, and more of them pay.",
    primaryCta: "Book a discovery call",
    secondaryCta: "See our work",
    /**
     * Real figures only. Source: owner, 22 Oct 2026 (Standout Clothing).
     * No client revenue figures, by owner's decision.
     */
    stats: [
      { kind: "reach" as const, title: "20,923 Instagram impressions", detail: "From Standout Clothing's campaigns" },
      { kind: "paid" as const, title: "Paystack checkout live", detail: "MoMo and card on Standout's shop" },
    ],
    siteImageAlt: "Standout Clothing's online shop, built by N.O.K Social",
    gridLabel: "@stand.out23",
    grid: {
      src: "/images/site/hero-standout-instagram.webp",
      width: 540,
      height: 718,
      alt: "Standout Clothing's Instagram grid of posts and promos",
    },
  },

  problem: {
    // DRAFT
    text: "Most of our clients came to us running everything from their phone. Posting when they had time, orders buried in WhatsApp, and no idea what was working. We fix both sides: getting customers in, and making it easy for them to buy.",
  },

  serviceLines: {
    // Hidden heading for screen readers; the cards speak for themselves visually.
    srTitle: "What we do",
    cards: [
      {
        tag: "Marketing",
        // DRAFT
        title: "Content and campaigns that sell",
        // DRAFT
        body: "Planned around your real numbers, so you know which posts and ads bring in money.",
        to: "/services/marketing",
        linkLabel: "How our marketing works",
        imageLabel: "Screenshot: NOK OS analytics",
        image: {
          src: "/images/site/dd-nok-os-analytics.webp",
          width: 1012,
          height: 506,
          alt: "NOK OS analytics: total impressions, average and peak post reach, and an engagement trend chart",
        },
      },
      {
        tag: "Websites",
        // DRAFT
        title: "Websites that take orders and bookings",
        // DRAFT
        body: "Online stores, booking and MoMo checkout, built around how your business runs.",
        to: "/services/websites",
        linkLabel: "How our website builds work",
        imageLabel: "Screenshot: client site on a phone",
      },
    ],
  },

  work: {
    title: "Brands we've worked with",
    // DRAFT
    intro: "A few of the businesses we've built for and run campaigns with.",
    visitLabel: "Visit site",
    /** DRAFT: one line per brand, keyed by CMS slug. Falls back to the CMS tagline. */
    whatWeDid: {
      nkabomworldd: "Online store for handcrafted yarn goods",
      "standout-clothing": "Campaigns and a shop with MoMo and card checkout",
      "vividel-inc": "Website and discovery-call booking for a photography studio",
    } as Record<string, string>,
    /** Screenshots in public/images/site/, keyed by CMS slug. */
    images: {
      nkabomworldd: { src: "/images/site/work-nkabom-site.webp", width: 1200, height: 750 },
      "standout-clothing": { src: "/images/site/work-standout-site.webp", width: 1200, height: 750 },
      "vividel-inc": { src: "/images/site/work-vividel-site.webp", width: 1200, height: 750 },
    } as Record<string, { src: string; width: number; height: number }>,
  },

  caseStudy: {
    tag: "Case study · Standout Clothing",
    // DRAFT
    title: "From campaign reach to paid orders",
    // DRAFT: only what's been confirmed. Add detail in your own words.
    body: "People who found Standout through their campaigns could buy on the spot, in a shop built around how they sell.",
    /** Real figures. Source: owner, 22 Oct 2026 (updated). No client revenue figures, by owner's decision. */
    stats: [
      { value: "20,923", label: "Instagram impressions from their campaigns" },
      { value: "1,075", label: "Visitors to their website" },
    ],
    whatWeDidTitle: "What we did",
    // DRAFT
    whatWeDid: ["Ran their campaigns", "Built their online shop", "Set up MoMo and card checkout with Paystack"],
    linkLabel: "Visit standoutclothing.store",
    href: "https://www.standoutclothing.store",
  },

  howWeWork: {
    title: "How we work with you",
    // DRAFT
    intro: "The same five steps whether you need content, a website, or both.",
    stepLabel: "Step",
    /** DRAFT. `depositPercent` is filled in from DEFAULT_DEPOSIT_PERCENT. */
    steps: (depositPercent: number) => [
      { title: "Free discovery call", desc: "We look at where you are now: your page, your sales, how orders come in." },
      { title: "Tailored proposal", desc: "A clear plan and price for content, a build, or both." },
      { title: "Start with a deposit", desc: `A ${depositPercent}% deposit books your build in. Retainers start from month one.` },
      { title: "Build, post, review", desc: "We build in phases or post on a plan, and check the results with you." },
      { title: "Grow from there", desc: "Monthly reports show what's working, so the next move is clear." },
    ],
  },

  faq: {
    // DRAFT: keyword subheading
    title: "Questions about our digital marketing agency in Ghana",
    // DRAFT
    asideTitle: "Still have a question?",
    // DRAFT
    asideBody: "Message us on WhatsApp, or book a free call and ask us there.",
    asideWhatsapp: "Chat on WhatsApp",
    asideBook: "Book a call",
    /**
     * DRAFT answers. Prices come from src/content/services.ts, so they stay
     * in sync. Questions waiting for answers are in `faqSlots` below.
     */
    items: (services: ServicePackage[], depositPercent: number): FAQItem[] => {
      const social = services.filter((s) => s.category !== "website");
      const builds = services.filter((s) => s.category === "website");
      const list = (l: ServicePackage[]) => l.map((s) => `${s.title} (${s.ghsPrice}, ${s.period.toLowerCase()})`).join("; ");
      return [
        {
          question: "What do your services cost?",
          answer: `Content and campaigns: ${list(social)}. Websites: ${list(builds)}. You get an exact price in a proposal after a free discovery call.`,
        },
        {
          question: "Do you do one-off projects, or only monthly work?",
          answer: (() => {
            // Lowercase only the first letter, so names like "Google" keep their capital.
            const lc = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
            const once = services.filter((s) => /one-time|project/i.test(s.period)).map((s) => lc(s.title));
            const monthly = services.filter((s) => /month/i.test(s.period)).map((s) => lc(s.title));
            const join = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(", ")} and ${l[l.length - 1]}` : l[0] ?? "");
            const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
            return `Both. ${cap(join(once))} are one-off projects. ${cap(join(monthly))} runs month to month, and ad campaigns run for as long as each campaign lasts.`;
          })(),
        },
        {
          question: "Can I get a website without a monthly social media plan?",
          answer: "Yes. Websites and business toolkits are their own service. You can have one without the other, or both.",
        },
        {
          question: "Where are you based?",
          answer: `We're based in ${contact.address}, and we work with businesses anywhere in the world.`,
        },
        {
          question: "How do I get started?",
          answer: `Book a free discovery call on this page, or message us on WhatsApp at ${contact.whatsapp}. After the call we send a proposal with a plan and price. Paying a ${depositPercent}% deposit accepts it and starts the work.`,
        },
        {
          question: "Can I pay in instalments?",
          answer: `Yes. You pay a ${depositPercent}% deposit to start, and the rest when we finish.`,
        },
        ...answeredSlots(faqSlots.home),
      ];
    },
  },

  cta: {
    // DRAFT
    title: "Let's talk about your business",
    /** DRAFT. `minutes` is the call length from the booking settings. */
    body: (minutes: number) => `A free ${minutes}-minute call. You'll leave with a clear next step, whether you hire us or not.`,
    button: "Book a discovery call",
  },
};

/**
 * Public display names for client brands, keyed by the brand's CMS slug.
 * The CMS name stays as the internal name; the site shows these instead.
 * Brands not listed here fall back to their CMS name.
 */
export const clientBrandNames: Record<string, string> = {
  nkabomworldd: "Nkabom World",
  "standout-clothing": "Standout Clothing",
  "vividel-inc": "Vividel",
};

export const brandDisplayName = (b: { slug: string; name: string }) =>
  clientBrandNames[b.slug] ?? b.name;

/* ------------------------------------------------------------------ */
/* Services pages                                                      */
/* ------------------------------------------------------------------ */

const faqBook = (deposit: number) =>
  `Book a free discovery call, or message us on WhatsApp at ${contact.whatsapp}. After the call we send a proposal with a plan and price. Paying a ${deposit}% deposit accepts it and starts the work.`;

/** Breadcrumb labels for inner pages. */
export const crumbs = {
  home: "Home",
  services: "Services",
};

export const servicesHub = {
  seo: {
    // DRAFT
    title: "Our services | N.O.K Social",
    // DRAFT
    description: "Two ways we help businesses grow: marketing (content, social media and ad campaigns) and websites (sites, booking and online ordering).",
  },
  title: "Our services",
  // DRAFT
  intro: "Two ways we help you grow. Get more of the right people to notice you, and make it easy for them to buy. Take one, or both.",
  notSure: {
    // DRAFT
    title: "Not sure which you need?",
    // DRAFT
    body: "Tell us how your business runs today and we'll tell you where to start. The call is free.",
    button: "Book a discovery call",
  },
};

export const marketingPage = {
  seo: {
    // DRAFT
    // DRAFT: keyword "digital marketing agency in Ghana"
    title: "Digital marketing agency in Ghana | N.O.K Social",
    // DRAFT
    description: "Content, social media and ad campaigns planned around your real numbers, so you know which posts and ads bring in money. Four stages, from brand foundation to monthly growth.",
  },
  tag: "Marketing",
  // DRAFT
  title: "Content and campaigns planned around your real numbers",
  // DRAFT
  subtitle: "We plan your content, run your campaigns and report on what's working, so every month's plan is better than the last.",
  primaryCta: "Book a discovery call",
  secondaryCta: "See the four stages",
  problem: {
    // DRAFT
    text: "Posting every day and still not sure what's working? Most businesses post when they can, boost whatever looks good and hope. We start from your numbers instead: who's seeing your posts, who's clicking, and who's buying.",
  },
  stages: {
    title: "Four stages. Start where you are.",
    // DRAFT
    intro: "Most businesses start with brand setup, then move to monthly marketing. Ad campaigns can run at any point.",
    mostPicked: "Most picked",
    label: (n: number) => `Stage ${String(n).padStart(2, "0")}`,
    discuss: (title: string) => `Talk about ${title}`,
  },
  report: {
    // DRAFT
    title: "See what's working, every month",
    // DRAFT
    body: "Your numbers live in NOK OS, the system we built to run client content. Each month you see your reach, engagement and best posts, and we use them to plan the next month.",
    image: {
      src: "/images/site/dd-report.webp",
      width: 1512,
      height: 487,
      alt: "A NOK OS analytics view: total impressions, average and peak post reach, top channel, and audience share by platform",
    },
    // DRAFT
    caption: "A live analytics view in NOK OS.",
  },
  faq: {
    // DRAFT: keyword subheading
    title: "Choosing a digital marketing agency in Ghana: your questions",
    items: (services: ServicePackage[], deposit: number): FAQItem[] => {
      const social = services.filter((s) => s.category !== "website");
      return [
        {
          question: "How much does your marketing cost?",
          answer: social.map((s) => `${s.title}: ${s.ghsPrice} (${s.period.toLowerCase()})`).join(". ") + ". You get an exact price in your proposal.",
        },
        {
          question: "Is ad spend included in an ad campaign?",
          answer: "No. Ad spend is paid separately, straight to the platform. Ads management is 15–20% of spend, or GH₵ 300–500 a month.",
        },
        {
          question: "How do I get started?",
          answer: faqBook(deposit),
        },
      ];
    },
  },
  cta: {
    // DRAFT
    title: "Let's look at your numbers together",
    body: (minutes: number) => `A free ${minutes}-minute call. Bring your page and we'll show you what we'd change first.`,
    button: "Book a discovery call",
  },
};

export const websitesPage = {
  seo: {
    // DRAFT
    // DRAFT: keyword "website developers in Ghana"
    title: "Website developers in Ghana | N.O.K Social",
    // DRAFT
    // DRAFT: keyword "website developers in Ghana"
    description: "Website developers in Ghana. We build custom sites that take bookings, orders and MoMo or card payments, and collect your customer data.",
  },
  tag: "Websites",
  // DRAFT
  title: "A website at the heart of your business",
  // DRAFT
  subtitle: "Stop losing customers in your DMs. We build websites that take bookings, orders and payments, and show you who your customers are. Not ready for a full site? Start with a business toolkit.",
  primaryCta: "Book a discovery call",
  secondaryCta: "See our builds",
  problem: {
    // DRAFT
    text: "Orders come in through DMs, WhatsApp and calls. Some get answered late, some get lost, and it's hard to tell who has paid. A good website answers, books and takes payment for you, and remembers every customer, even while you sleep.",
  },
  build: {
    // DRAFT: keyword subheading
    title: "What we build as website developers in Ghana",
    // DRAFT
    intro: "One project or a mix. Every build is scoped to what your business actually needs.",
    // Carried over from the current website-builds page.
    items: [
      { key: "website" as const, title: "Business websites", desc: "A fast, mobile-first site that turns visitors into customers and shows you who they are." },
      { key: "booking" as const, title: "Booking and scheduling", desc: "Let customers pick a time and book you online, without the back-and-forth on WhatsApp." },
      { key: "ordering" as const, title: "Online ordering", desc: "Product catalogues and order flows that work with how your customers already pay." },
      { key: "toolkit" as const, title: "Business toolkits", desc: "Affordable automations built with tools like Google Sheets, Forms and Apps Script. They take repetitive tasks off your hands and start capturing customer data." },
    ],
  },
  compare: {
    // DRAFT
    title: "Two ways to stop running your business from memory",
    // DRAFT
    intro: "Start where your budget is. Both options put your customer data to work.",
    /** The main, featured option. */
    website: {
      label: "Website",
      // DRAFT
      title: "The heart of your business online",
      // DRAFT
      summary: "More than a page to show your products. Your website collects the data that helps you reach the right customers, build better products and keep people coming back.",
      // DRAFT: points after "Found on Google" filled in from your notes (message was cut off).
      points: [
        "Pages for your business, products and prices",
        "Found on Google",
        "Bookings, orders and payments with MoMo and card",
        "Automatic email and SMS updates",
        "A dashboard showing who your customers are and what they do",
      ],
      // DRAFT
      bestFor: "What's included depends on the scope of your build.",
    },
    /** The affordable route in: the business toolkit. */
    toolkit: {
      label: "Business toolkit",
      // DRAFT
      title: "An affordable first step",
      // DRAFT
      summary: "Not ready for a full website yet? We automate some of your tasks and start capturing your customer data, using tools that fit your business and budget.",
      // DRAFT
      points: [
        "Built with tools like Google Sheets, Forms and Apps Script, or no-code tools",
        "Takes repetitive tasks off your hands",
        "Starts collecting your customer data now",
        "Move up to a full website later and keep your data",
      ],
      // DRAFT
      bestFor: "Example: our Leads Management Tracker. A first step, not a lesser product.",
    },
    // DRAFT
    note: "Not sure which you need? We'll work it out with you on the discovery call.",
  },

  work: {
    title: "Builds we've shipped",
    // DRAFT
    intro: "Live sites for real businesses. Click through and try them.",
  },
  steps: {
    title: "How a build works",
    // DRAFT
    intro: "Five steps, and you see the work at every stage.",
    stepLabel: "Step",
    // Carried over from the current website-builds page.
    items: (deposit: number) => [
      { title: "Free discovery call", desc: "We learn what your business needs and what your website or toolkit has to do." },
      { title: "Tailored proposal", desc: "You get a build plan and price, and we adjust it with you until it's right." },
      { title: `${deposit}% deposit to start`, desc: "Paying the deposit accepts the proposal and books your build in." },
      { title: "Build and review", desc: "We build in phases and you review each one along the way." },
      { title: "Launch", desc: "The balance is due on delivery, then we hand everything over." },
    ],
  },
  price: {
    title: "What it costs",
    // DRAFT
    body: "Every build is priced for your business after a discovery call. This is where projects start.",
    includesTitle: "A build can include",
    button: "Talk about your build",
  },
  faq: {
    title: "Questions about builds",
    items: (services: ServicePackage[], deposit: number): FAQItem[] => {
      const build = services.find((s) => s.category === "website");
      return [
        {
          question: "What's the difference between a website and a business toolkit?",
          answer: "A website is the heart of your business online. It can take bookings, orders and payments with MoMo and card, send automatic email and SMS updates, and collect data on who your customers are. A business toolkit is the affordable first step: we automate some of your tasks and start capturing customer data with tools like Google Sheets, Forms and Apps Script. You can move up to a full website later and keep your data.",
        },
        {
          question: "How much does a website or business toolkit cost?",
          answer: `Websites start from ${build?.ghsPrice.replace("+", "") ?? "GH₵ 3,500"}. Business toolkits cost less. Both are priced per project after a free discovery call.`,
        },
        {
          question: "How does payment work?",
          answer: `A ${deposit}% deposit accepts your proposal and books your build in. The balance is due on delivery, and then we hand everything over.`,
        },
        {
          question: "Do I need a monthly social media plan to get a website?",
          answer: "No. Builds are their own service. You can have one without the other, or both.",
        },
        {
          question: "Will I see the site before it launches?",
          answer: "Yes. We build in phases and you review each one along the way.",
        },
        ...answeredSlots(faqSlots.websites),
      ];
    },
  },
  cta: {
    // DRAFT
    title: "Tell us how orders come in today",
    body: (minutes: number) => `A free ${minutes}-minute call. We'll map out what to build first and what it would cost.`,
    button: "Book a discovery call",
  },
};

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

export const about = {
  seo: {
    // DRAFT
    title: "About | N.O.K Social",
    // DRAFT
    description: "N.O.K Social is a marketing and web studio founded by Nicholas Osei Kofi Asare. We plan campaigns around real numbers and build the websites that turn attention into sales.",
  },
  crumb: "About",
  tag: "About",
  // DRAFT
  title: "Marketing and websites, built on real numbers",
  // DRAFT
  subtitle: "N.O.K Social is a marketing and web studio based in Ghana, working with clients worldwide. We help startups and businesses get noticed by the right people, and make it easy for those people to buy.",

  founder: {
    name: "Nicholas Osei Kofi Asare",
    role: "Founder",
    photo: {
      label: "Photo: Nicholas",
      src: "/images/site/about-founder.webp" as string | undefined,
      width: 960,
      height: 1200,
      alt: "Nicholas Osei Kofi Asare, founder of N.O.K Social, smiling outdoors in a navy suit",
    },
    /**
     * Founder story, one string per paragraph. In Nicholas's own words.
     * Links use [text](https://url) and open in a new tab.
     */
    story: [
      "Hi, I'm Nicholas Osei Kofi Asare, the \u2018NOK\u2019 behind NOK Social.",
      "I started this agency for one simple reason: I kept seeing founders with amazing products burn out because they didn't have a real marketing strategy. Too often, business owners confuse marketing with just making immediate sales, or they think \u2018digital marketing\u2019 just means throwing posts on social media.",
      "But real digital marketing isn't just about being loud online. It's actual, strategic marketing.",
      "Drawing on my background in data analytics and my hands-on experience from [Tnyou Fitness](https://www.tnyouwellness.com), I build strategies based on facts. Before a single campaign goes live, we dig into the research\u2014audience profiling, market positioning, and finding the exact language needed to reach your customers.",
      "I focus primarily on startups because I want to help you build a rock-solid foundation from day one. I don't believe in shortcuts or sloppy work. If we team up, you get a tested, honest approach designed to automate your marketing so you can get back to what you do best: running your business.",
    ] as string[] | null,
    placeholder:
      "Founder story goes here: 2–3 short paragraphs in your own words. Why you started N.O.K Social, the kind of businesses you work with, and what you want them to walk away with.",
  },

  background: {
    title: "Why data drives the work",
    // DRAFT wording. Degrees confirmed by Nicholas.
    body: [
      "Nicholas has a BSc in International Business and an MSc in Business and Data Analytics. That training shapes how we work: before we change your content or your site, we look at what your numbers are saying.",
      "It's why every plan starts from your reach, clicks and sales, and why monthly reports end with what we'll do differently next month.",
    ],
    photo: {
      src: "/images/site/about-founder-formal.webp",
      width: 960,
      height: 1200,
      alt: "Nicholas Osei Kofi Asare in a navy double-breasted suit, standing by a wooden wall",
    },
  },

  beliefs: {
    title: "How we work",
    // DRAFT wording, drawn from Nicholas's own notes on how he works.
    items: [
      {
        title: "Research comes first",
        desc: "Before a single campaign goes live, we research your market, profile your audience and find the words your customers use, so we know exactly where your brand stands.",
      },
      {
        title: "Strategy, not just posting",
        desc: "Digital marketing is marketing done online, not social media management. We plan the strategy first, and every post and ad follows from it.",
      },
      {
        title: "Data guides every campaign",
        desc: "We track the results of every campaign and use them to shape the next one. Decisions come from what worked, not from guesswork.",
      },
      {
        title: "Solid foundations, no shortcuts",
        desc: "We set up marketing and processes that keep running, so you can focus on growing your business. Every method we use is tested, and we don't cut corners.",
      },
    ],
  },

  nokOs: {
    tag: "NOK OS",
    // DRAFT
    title: "The system behind the work",
    // DRAFT
    body: "We built NOK OS to run client content: calendars, creative briefs, client approvals and analytics in one place. It's how we keep every brand's work on schedule and every decision tied to its numbers.",
    image: {
      src: "/images/site/about-nok-os.webp",
      width: 1540,
      height: 567,
      alt: "NOK OS analytics in dark mode: impressions, reach, an engagement trend and audience share by platform",
    },
  },

  cta: {
    // DRAFT
    title: "Let's talk about your business",
    body: (minutes: number) => `A free ${minutes}-minute call. You'll leave with a clear next step, whether you hire us or not.`,
    button: "Book a discovery call",
  },
};

/* ------------------------------------------------------------------ */
/* Blog                                                                */
/* ------------------------------------------------------------------ */

export const blog = {
  seo: {
    // DRAFT
    // DRAFT (≤60 characters)
    title: "Marketing and website advice for Ghana | N.O.K Social",
    // DRAFT
    description: "Practical guides on social media, campaigns, websites and running a small business, from N.O.K Social.",
  },
  crumb: "Blog",
  title: "Blog",
  // DRAFT
  intro: "Practical guides on social media, campaigns, websites and running your business. Written for business owners.",
  all: "All",
  filterLabel: "Filter by category",
  searchLabel: "Search articles",
  searchPlaceholder: "Search articles…",
  latest: "Latest",
  readArticle: "Read article",
  share: "Share",
  shareArticle: "Share this article",
  copied: "Link copied.",
  copyFailed: "Couldn't copy the link. Please copy it from the address bar.",
  empty: "No articles match that.",
  loading: "Loading articles…",
  reset: "Show all articles",
  notFound: {
    title: "Article not found",
    body: "This article doesn't exist or has moved.",
    back: "Back to the blog",
  },
  article: {
    by: "By",
    foundUseful: "Found this useful?",
    keepReading: "Keep reading",
  },
  /** End-of-article CTA, chosen by the post's category. DRAFT wording. */
  cta: {
    marketing: {
      title: "Want this done for your business?",
      body: "We plan your content and run your campaigns around your real numbers.",
      button: "See how our marketing works",
      to: "/services/marketing",
    },
    websites: {
      title: "Want a site that takes orders and bookings?",
      body: "We build websites around how your business already runs, or a business toolkit to start with.",
      button: "See how our websites work",
      to: "/services/websites",
    },
    business: {
      title: "Not sure where to start?",
      body: "Tell us how your business runs today and we'll tell you what to fix first. The call is free.",
      button: "See our services",
      to: "/services",
    },
    book: "Book a discovery call",
  },
};

/* ------------------------------------------------------------------ */
/* FAQ questions waiting for answers                                   */
/* ------------------------------------------------------------------ */

/**
 * Questions you'll answer yourself. Each one stays hidden (on the page and
 * in the FAQ structured data) until its `answer` is filled in. Once answered,
 * it shows at the end of that page's FAQ.
 */
export const faqSlots: Record<"home" | "websites", FAQItem[]> = {
  home: [],
  websites: [
    {
      question: "Do I own my website and domain?",
      answer: "Yes. Every website is built from scratch for your business. Once it's finished, you own the code, the domain and everything we built for you.",
    },
    {
      question: "How long does a build take?",
      answer: "It depends on the scope of work, but every build takes at least 4 weeks.",
    },
    {
      question: "What happens after my site launches?",
      answer: "The site is yours. If you'd like us to look after it, we offer monthly maintenance for a fee.",
    },
  ],
};

/** Only the slots that have an answer. */
export const answeredSlots = (slots: FAQItem[]) => slots.filter((s) => s.answer.trim() !== "");

/* ------------------------------------------------------------------ */
/* Free tools (Resources, Option A)                                    */
/* ------------------------------------------------------------------ */

/** Tool names and descriptions live in src/data/resourcesData.ts. */
export const freeTools = {
  /** Strip at the top of /blog. DRAFT wording. */
  strip: {
    tag: "Free tools",
    title: "Free tools we use ourselves",
    seeAll: "See all free tools",
    open: "Get it free",
    soon: "In the works",
  },
  /** Card on the homepage. DRAFT wording. */
  homeCard: {
    tag: "Free tool",
    button: "Get it free",
    seeAll: "See all free tools",
  },
  /** The /resources page. DRAFT wording. */
  page: {
    seo: {
      title: "Free tools and templates | N.O.K Social",
      description: "Free tools and templates we use ourselves, for growing a business. Unlock any of them with one quick form.",
    },
    crumb: "Free tools",
    title: "Free tools and templates",
    intro: "Tools we use ourselves. Fill in one short form and every tool unlocks. We add new ones regularly.",
    unlock: "Unlock",
    open: "Open tool",
    waitlist: "Join the waitlist",
    soon: "In the works",
    close: "Close",
  },
  /** The unlock form. DRAFT wording. */
  form: {
    tag: "Free tool",
    title: (t: string) => `Unlock "${t}"`,
    body: "Enter your details once and every future tool unlocks straight away.",
    name: "Your full name",
    namePlaceholder: "e.g. Ama Osei",
    email: "Email address",
    emailPlaceholder: "e.g. ama@brand.com",
    business: "Business or brand name",
    businessPlaceholder: "e.g. Osu Vintage Kicks",
    submit: "Unlock tool",
    submitting: "Unlocking…",
    welcomeBack: "Welcome back. Unlocking your tool…",
    error: "Something went wrong sending your details. Please try again.",
  },
};

/* ------------------------------------------------------------------ */
/* Instagram health check (waitlist)                                   */
/* ------------------------------------------------------------------ */

export const igHealthCheck = {
  seo: {
    // DRAFT
    title: "Instagram health check | N.O.K Social",
    // DRAFT
    description: "A free tool in the works that checks your Instagram bio, grid and engagement. Join the waitlist to hear when it's ready.",
  },
  crumb: "Instagram health check",
  tag: "In the works",
  title: "Instagram health check",
  // DRAFT
  subtitle: "A free tool that checks your Instagram profile: how well your bio turns visitors into customers, how consistent your grid looks, and how steady your engagement is.",
  featuresTitle: "What it will check",
  // DRAFT
  features: [
    { title: "Engagement benchmark", desc: "Compares your likes and comments with similar accounts in your industry." },
    { title: "Bio and link check", desc: "Checks how clearly your bio tells people what to do next, and how easy your link is to use." },
    { title: "Grid consistency score", desc: "Looks at colour, type and visual flow across your grid." },
  ],
  form: {
    // DRAFT
    title: "Get early access",
    // DRAFT
    body: "Join the waitlist and we'll email you when it opens, with a free audit report for your account.",
    handle: "Instagram handle",
    handlePlaceholder: "@yourbrand",
    email: "Email address",
    emailPlaceholder: "you@brand.com",
    submit: "Notify me at launch",
    submitting: "Joining…",
    error: "Something went wrong joining the waitlist. Please try again.",
    doneTitle: "You're on the list",
    done: (email: string, handle: string) => `We'll email ${email} when the health check opens for @${handle}.`,
  },
};

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */

/**
 * Client testimonials, keyed by the brand's CMS slug.
 *
 * `quote`, `name` and `role` stay empty until the client sends their real
 * words. Set `permission: true` only once they've agreed to it being
 * published. Nothing shows on the live site until all of that is in place.
 *
 * `sample` is placeholder wording based on the work we did. It is shown ONLY
 * when running the site locally, clearly marked, so the layout can be
 * reviewed. It never appears on the live site.
 */
export const clientTestimonials: Record<string, Testimonial & { sample: Testimonial }> = {
  nkabomworldd: {
    quote: "",
    name: "",
    role: "",
    permission: false,
    sample: {
      quote: "N.O.K Social built us an online store that shows our handcrafted pieces properly. Customers can browse and order in one place, and the whole process was clear from start to finish.",
      name: "Client name",
      role: "Nkabom World",
      permission: true,
    },
  },
  "standout-clothing": {
    quote: "",
    name: "",
    role: "",
    permission: false,
    sample: {
      quote: "They ran our campaigns and built our shop with MoMo and card checkout. People who see our ads can buy straight away, and we can see which campaigns bring in sales.",
      name: "Client name",
      role: "Standout Clothing",
      permission: true,
    },
  },
  "vividel-inc": {
    quote: "",
    name: "",
    role: "",
    permission: false,
    sample: {
      quote: "Our new website shows our work the way it deserves, and clients can book a discovery call without the back-and-forth. The studio looks more professional because of it.",
      name: "Client name",
      role: "Vividel",
      permission: true,
    },
  },
};

/** Which client's testimonial each service page shows (by CMS slug). */
export const servicePageTestimonial = {
  marketing: "standout-clothing",
  websites: "vividel-inc",
};
