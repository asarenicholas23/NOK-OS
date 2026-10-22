import React from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "dark" | "soft";
type Size = "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-site-amber text-site-ink hover:brightness-[1.04]",
  dark: "bg-site-ink text-site-paper hover:bg-[#1b2b4f]",
  soft: "bg-white text-site-ink hover:bg-white/80",
};

const SIZE: Record<Size, string> = {
  md: "px-[18px] py-2.5 text-[15px]",
  lg: "px-[26px] py-3.5 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold leading-none whitespace-nowrap cursor-pointer " +
  "transition-[transform,background-color,filter] duration-300 ease-soft hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype focus-visible:ring-offset-2 focus-visible:ring-offset-site-paper " +
  "disabled:opacity-50 disabled:pointer-events-none";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type PillButtonProps = CommonProps &
  (
    | ({ to: string; href?: never } & Omit<React.ComponentProps<typeof Link>, "to" | "className" | "children">)
    | ({ href: string; to?: never } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children">)
    | ({ to?: never; href?: never } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">)
  );

/** Fully rounded button. Renders a router Link (`to`), an anchor (`href`) or a <button>. */
export const PillButton: React.FC<PillButtonProps> = ({ variant = "primary", size = "md", className = "", children, ...rest }) => {
  const cls = `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`;

  if ("to" in rest && rest.to !== undefined) {
    const { to, ...linkProps } = rest as { to: string } & Omit<React.ComponentProps<typeof Link>, "to" | "className" | "children">;
    return (
      <Link to={to} className={cls} {...linkProps}>
        {children}
      </Link>
    );
  }
  if ("href" in rest && rest.href !== undefined) {
    return (
      <a className={cls} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={buttonProps.type ?? "button"} className={cls} {...buttonProps}>
      {children}
    </button>
  );
};
