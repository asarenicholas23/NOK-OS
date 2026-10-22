import React, { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

interface ScrollFillTextProps {
  text: string;
  className?: string;
  /** Opacity of words not yet reached. */
  dimOpacity?: number;
}

const Word: React.FC<{ word: string; progress: MotionValue<number>; range: [number, number]; dim: number }> = ({
  word,
  progress,
  range,
  dim,
}) => {
  const opacity = useTransform(progress, range, [dim, 1]);
  return <motion.span style={{ opacity }}>{word}</motion.span>;
};

/**
 * Faded words start at 40% opacity: 3.4:1 on ink, which meets WCAG AA for
 * large text (the paragraph is 24px and up). Lower than that fails AA.
 *
 * Statement paragraph whose words go from faded to solid as it scrolls up
 * through the viewport. The whole text is always in the DOM (screen readers
 * and crawlers read all of it); only opacity changes. With reduced motion it
 * renders fully filled.
 */
export const ScrollFillText: React.FC<ScrollFillTextProps> = ({ text, className = "", dimOpacity = 0.4 }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  // 0 when the paragraph's top reaches 85% down the viewport, 1 when its
  // bottom reaches 45%: the text is fully solid before it leaves the reading zone.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });

  if (reduce) {
    return (
      <p ref={ref} className={className}>
        {text}
      </p>
    );
  }

  const words = text.split(/\s+/).filter(Boolean);
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => {
        const start = i / words.length;
        const end = Math.min(1, start + 1.5 / words.length);
        return (
          <React.Fragment key={i}>
            <Word word={w} progress={scrollYProgress} range={[start, end]} dim={dimOpacity} />
            {i < words.length - 1 && " "}
          </React.Fragment>
        );
      })}
    </p>
  );
};
