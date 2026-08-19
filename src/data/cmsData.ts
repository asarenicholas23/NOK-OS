export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  author: {
    name: string;
    role: string;
  };
  excerpt: string;
  content: string[];
  coverImage?: string;
}

export interface ServicePackage {
  id: string;
  title: string;
  tier: string;
  ghsPrice: string;
  period: string;
  featured?: boolean;
  desc: string;
  features: string[];
}

export interface AgencyInfo {
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  address: string;
  whatsapp: string;
  email: string;
  locationCity: string;
}

export interface DiscoveryRequest {
  id: string;
  name: string;
  email: string;
  businessName: string;
  serviceTier: string;
  notes?: string;
  createdAt: string;
  status: "New" | "Contacted" | "Scheduled" | "Converted" | "Closed";
}

export interface ClientBrand {
  id: string;
  name: string;
  slug: string;
  industry: string;
  tagline: string;
  logoUrl: string;
  accentColor: string;
  bannerColor?: string;
  featured?: boolean;
  servicesProvided: string[];
  deliverables: string[];
  metrics: {
    label: string;
    value: string;
  }[];
  overview: string;
  socialHandle?: string;
  website?: string;
}

export const INITIAL_CLIENT_BRANDS: ClientBrand[] = [
  {
    id: "nkabomworldd",
    name: "nkabomworldd",
    slug: "nkabomworldd",
    industry: "Streetwear & Cultural Apparel",
    tagline: "Unity-driven contemporary fashion and urban storytelling collective.",
    logoUrl: "/logos/nkabomworldd.svg",
    accentColor: "#C1AB76",
    bannerColor: "#18191E",
    featured: true,
    servicesProvided: [
      "Brand Identity & Positioning",
      "Social Content Pillars & Reels",
      "Seasonal Drop Rollouts"
    ],
    deliverables: [
      "Visual Brand Guide & Vector Assets",
      "Monthly Content Calendar & Queues",
      "Drop Announcement Campaign Briefs"
    ],
    metrics: [
      { label: "Community Growth", value: "+140%" },
      { label: "Apparel Drops", value: "4 Sold Out" },
      { label: "IG Reel Reach", value: "85K+ Views" }
    ],
    overview: "Nkabom World ('Nkabom' meaning unity in Twi) combines authentic cultural heritage with contemporary streetwear silhouettes. NOK Social architected an end-to-end content production queue and seasonal drop campaign system.",
    socialHandle: "@nkabomworldd",
    website: "https://nkabomworld-store.web.app"
  },
  {
    id: "standout-clothing",
    name: "standout clothing",
    slug: "standout-clothing",
    industry: "Urban Apparel & Graphic Streetwear",
    tagline: "Bold statement streetwear engineered to stand out in every room.",
    logoUrl: "/logos/standout-clothing.svg",
    accentColor: "#E5242A",
    bannerColor: "#0F1014",
    featured: true,
    servicesProvided: [
      "Growth Retainer & Ad Creatives",
      "WhatsApp Commerce Automation",
      "Influencer Seeding Briefs"
    ],
    deliverables: [
      "High-Conversion Video Ad Briefs",
      "Order Intake Routing via WhatsApp",
      "Lookbook Creative Direction"
    ],
    metrics: [
      { label: "Sales Conversion", value: "+85%" },
      { label: "ROAS (Return on Ad Spend)", value: "3.4x" },
      { label: "Repeat Buyers", value: "42%" }
    ],
    overview: "Standout Clothing delivers high-energy graphic apparel and bold streetwear. NOK Social designed their multi-tiered campaign roadmap, direct-to-consumer sales funnels, and automated WhatsApp order intake workflows.",
    socialHandle: "@standoutclothing",
    website: "https://standout-clothing.ai.studio/"
  },
  {
    id: "vividel-inc",
    name: "vividel inc.",
    slug: "vividel-inc",
    industry: "Digital Tech & Enterprise Media",
    tagline: "Modern technology platforms and scalable digital infrastructure.",
    logoUrl: "/logos/vividel-inc.svg",
    accentColor: "#1BC3B1",
    bannerColor: "#0D181A",
    featured: true,
    servicesProvided: [
      "Digital Presence Setup",
      "B2B Thought Leadership Strategy",
      "Pipeline Intake System"
    ],
    deliverables: [
      "Corporate Media Asset Framework",
      "Lead Magnet Distribution Engine",
      "Multi-Channel Publishing System"
    ],
    metrics: [
      { label: "Pipeline Automation", value: "100%" },
      { label: "Inbound Leads", value: "+210%" },
      { label: "Content Cadence", value: "3x / Week" }
    ],
    overview: "Vividel Inc. specializes in cutting-edge digital enterprise media, tech platforms, and business systems. NOK Social built their structured content architecture and multi-platform publishing cadence.",
    socialHandle: "@vividelinc",
    website: "https://vividel-system.vercel.app/"
  }
];

