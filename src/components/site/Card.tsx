import React from "react";

interface CardProps {
  /** Optional media (ImageSlot, frame…) shown on top, inset with its own radius. */
  media?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
  as?: "div" | "article" | "li";
}

/** White rounded card for use on paper sections. */
export const Card: React.FC<CardProps> = ({ media, className = "", bodyClassName = "", children, as: Tag = "div" }) => (
  <Tag className={`bg-white rounded-card ${media ? "p-3.5 pb-7" : "p-7"} ${className}`}>
    {media}
    {children && <div className={`${media ? "px-3.5 pt-[18px]" : ""} ${bodyClassName}`}>{children}</div>}
  </Tag>
);
