/**
 * Blog categories. Posts keep whatever category text is stored in the CMS;
 * the site shows one of these four instead, using the approved mapping below.
 * New posts pick a category from the same four in the CMS dropdown.
 */
import type { BlogPost } from "../data/cmsData";

export const BLOG_CATEGORIES = ["Social media", "Campaigns", "Websites", "Running your business"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/** Approved mapping (22 Oct 2026), by post slug. */
const CATEGORY_BY_SLUG: Record<string, BlogCategory> = {
  "how-running-campaigns-shows-you-which-marketing-activity-actually-makes-money": "Campaigns",
  "someone-could-be-pretending-to-be-your-business-right-now": "Social media",
  "scaling-beyond-the-grind-why-digital-marketing-alone-won-t-save-your-overwhelmed-startup": "Running your business",
  "why-your-marketing-isn-t-generating-revenue-and-your-sales-team-is-paying-for-it": "Campaigns",
  "customer-journey-mapping-ghana-sales-funnel": "Social media",
  "episode-6-the-sales-page-formula": "Websites",
  "pitfalls-of-diy-social-media-ghana": "Social media",
  "crafting-lead-magnets-that-convert-ghana": "Campaigns",
  "episode-5-email-sequences-that-sell": "Campaigns",
  "episode-4-landing-pages-that-convert": "Websites",
  "building-high-converting-social-media-strategy-accra-kumasi": "Social media",
};

/** Fallback for posts not listed above, by their old CMS category text. */
const CATEGORY_BY_OLD_LABEL: Record<string, BlogCategory> = {
  "digital marketing": "Campaigns",
  "digital presence": "Social media",
  "digital strategy": "Running your business",
  "brand positioning": "Social media",
  "content & sales": "Campaigns",
  "sales funnel mastery": "Campaigns",
  "substack series": "Campaigns",
  "blogger archive": "Running your business",
};

/** The category the site shows for a post. */
export const blogCategory = (post: Pick<BlogPost, "slug" | "category">): BlogCategory => {
  const bySlug = CATEGORY_BY_SLUG[post.slug];
  if (bySlug) return bySlug;
  const stored = (post.category || "").trim();
  const exact = BLOG_CATEGORIES.find((c) => c.toLowerCase() === stored.toLowerCase());
  return exact ?? CATEGORY_BY_OLD_LABEL[stored.toLowerCase()] ?? "Running your business";
};

/** Publish time from the post's display date ("October 21, 2026"); 0 if unparseable. */
const publishedAt = (p: Pick<BlogPost, "date">) => {
  const t = new Date(p.date).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/** Newest first, by the publish date shown on the post. */
export const sortByPublishDate = <T extends Pick<BlogPost, "date">>(posts: T[]): T[] =>
  [...posts].sort((a, b) => publishedAt(b) - publishedAt(a));

/** Stored titles can carry stray spaces; show them trimmed. */
export const postTitle = (p: Pick<BlogPost, "title">) => p.title.trim();
