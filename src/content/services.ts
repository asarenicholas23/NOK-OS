/**
 * Service packages and prices: the single source of truth.
 * Replaces the CMS "Services & Pricing" tab. Everything that lists services
 * (homepage, service pages, FAQ, booking form, proposals, Add Client) reads
 * this through `useCms().services`.
 *
 * Keep `title` stable: saved leads and proposals match a package by its title.
 */
import type { ServicePackage } from "../data/cmsData";

/** A price in Ghana cedis. `max` makes a range; `plus` means "from". */
export interface GhsPrice {
  min: number;
  max?: number;
  plus?: boolean;
}

/** "GH₵ 1,200–3,600", "GH₵ 3,500+", "GH₵ 400". */
export const formatGhs = ({ min, max, plus }: GhsPrice) => {
  const n = (v: number) => v.toLocaleString("en-US");
  if (max !== undefined) return `GH₵ ${n(min)}–${n(max)}`;
  return `GH₵ ${n(min)}${plus ? "+" : ""}`;
};

type PackageInput = Omit<ServicePackage, "ghsPrice"> & { price: GhsPrice };

const pkg = ({ price, ...rest }: PackageInput): ServicePackage & { price: GhsPrice } => ({
  ...rest,
  price,
  ghsPrice: formatGhs(price),
});

export const SERVICE_PACKAGES = [
  pkg({
    id: "brand-foundation",
    category: "social",
    // DRAFT names (plain, sentence case). Keep ids unchanged.
    title: "Brand setup",
    tier: "STAGE 1 · FOUNDATION",
    price: { min: 800 },
    period: "One-time",
    desc: "Audience profiles, brand voice, and visual identity — the starting point for every engagement.",
    features: [
      "Audience & competitor profiles",
      "Brand voice guidelines",
      "Content pillars",
      "Visual brand guide",
    ],
  }),
  pkg({
    id: "digital-presence-setup",
    category: "social",
    title: "Shop & Google setup",
    tier: "STAGE 2 · SETUP",
    price: { min: 1000 },
    period: "One-time",
    desc: "Get found and get orderable — Google, Instagram/Facebook Shop, and payment integration.",
    features: [
      "Google Business Profile",
      "Instagram/Facebook Shop setup",
      "Meta Commerce Manager & catalog",
      "Payment integration",
    ],
  }),
  pkg({
    id: "growth-retainer",
    category: "social",
    title: "Monthly marketing",
    tier: "STAGE 3 · ONGOING",
    price: { min: 1200, max: 3600 },
    period: "per month",
    featured: true,
    desc: "Analytics-led content and community management, month over month.",
    features: [
      "Content calendar (NOK OS analytics-led)",
      "Scheduled posting",
      "Engagement management",
      "Monthly performance summary",
    ],
  }),
  pkg({
    id: "campaign-package",
    category: "social",
    title: "Ad campaign",
    tier: "STAGE 4 · CAMPAIGNS",
    price: { min: 1000 },
    period: "per campaign (ads spend billed separately)",
    desc: "Focused awareness pushes, backed by data.",
    features: [
      "Analytics-led campaign strategy",
      "Meta ads plan",
      "Ads management: 15–20% of spend or GH₵ 300–500/mo",
    ],
  }),
  pkg({
    id: "custom-infrastructure-build",
    category: "website",
    title: "Website build",
    tier: "STAGE 5 · CUSTOM",
    price: { min: 3500, plus: true },
    period: "Project-based",
    featured: true,
    desc: "A custom website at the heart of your business: bookings, orders, payments and customer data in one place. Scoped individually.",
    // DRAFT: outcome wording (was: Firebase-backed architecture, booking/contracts/
    // e-signature, transactional email/SMS, e-commerce, e-ticketing).
    features: [
      "A fast site you can rely on, on phones and laptops",
      "Clients book, sign and confirm online",
      "Customers get email and SMS updates automatically",
      "An online shop with MoMo and card checkout",
      "Sell tickets for your events online",
    ],
  }),
];

/**
 * Old package names → current ones. Leads and proposals saved before the
 * rename still hold the old names, so they're translated when loaded: every
 * screen (CMS, proposals, the client proposal page) shows the current name,
 * and the stored text catches up the next time staff save that record.
 * Add a line here whenever a package is renamed again.
 */
export const LEGACY_SERVICE_NAMES: Record<string, string> = {
  "Brand Foundation": "Brand setup",
  "Digital Presence Setup": "Shop & Google setup",
  "Growth Retainer": "Monthly marketing",
  "Campaign Package": "Ad campaign",
  "Custom Infrastructure Build": "Website build",
  "Website or system build": "Website build",
  "Mobile Money order flow": "Payment integration",
};

const LEGACY_PATTERN = new RegExp(
  `\\b(${Object.keys(LEGACY_SERVICE_NAMES)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})\\b`,
  "g",
);

/** Replaces any old package name inside `text` with its current name. */
export const currentServiceNames = (text: string | undefined): string =>
  text ? text.replace(LEGACY_PATTERN, (m) => LEGACY_SERVICE_NAMES[m] ?? m) : text ?? "";

/** Applies `currentServiceNames` to the name-bearing fields of a lead or proposal. */
export function withCurrentServiceNames<
  T extends { serviceTier?: string; title?: string; lineItems?: { title: string; description?: string }[] },
>(record: T): T {
  const out: T = { ...record };
  if (typeof record.serviceTier === "string") out.serviceTier = currentServiceNames(record.serviceTier);
  if (typeof record.title === "string") out.title = currentServiceNames(record.title);
  if (Array.isArray(record.lineItems)) {
    out.lineItems = record.lineItems.map((li) => ({
      ...li,
      title: currentServiceNames(li.title),
      ...(typeof li.description === "string" ? { description: currentServiceNames(li.description) } : {}),
    }));
  }
  return out;
}
