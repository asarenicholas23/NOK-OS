import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { brand, contact, footer } from "../../content/siteContent";
import { NodeLogo } from "./NodeLogo";

const linkCls =
  "rounded-sm text-site-paper/75 transition-colors hover:text-site-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-amber";

export const SiteFooter: React.FC = () => {
  const wa = contact.whatsapp.replace(/[^0-9]/g, "");

  return (
    <footer className="mt-16 px-4 pb-6 sm:px-6">
      <div className="mx-auto max-w-[1120px] rounded-section bg-site-ink px-6 py-10 text-site-paper sm:px-11 sm:py-12">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-amber">
              <NodeLogo hub="#F5F1E8" node="#E8A33D" />
              <span className="text-[19px] font-semibold">{brand.name}</span>
            </Link>
            <p className="mt-3 max-w-xs text-base leading-relaxed text-site-paper/75">{footer.blurb}</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-site-amber">{footer.capabilitiesTitle}</h2>
            <ul className="mt-3 space-y-3">
              {footer.serviceLines.map((s) => (
                <li key={s.to}>
                  <Link to={s.to} className={`${linkCls} block`}>
                    <span className="block font-semibold text-site-paper">{s.name}</span>
                    <span className="block text-sm">{s.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-sm font-semibold text-site-amber">{footer.pagesTitle}</h2>
            <ul className="mt-3 space-y-2 text-[15px]">
              {footer.pages.map((p) => (
                <li key={p.to}>
                  <Link to={p.to} className={linkCls}>
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-site-amber">{footer.contactTitle}</h2>
            <ul className="mt-3 space-y-2.5 text-[15px]">
              <li>
                <a href={`mailto:${contact.email}`} className={`${linkCls} inline-flex items-center gap-2`}>
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="sr-only">{footer.emailLabel}: </span>
                    {contact.email}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkCls} inline-flex items-center gap-2`}
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {footer.whatsappLabel} <span className="font-mono text-sm">{contact.whatsapp}</span>
                  </span>
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-site-paper/75">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{contact.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 text-sm text-site-paper/75">
          © {new Date().getFullYear()} {brand.name}. {footer.rights}
        </p>
      </div>
    </footer>
  );
};
