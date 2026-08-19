// TODO: swap to "https://noksocial.com" once that domain is acquired and
// pointed at this Firebase Hosting site.
export const SITE_URL = "https://nok-os.web.app";
export const DEFAULT_OG_IMAGE = "https://nok-os.web.app/og-cover.jpg";
export const SITE_NAME = "NOK Social";
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
