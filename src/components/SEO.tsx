import { useEffect } from "react";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "../lib/seo";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
}

interface UpsertResult {
  el: Element;
  attr: "content" | "href";
  previous: string | null;
  created: boolean;
}

// index.html ships a static <title>/<meta>/OG/Twitter tag set as the site's
// default. React doesn't know those tags exist, so rendering a *new*
// <title>/<meta> via JSX only adds a second, duplicate tag alongside them —
// crawlers and OG parsers generally read the first occurrence, which would
// silently keep serving the generic default. Updating the existing DOM
// nodes in place (and restoring them on unmount) avoids that entirely.
function upsertMeta(attrName: "name" | "property", attrValue: string, content: string): UpsertResult {
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  const created = !el;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  const previous = el.getAttribute("content");
  el.setAttribute("content", content);
  return { el, attr: "content", previous, created };
}

function upsertLink(rel: string, href: string): UpsertResult {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  const created = !el;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  const previous = el.getAttribute("href");
  el.setAttribute("href", href);
  return { el, attr: "href", previous, created };
}

// Renders nothing — updates document.title and the existing <head> tags
// imperatively on mount, restoring their prior values on unmount. Routes
// that never render <SEO/> (/os/*, /review/*, /approve/*) leave index.html's
// defaults untouched.
export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
}) => {
  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path}`;
    const previousTitle = document.title;
    document.title = title;

    const results: UpsertResult[] = [
      upsertMeta("name", "description", description),
      upsertLink("canonical", canonicalUrl),
      upsertMeta("property", "og:type", type),
      upsertMeta("property", "og:site_name", SITE_NAME),
      upsertMeta("property", "og:title", title),
      upsertMeta("property", "og:description", description),
      upsertMeta("property", "og:url", canonicalUrl),
      upsertMeta("property", "og:image", image),
      upsertMeta("property", "og:image:width", "1200"),
      upsertMeta("property", "og:image:height", "630"),
      upsertMeta("name", "twitter:card", "summary_large_image"),
      upsertMeta("name", "twitter:title", title),
      upsertMeta("name", "twitter:description", description),
      upsertMeta("name", "twitter:image", image),
    ];
    if (noindex) {
      results.push(upsertMeta("name", "robots", "noindex, follow"));
    }

    return () => {
      document.title = previousTitle;
      for (const { el, attr, previous, created } of results) {
        if (created) {
          el.remove();
        } else if (previous !== null) {
          el.setAttribute(attr, previous);
        }
      }
    };
  }, [title, description, path, image, type, noindex]);

  return null;
};
