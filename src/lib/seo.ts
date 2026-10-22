// Canonical production domain. Firebase Hosting still serves the site on
// nok-os.web.app; that host 301s here once the custom domain is connected.
export const SITE_URL = "https://noksocial.com";
export const DEFAULT_OG_IMAGE = "https://noksocial.com/images/og/home.jpg";
export const SITE_NAME = "N.O.K Social";
export const SITE_LOGO = { url: `${SITE_URL}/nok-social-logo.png`, width: 2000, height: 2000 };

// Meta descriptions should stay close to the ~155-160 char window search
// engines actually display before truncating with an ellipsis.
export function truncateDescription(text: string, maxLength = 160): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength - 1).trimEnd() + "…";
}

// Blog posts store their publish date as an editorial display string (e.g.
// "August 6, 2026") rather than a machine timestamp — this converts it to
// the ISO 8601 format schema.org's datePublished expects. Returns undefined
// rather than a fabricated date if the string doesn't parse.
export function toIsoDate(displayDate: string): string | undefined {
  const parsed = new Date(displayDate);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

// Open Graph and schema.org image fields both require an absolute, crawlable
// URL. Some blog posts have a pasted-in base64 data URI as their cover image
// instead of a hosted one — that's not valid in either field, so treat it as
// no image (callers fall back to a default) rather than passing it through.
export function toCrawlableImage(image: string | undefined): string | undefined {
  return image?.startsWith("http") ? image : undefined;
}

interface ArticleJsonLdInput {
  title: string;
  description: string;
  datePublished?: string;
  authorName: string;
  image?: string;
  canonicalUrl: string;
}

export function buildArticleJsonLd(input: ArticleJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    author: {
      "@type": "Person",
      name: input.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: SITE_LOGO.url,
        width: SITE_LOGO.width,
        height: SITE_LOGO.height,
      },
    },
    ...(input.image ? { image: [input.image] } : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.canonicalUrl,
    },
    url: input.canonicalUrl,
  };
}

export interface FAQItem {
  question: string;
  answer: string;
}

// Google requires FAQPage structured data to match content actually visible
// on the page — callers should build this from the same FAQItem[] the page
// renders, not a separate hand-maintained list.
export function buildFaqJsonLd(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Business and service structured data                                */
/* ------------------------------------------------------------------ */

const BUSINESS_ID = `${SITE_URL}/#business`;

export interface BusinessJsonLdInput {
  description: string;
  email: string;
  telephone: string;
  founder: string;
}

/**
 * The business itself, as a ProfessionalService (a kind of LocalBusiness):
 * the Konongo address, and a worldwide service area.
 */
export function buildBusinessJsonLd(input: BusinessJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": BUSINESS_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/home`,
    description: input.description,
    logo: SITE_LOGO.url,
    image: DEFAULT_OG_IMAGE,
    email: input.email,
    telephone: input.telephone,
    priceRange: "GH₵",
    founder: { "@type": "Person", name: input.founder },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Low Cost",
      addressLocality: "Konongo",
      addressRegion: "Ashanti Region",
      addressCountry: "GH",
    },
    areaServed: "Worldwide",
  };
}

export interface ServiceJsonLdInput {
  name: string;
  description: string;
  path: string;
  /** Packages offered under this service line, shown as an offer catalogue. */
  packages: { title: string; desc: string }[];
}

/** One service line (Marketing or Websites), provided by the business above. */
export function buildServiceJsonLd(input: ServiceJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    serviceType: input.name,
    description: input.description,
    url: `${SITE_URL}${input.path}`,
    areaServed: "Worldwide",
    provider: { "@type": "ProfessionalService", "@id": BUSINESS_ID, name: SITE_NAME, url: `${SITE_URL}/home` },
    ...(input.packages.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: input.name,
            itemListElement: input.packages.map((p) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: p.title, description: p.desc },
            })),
          },
        }
      : {}),
  };
}

/* ------------------------------------------------------------------ */
/* Per-page share images                                               */
/* ------------------------------------------------------------------ */

/** Pages with their own share image, made by scripts/generate-og-images.ts. */
export const OG_PAGES = ["home", "services", "marketing", "websites", "about", "blog", "resources", "ighealthcheck"] as const;

/** Absolute URL of a page's share image (public/images/og/<slug>.jpg). */
export const ogImage = (slug: (typeof OG_PAGES)[number]) => `${SITE_URL}/images/og/${slug}.jpg`;
