"use client";

import { useSyncExternalStore } from "react";

import { homeTime } from "@/components/swarm/visitor";

function everySecond(onChange: () => void) {
  const id = window.setInterval(onChange, 1000);
  return () => window.clearInterval(id);
}

/** Ukraine's time right now. The text is real (read by screen readers,
 * visible without WebGL); with the swarm on, it turns transparent and the
 * dots draw the digits, re-forming them every minute. The server cannot know
 * the time a visitor reads the page, so it renders "--:--". */
export function HomeClock({ label }: { label: string }) {
  const time = useSyncExternalStore(everySecond, () => homeTime(), () => "--:--");

  return (
    <div>
      <p className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">{label}</p>
      {/* inline-block, so the swarm's seconds row under it spans just the digits */}
      <p
        data-swarm-clock
        className="mt-3 inline-block font-display text-[clamp(3.6rem,10vw,6rem)] leading-none font-black tabular-nums italic transition-colors duration-700 data-[swarm-ready=true]:text-transparent data-[swarm-ready=true]:selection:text-transparent"
      >
        <time data-swarm-word dateTime={time.includes("-") ? undefined : time}>
          {time}
        </time>
      </p>
    </div>
  );
}
