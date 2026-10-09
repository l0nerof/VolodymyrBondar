"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const noop = () => () => {};

const ITEM =
  "cursor-pointer px-2 py-1 font-display text-[11px] font-black uppercase italic transition-colors duration-150 aria-pressed:bg-accent aria-pressed:text-on-accent sm:px-2.5";

/** The light/dark switch, worded as the comic's night and day issues. The
 * swarm recolours as a wave from the click. */
export function EditionToggle({ labels }: { labels: { group: string; night: string; day: string } }) {
  // The theme is only known on the client; until then the night issue (the
  // default) shows as current, which is what the server rendered.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const { resolvedTheme, setTheme } = useTheme();
  const night = !mounted || resolvedTheme !== "light";

  return (
    <span role="group" aria-label={labels.group} className="inline-flex border-2 border-line-strong">
      <button type="button" aria-pressed={night} onClick={() => setTheme("dark")} className={ITEM}>
        {labels.night}
      </button>
      <button type="button" aria-pressed={!night} onClick={() => setTheme("light")} className={ITEM}>
        {labels.day}
      </button>
    </span>
  );
}