export const INITIAL_DISCOVERY_REQUESTS: DiscoveryRequest[] = [
  {
    id: "call-101",
    name: "Akua Mensah",
    email: "akua@osuvintage.com",
    businessName: "Osu Vintage & Apparel",
    serviceTier: "Growth Retainer",
    notes: "Looking to scale our Instagram catalog and automate WhatsApp order intake for our Osu boutique.",
    createdAt: "2026-08-07 10:15",
    status: "New"
  },
  {
    id: "call-102",
    name: "Kwame Asante",
    email: "kwame@accraglow.com",
    businessName: "Accra Glow Skincare",
    serviceTier: "Digital Presence Setup",
    notes: "Need Google Business Profile and Instagram/Facebook Shop setup with Mobile Money order flow.",
    createdAt: "2026-08-06 14:30",
    status: "Contacted"
  }
];

export const INITIAL_AGENCY_INFO: AgencyInfo = {
  name: "NOK Social",
  heroTitle: "Building Systems to Transform your Marketing",
  heroSubtitle: "We replace guesswork with structured content engines, data-backed campaign workflows, and high-conversion creative brief systems — tailored for startups, fashion, beauty, artisans, and scaling brands.",
  address: "Konongo Low cost",
  whatsapp: "+233235337886",
  email: "oseikofi0235@gmail.com",
  locationCity: "Digital Marketing Agency"
};

