import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { DURATION, EASE_SOFT } from "./motion";

export interface Step {
  title: string;
  desc: string;
}

interface StepPanelProps {
  steps: Step[];
  /** Label shown above the title in the panel, e.g. "Step". */
  stepLabel?: string;
  /** Auto-advance interval in ms. Stops for good once the visitor picks a step. */
  intervalMs?: number;
  className?: string;
}

const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * Desktop: numbered list (left) drives a rounded ink panel (right) with a
 * progress bar. Mobile: the same steps as an accordion.
 */
export const StepPanel: React.FC<StepPanelProps> = ({ steps, stepLabel = "Step", intervalMs = 4500, className = "" }) => {
  const [active, setActive] = useState(0);
  const [userPicked, setUserPicked] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.4 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  useEffect(() => {
    if (reduce || userPicked || paused || !inView || steps.length < 2) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % steps.length), intervalMs);
    return () => window.clearTimeout(t);
  }, [active, reduce, userPicked, paused, inView, intervalMs, steps.length]);

  const pick = (i: number) => {
    setUserPicked(true);
    setActive(i);
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + steps.length) % steps.length;
    pick(next);
    tabRefs.current[next]?.focus();
  };

  if (steps.length === 0) return null;
  const step = steps[active];
  const fade = reduce ? { duration: 0 } : { duration: DURATION.fast, ease: EASE_SOFT };

  return (
    <div ref={rootRef} className={className}>
      {/* Desktop: list + panel */}
      <div
        className="hidden md:grid grid-cols-2 gap-4"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div role="tablist" aria-orientation="vertical" aria-label="Steps" className="flex flex-col gap-1">
          {steps.map((s, i) => (
            <button
              key={i}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${baseId}-panel`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => pick(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`flex items-baseline gap-3 rounded-frame px-3.5 py-3 text-left cursor-pointer transition-colors duration-300 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype ${
                i === active ? "bg-white" : "hover:bg-white/50"
              }`}
            >
              <span className="font-mono text-xs text-site-cyanotype">{num(i)}</span>
              <span className="text-xl font-semibold text-site-ink">{s.title}</span>
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${active}`}
          aria-live={userPicked ? "polite" : "off"}
          className="flex min-h-[280px] flex-col justify-center rounded-card bg-site-ink p-8"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={fade}
            >
              <span className="font-mono text-xs text-site-amber">
                {stepLabel} {num(active)}
              </span>
              <p className="my-2 text-[32px] font-semibold leading-[1.15] text-site-paper">{step.title}</p>
              <p className="text-[17px] leading-normal text-site-paper/75">{step.desc}</p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-site-paper/10" aria-hidden="true">
            <motion.div
              className="h-full rounded-full bg-site-amber"
              initial={false}
              animate={{ width: `${((active + 1) / steps.length) * 100}%` }}
              transition={reduce ? { duration: 0 } : { duration: 0.6, ease: EASE_SOFT }}
            />
          </div>
        </div>
      </div>

      {/* Mobile: accordion */}
      <ol className="md:hidden flex flex-col gap-2">
        {steps.map((s, i) => {
          const open = i === active;
          return (
            <li key={i} className={`rounded-card transition-colors duration-300 ${open ? "bg-site-ink" : "bg-white"}`}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`${baseId}-m-${i}`}
                onClick={() => pick(i)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype rounded-card"
              >
                <span className={`font-mono text-xs ${open ? "text-site-amber" : "text-site-cyanotype"}`}>{num(i)}</span>
                <span className={`flex-1 text-lg font-semibold ${open ? "text-site-paper" : "text-site-ink"}`}>{s.title}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180 text-site-paper" : "text-site-ink"}`}
                />
              </button>
              <div
                id={`${baseId}-m-${i}`}
                className={`grid transition-[grid-template-rows] duration-500 ease-soft motion-reduce:transition-none ${
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden" inert={!open}>
                  <p className="px-5 pb-5 text-base leading-normal text-site-paper/75">{s.desc}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
