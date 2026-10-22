import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { SITE_URL } from "../../lib/seo";
import { Container } from "./Layout";

export interface Crumb {
  label: string;
  /** Path for every crumb except the current page. */
  to?: string;
}

/** "Home › Services › Marketing" trail, plus BreadcrumbList JSON-LD. */
export const Breadcrumbs: React.FC<{ items: Crumb[]; currentPath: string }> = ({ items, currentPath }) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: `${SITE_URL}${c.to ?? currentPath}`,
    })),
  };

  return (
    <Container className="pt-8">
      <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-[15px]">
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <li key={c.label} className="flex items-center gap-1">
                {c.to && !last ? (
                  <Link
                    to={c.to}
                    className="rounded-full px-2.5 py-1 text-site-slate transition-colors hover:bg-white hover:text-site-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="rounded-full bg-white px-2.5 py-1 font-semibold text-site-ink">
                    {c.label}
                  </span>
                )}
                {!last && <ChevronRight className="h-4 w-4 text-site-slate/70" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>
    </Container>
  );
};
