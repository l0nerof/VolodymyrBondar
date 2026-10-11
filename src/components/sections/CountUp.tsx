"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { useReducedMotion } from "@/lib/use-reduced-motion";

const noop = () => () => {};

/** A number that counts up once, the first time it scrolls into view.
 *
 * The server renders the final value (what crawlers, screen readers and a page
 * without JavaScript get); after hydration it drops to 0 and counts up when
 * seen, unless the visitor prefers reduced motion. Screen readers always get
 * the final value. A fraction counts in steps of its last digit and is written
 * the page's way: 2,5 in Ukrainian, 2.5 in English. */
export function CountUp({
  value,
  locale,
  suffix = "",
  duration = 1100,
}: {
  value: number;
  locale: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const animate = hydrated && !reduceMotion;
  const decimals = String(value).split(".")[1]?.length ?? 0;
  const format = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    [locale, decimals]
  );

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

  // Rounding to whole numbers showed 2.5 as 3 once the count finished.
  const step = 10 ** -decimals;
  const shown = animate ? Math.round((value * progress) / step) * step : value;

  return (
    <span ref={ref}>
      <span className="sr-only">
        {format.format(value)}
        {suffix}
      </span>
      <span aria-hidden>
        {format.format(shown)}
        {suffix}
      </span>
    </span>
  );
}
