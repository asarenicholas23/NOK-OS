import React from "react";
import { Image as ImageIcon } from "lucide-react";

type Tint = "sand" | "blue" | "amber" | "rose" | "teal";

const TINT: Record<Tint, string> = {
  sand: "bg-[#E9DCC7] text-[#5E5343]",
  blue: "bg-[#E6EDF7] text-[#3F5A86]",
  amber: "bg-[#FBEFD9] text-[#7A5A1C]",
  rose: "bg-[#E7C9C2] text-[#6E463E]",
  teal: "bg-[#C9DDDA] text-[#3F625D]",
};

interface ImageSlotProps {
  /** What the image should show. Shown on the placeholder; also the README entry. */
  label: string;
  /** Real image. When missing, a tinted placeholder renders instead. */
  src?: string;
  alt?: string;
  /** Optional modern-format sources, e.g. [{ type: "image/avif", srcSet: "/images/site/x.avif" }]. */
  sources?: { type: string; srcSet: string }[];
  /** CSS aspect ratio, e.g. "16 / 10". Reserves the space so nothing shifts on load. */
  aspect?: string;
  /** Intrinsic size of the real image, so the browser can reserve space. */
  width?: number;
  height?: number;
  /** Load immediately (above the fold). Default is lazy. */
  priority?: boolean;
  tint?: Tint;
  icon?: React.ReactNode;
  /** CSS object-position for the real image, e.g. "top" to keep a page header in view. */
  objectPosition?: string;
  className?: string;
}

/** Image, or a clearly labelled placeholder until the real one is supplied. */
export const ImageSlot: React.FC<ImageSlotProps> = ({
  label,
  src,
  alt,
  sources,
  aspect = "16 / 10",
  width,
  height,
  priority = false,
  tint = "sand",
  icon,
  objectPosition,
  className = "",
}) => {
  const frame = `relative overflow-hidden rounded-frame ${className}`;

  if (!src) {
    return (
      <div
        role="img"
        aria-label={`Image placeholder: ${label}`}
        className={`${frame} ${TINT[tint]} flex flex-col items-center justify-center gap-1.5 p-4 text-center`}
        style={{ aspectRatio: aspect }}
      >
        <span aria-hidden="true">{icon ?? <ImageIcon className="h-6 w-6" strokeWidth={1.6} />}</span>
        <span className="font-mono text-xs">{label}</span>
      </div>
    );
  }

  return (
    <div className={frame} style={{ aspectRatio: aspect }}>
      <picture>
        {sources?.map((s) => <source key={s.type} type={s.type} srcSet={s.srcSet} />)}
        <img
          src={src}
          alt={alt ?? ""}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          className="absolute inset-0 h-full w-full object-cover"
          style={objectPosition ? { objectPosition } : undefined}
        />
      </picture>
    </div>
  );
};
