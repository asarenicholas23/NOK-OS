import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, Check } from "lucide-react";
import { flows, home } from "../../content/siteContent";
import { Card } from "./Card";
import { ImageSlot } from "./ImageSlot";
import { PhoneFrame } from "./Frames";
import { Reveal } from "./Reveal";
import { StatusFlip } from "./StatusFlip";

interface ServiceLineCardsProps {
  /** Bigger type, for the /services hub. */
  large?: boolean;
  /** Heading level for the card titles (h3 under a section h2, h2 on the hub). */
  titleAs?: "h2" | "h3";
  className?: string;
}

/** The two service-line cards: Marketing and Websites. */
export const ServiceLineCards: React.FC<ServiceLineCardsProps> = ({ large = false, titleAs: Title = "h3", className = "" }) => {
  const [data, pipeline] = home.serviceLines.cards;
  const aspect = large ? "16 / 9" : "16 / 8";

  const cards = [
    {
      ...data,
      media: (
        <ImageSlot
          label={data.imageLabel}
          src={data.image.src}
          width={data.image.width}
          height={data.image.height}
          alt={data.image.alt}
          tint="blue"
          aspect={aspect}
          objectPosition="left top"
        />
      ),
    },
    {
      ...pipeline,
      media: (
        <div className="relative overflow-hidden rounded-frame bg-[#FBEFD9]" style={{ aspectRatio: aspect }}>
          <PhoneFrame className="absolute right-[8%] top-5 w-[40%] max-w-[180px] rounded-[28px] p-2">
            <img
              src="/images/site/work-vividel-phone.webp"
              width={520}
              height={1125}
              alt="Vividel's website on a phone"
              loading="lazy"
              decoding="async"
              className="block w-full"
            />
          </PhoneFrame>
          <StatusFlip
            className="absolute bottom-4 left-4 origin-bottom-left scale-[0.82] sm:bottom-6 sm:left-6 sm:scale-100"
            from={{ ...flows.booking.from, icon: <CalendarCheck className="h-4 w-4" /> }}
            to={{ ...flows.booking.to, icon: <Check className="h-4 w-4" /> }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      {cards.map((c, i) => (
        <Reveal key={c.tag} delay={i * 0.1}>
          <Card as="article" media={c.media} className="h-full">
            <p className="font-mono text-xs text-site-cyanotype">{c.tag}</p>
            <Title className={`mt-1 font-semibold leading-tight text-site-ink ${large ? "text-[26px] sm:text-[32px]" : "text-2xl sm:text-[26px]"}`}>
              {c.title}
            </Title>
            <p className={`mt-2 leading-normal text-site-slate ${large ? "text-lg" : "text-base"}`}>{c.body}</p>
            <Link
              to={c.to}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full font-semibold text-site-cyanotype hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
            >
              {c.linkLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Card>
        </Reveal>
      ))}
    </div>
  );
};