export const INITIAL_SERVICES: ServicePackage[] = [
  {
    id: "brand-foundation",
    title: "Brand Foundation",
    tier: "STAGE 1 · FOUNDATION",
    ghsPrice: "GH¢ 400–600",
    period: "One-time",
    desc: "Audience profiles, brand voice, and visual identity — the starting point for every engagement.",
    features: [
      "Audience & competitor profiles",
      "Brand voice guidelines",
      "Content pillars",
      "Visual brand guide"
    ]
  },
  {
    id: "digital-presence-setup",
    title: "Digital Presence Setup",
    tier: "STAGE 2 · SETUP",
    ghsPrice: "GH¢ 500–800",
    period: "One-time",
    desc: "Get found and get orderable — Google, Instagram/Facebook Shop, and Mobile Money order flow.",
    features: [
      "Google Business Profile",
      "Instagram/Facebook Shop setup",
      "Meta Commerce Manager & catalog",
      "Mobile Money order flow"
    ]
  },
  {
    id: "growth-retainer",
    title: "Growth Retainer",
    tier: "STAGE 3 · ONGOING",
    ghsPrice: "GH¢ 1,200",
    period: "per month",
    featured: true,
    desc: "Analytics-led content and community management, month over month.",
    features: [
      "Content calendar (NOK OS analytics-led)",
      "Scheduled posting",
      "Engagement management",
      "Monthly performance summary"
    ]
  },
  {
    id: "campaign-package",
    title: "Campaign Package",
    tier: "STAGE 4 · CAMPAIGNS",
    ghsPrice: "GH¢ 600–900",
    period: "per campaign (ads spend billed separately)",
    desc: "Focused awareness pushes, backed by data.",
    features: [
      "Analytics-led campaign strategy",
      "Meta ads plan",
      "Ads management: 15–20% of spend or GH¢300–500/mo"
    ]
  },
  {
    id: "custom-infrastructure-build",
    title: "Custom Infrastructure Build",
    tier: "STAGE 5 · CUSTOM",
    ghsPrice: "GH¢ 2,500+",
    period: "Project-based",
    desc: "Bespoke systems for brands that have outgrown manual workflows. Scoped individually.",
    features: [
      "Firebase-backed system architecture",
      "Booking, contracts & e-signature",
      "Transactional email/SMS"
    ]
  }
];

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: "blog-1",
    slug: "customer-journey-mapping-ghana-sales-funnel",
    title: "Customer Journey Mapping: Turning Ghanaian Social Followers into Paying Customers",
    category: "Sales Funnel Mastery",
    date: "August 6, 2026",
    readTime: "6 min read",
    coverImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1000&q=80",
    author: {
      name: "Osei Kofi",
      role: "Lead Strategist, NOK Social"
    },
    excerpt: "Why do most Instagram and TikTok followers in Ghana scroll past your DMs without buying? Discover how mapping top, middle, and bottom-of-funnel customer touchpoints converts attention into Mobile Money sales.",
    content: [
      "In Ghana's bustling digital marketplace — whether you run a fashion boutique in Accra, an artisan workshop in Konongo, or a beauty brand serving clients nationwide — relying solely on random posting rarely leads to consistent sales.",
      "## The Views vs. Sales Fallacy",
      "Many business owners confuse **social media views with customer acquisition**. A video receiving 10,000 views on TikTok or Instagram Reels is meaningless if none of those viewers know how to place an order or trust your brand enough to send Mobile Money.",
      "> **Key Takeaway:** *Attention without direction is just noise.* If your bio lacks a clear link or instant order workflow, 95% of prospective customers will move to a competitor within 10 seconds.",
      "## The 3-Stage Sales Funnel Architecture",
      "To convert passive scrollers into paying buyers, you must map out a clear **3-stage customer journey**:",
      "### 1. Top of Funnel (Awareness)\nCapture attention with high-value, relatable content. Show common pain points, unboxing teasers, or quick problem-solving tips rather than hard selling.",
      "### 2. Middle of Funnel (Consideration)\nBuild trust through **social proof**, client reviews, behind-the-scenes craft videos, and detailed sizing or ingredient guides.",
      "### 3. Bottom of Funnel (Decision)\nRemove friction. Offer clear call-to-actions, transparent pricing, instant WhatsApp ordering links, and simple **Mobile Money checkout instructions**.",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=80",
      "## Key Action Checklist for Ghanaian Brands",
      "- **Add direct pricing** or starting ranges to avoid endless 'Price please?' DM friction.\n- **Pin your WhatsApp ordering link** at the top of your profile.\n- **Highlight customer feedback** in an Instagram Highlight called 'Happy Clients'.\n- **Provide clear MoMo payment numbers** and delivery timelines upfront.",
      "By intentionally guiding prospects through each stage of the sales funnel, you turn your social media accounts into a predictable revenue engine."
    ]
  },
  {
    id: "blog-2",
    slug: "pitfalls-of-diy-social-media-ghana",
    title: "The Pitfalls of DIY Social Media for Small Businesses in Ghana",
    category: "Digital Strategy",
    date: "August 2, 2026",
    readTime: "5 min read",
    coverImage: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1000&q=80",
    author: {
      name: "Osei Kofi",
      role: "Lead Strategist, NOK Social"
    },
    excerpt: "Managing your own graphics, reels, and DMs while running daily operations leads to burnout and inconsistent branding. Here is why structured systems beat DIY hustle.",
    content: [
      "As a small business owner in Ghana, wearing every hat feels necessary in the early stages. You handle inventory sourcing, customer service, packaging, deliveries, and accounting. But when you also try to be a full-time graphic designer, videographer, copywriter, and social media manager, quality inevitably suffers.",
      "## The Dangerous 'DIY Burnout Cycle'",
      "The **DIY trap** usually follows a predictable, stressful pattern:",
      "- **Day 1–3:** You post energetically with custom videos and stories.\n- **Day 4–14:** Operational demands hit hard (delays, stockouts, deliveries), stopping all social posting.\n- **Day 15:** Feeling guilty, you rush out a low-quality flyer with mismatched fonts just to stay active.",
      "> **Warning:** Potential customers who land on a profile with sporadic posts, low-contrast designs, and delayed DM responses often assume the business is inactive or unreliable.",
      "## Transitioning from DIY Hustle to Systems",
      "Shifting from DIY hustle to a **structured marketing system** doesn't require a massive budget. By establishing clear content pillars, batching creative production on specific days, and leveraging automated brief workflows, you maintain professional consistency while focusing on core business growth."
    ]
  },
  {
    id: "blog-3",
    slug: "crafting-lead-magnets-that-convert-ghana",
    title: "Crafting Lead Magnets That Convert: A Guide for Ghanaian Entrepreneurs",
    category: "Content & Sales",
    date: "July 29, 2026",
    readTime: "4 min read",
    coverImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=80",
    author: {
      name: "Osei Kofi",
      role: "Lead Strategist, NOK Social"
    },
    excerpt: "Offering a free guide, WhatsApp catalog preview, or consultation checklist is the single fastest way to collect warm leads in West Africa. Learn how to design high-converting lead magnets.",
    content: [
      "What is a lead magnet? It's a free, high-value piece of content or incentive given to prospective clients in exchange for their contact information — usually a **WhatsApp number or email address**.",
      "## Why WhatsApp Lead Magnets Rule West Africa",
      "In West Africa, **WhatsApp is the undisputed king of business communication**. Collecting warm WhatsApp leads gives you direct access to prospective buyers without relying on algorithm mood swings or shadowbans.",
      "> **Pro Tip:** WhatsApp Broadcast lists and catalog links have up to *80% open rates* in Accra and Kumasi compared to standard 20% email open rates.",
      "## 3 High-Converting Lead Magnet Ideas",
      "1. **The VIP Catalog & Discount Voucher:** Offer an exclusive preview of new inventory or 10% off the first order in exchange for joining your WhatsApp VIP list.\n2. **The Problem-Solving Guide:** A skincare brand can offer a free PDF breakdown on *'5 Steps to Clear Hyperpigmentation Using Natural Ghanaian Ingredients'*.\n3. **The Quick Consultation Checklist:** A service business or event manager can provide a free downloadable budget template or event planning checklist.",
      "When your lead magnet delivers immediate, genuine value, prospects are far more receptive to your future promotional offers."
    ]
  },
  {
    id: "blog-4",
    slug: "building-high-converting-social-media-strategy-accra-kumasi",
    title: "Building a High-Converting Social Media Strategy in Accra and Kumasi",
    category: "Brand Positioning",
    date: "July 20, 2026",
    readTime: "7 min read",
    coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80",
    author: {
      name: "Osei Kofi",
      role: "Lead Strategist, NOK Social"
    },
    excerpt: "From pricing transparency in DMs to local Mobile Money checkout workflows, explore how positioning your brand builds trust and drives repeat orders.",
    content: [
      "The Ghanaian consumer is savvy, discerning, and values authentic relationships. In cities like Accra, Kumasi, and Takoradi, trust is the primary currency driving online transactions.",
      "## 3 Conversion Pillars for West African Brands",
      "1. **Practice Price Transparency:** Hiding prices and demanding 'DM for price' creates unnecessary friction and skepticism. When clients see transparent pricing alongside clear value descriptions, purchase decisions happen faster.\n2. **Highlight Local Social Proof:** Share video testimonials, unboxing reels, and WhatsApp feedback screenshots from real customers in Ghana. Local social proof validates your credibility faster than polished studio ads.\n3. **Streamline Payment & Logistics:** Clearly outline Mobile Money payment options, delivery timelines, and pickup locations across your highlights and bio links.",
      "> *Authenticity and human connection always beat glossy stock photos in West African social commerce.*"
    ]
  },
  {
    id: "blog-substack-6",
    slug: "episode-6-the-sales-page-formula",
    title: "Episode 6: The Sales Page Formula",
    category: "Substack Series",
    date: "August 5, 2026",
    readTime: "6 min read",
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80",
    author: {
      name: "Osei Kofi",
      role: "Lead Strategist, NOK Social"
    },
    excerpt: "How do you structure a high-converting sales page that turns cold traffic into enthusiastic buyers? Discover the proven 7-section formula built for digital products, boutique services, and West African brands.",
    content: [
      "Welcome to Episode 6 of the NOK Social Growth Series on Substack!",
      "## The Core Problem with Most Sales Pages",
      "Most sales pages fail not because the product is bad, but because the structure confuses the reader. When prospective buyers land on a chaotic page with no clear narrative flow, they bounce within 5 seconds.",
      "> **Substack Original Article:** Originally published on [NOK Social Substack](https://noksocial.substack.com/p/episode-6-the-sales-page-formula). *Follow our newsletter for weekly growth deep dives.*",
      "## The 7-Section High-Converting Sales Page Formula",
      "### 1. The Hook Header & Value Proposition\nCapture attention instantly with a bold headline stating the exact transformation your offer provides, paired with a subheadline and primary Call-To-Action (CTA) button.",
      "### 2. The Agitation & Problem Statement\nMirror your ideal client's current frustration. Show that you deeply understand their pain points before introducing your solution.",
      "### 3. The Core Solution & Offer Breakdown\nIntroduce your product, service, or program with clear visual mockups, feature lists, and tangible outcomes.",
      "### 4. Social Proof & Case Studies\nInclude real client testimonials, WhatsApp screenshots, or video reviews to establish immediate trust and credibility.",
      "### 5. Transparent Pricing & Tier Comparison\nDisplay clear pricing options with Mobile Money and card payment badges so clients know exactly what to expect without DM guessing.",
      "### 6. Risk Reversal & Guarantees\nEliminate purchase hesitation by offering a clear guarantee, delivery promise, or consultation onboarding warranty.",
      "### 7. The Final Urgency CTA & FAQ\nAnswer top objections in an accordion FAQ and provide a final prominent checkout button.",
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80",
      "## Key Takeaways for High-Converting Pages",
      "- **Keep CTAs visible** above the fold and repeated at logical scrolling checkpoints.\n- **Use high-contrast button styling** with direct action copy (e.g. 'Get Instant Access' or 'Book Strategy Call').\n- **Ensure 100% mobile responsiveness** since over 85% of traffic in West Africa visits on smartphones."
    ]
  },
  {
    id: "blog-substack-5",
    slug: "episode-5-email-sequences-that-sell",
    title: "Episode 5: Email Sequences That Sell",
    category: "Substack Series",
    date: "July 28, 2026",
    readTime: "5 min read",
    coverImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1000&q=80",
    author: {
      name: "Osei Kofi",
      role: "Lead Strategist, NOK Social"
    },
    excerpt: "Stop sending generic newsletters that get ignored. Learn the exact 5-part automated email welcome sequence that builds trust, nurtures leads, and generates sales on autopilot.",
    content: [
      "Welcome to Episode 5 of the NOK Social Growth Series on Substack!",
      "## Why Email & WhatsApp Automation Outperforms Social Feeds",
      "Social media algorithms fluctuate, but your email and broadcast subscriber lists belong entirely to you. An automated email welcome sequence works 24/7, delivering personal messaging to every new subscriber while you sleep.",
      "> **Substack Original Article:** Read and comment on the original post at [NOK Social Substack](https://noksocial.substack.com/p/episode-5-email-sequences-that-sell).",
      "## The 5-Part High-Yield Welcome Sequence",
      "### Email 1: The Instant Delivery & Personal Welcome\nDeliver the freebie or lead magnet immediately. Set expectations for what type of valuable content you will share each week.",
      "### Email 2: The Origin Story & Core Philosophy\nShare why you started your agency or brand, the obstacles you overcame, and why your approach is uniquely effective.",
      "### Email 3: The Case Study / Social Proof Showcase\nDetail how a real client solved a major challenge using your framework, highlighting measurable results.",
      "### Email 4: Overcoming Main Objections\nAddress common hesitations regarding price, timing, or implementation upfront in a helpful, educational tone.",
      "### Email 5: The Soft Offer & Clear Call to Action\nPresent a direct invitation to book a consultation, join a program, or order a flagship product with a limited-time bonus.",
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1000&q=80",
      "## Pro Automation Tips",
      "- **Personalize subject lines** with subscriber names or location tags.\n- **Keep paragraphs short** (1–3 sentences) for effortless mobile reading.\n- **Include one primary Call to Action** per email to avoid decision fatigue."
    ]
  },
  {
    id: "blog-substack-4",
    slug: "episode-4-landing-pages-that-convert",
    title: "Episode 4: Landing Pages That Convert",
    category: "Substack Series",
    date: "July 21, 2026",
    readTime: "5 min read",
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80",
    author: {
      name: "Osei Kofi",
      role: "Lead Strategist, NOK Social"
    },
    excerpt: "What separates a landing page that converts at 2% from one that converts at 25%? Discover the essential copy, layout, and speed optimizations every modern business needs.",
    content: [
      "Welcome to Episode 4 of the NOK Social Growth Series on Substack!",
      "## The Singular Purpose of a Landing Page",
      "Unlike a standard corporate website with dozens of navigation links, a dedicated **landing page has ONE single goal**: to convert a visitor into a lead or buyer. Any distraction reduces conversion.",
      "> **Substack Original Article:** View the original publication at [NOK Social Substack](https://noksocial.substack.com/p/episode-4-landing-pages-that-convert).",
      "## 4 Crucial Pillars of High-Converting Landing Pages",
      "### 1. Ultra-Fast Load Speeds\nIf your landing page takes longer than 3 seconds to load on mobile data, over 50% of your paid or organic traffic is lost before reading a single word.",
      "### 2. Laser-Focused Headline Messaging\nYour headline must state what the visitor gets in plain language within 3 seconds of landing.",
      "### 3. Frictionless Form Controls\nOnly ask for essential information (e.g. Name & WhatsApp/Email). Every extra form field decreases completion rates by 10%.",
      "### 4. Direct Social Validation\nEmbed real customer quotes, media logos, or trust badges right near the signup form.",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=80",
      "## Summary Checklist",
      "- **Remove top navigation headers** on dedicated campaign landing pages.\n- **Optimize all image files** to webp/compressed formats.\n- **Test form submissions** on actual mobile devices in low-network conditions."
    ]
  }
];
