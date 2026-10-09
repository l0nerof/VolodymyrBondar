"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useReducedMotion } from "@/lib/use-reduced-motion";

const noop = () => () => {};

/** A number that counts up once, the first time it scrolls into view.
 *
 * The server renders the final value (what crawlers, screen readers and a page
 * without JavaScript get); after hydration it drops to 0 and counts up when
 * seen, unless the visitor prefers reduced motion. Screen readers always get
 * the final value. */
export function CountUp({ value, suffix = "", duration = 1100 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const animate = hydrated && !reduceMotion;

  useEffect(() => {
    const el = ref.current;
    if (!el || !animate) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          // easeOutCubic: quick off the mark, settles onto the number.
          setProgress(1 - (1 - t) ** 3);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      // Counting starts once the number is a little inside the viewport.
      { rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [animate, duration]);

  const shown = animate ? Math.round(value * progress) : value;

  return (
    <span ref={ref}>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
      <span aria-hidden>
        {shown}
        {suffix}
      </span>
    </span>
  );
}
