"use client";

import { useEffect, useId, useRef, useState } from "react";

import { TECH_ICONS } from "@/data/stack";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const CYCLE_MS = 2600;

export type StackTab = { key: string; label: string; items: string[] };

const TAB =
  "cursor-pointer rounded-md border-2 px-3 py-1.5 font-display text-[12px] font-black uppercase italic transition-[background-color,color,border-color,box-shadow] duration-200 ease-out";

/** The stack by category. Pick a category (pointer, click or arrow keys) and
 * point at a technology: the swarm draws it on the stage below. With nothing
 * pointed at, the stage cycles through the category by itself. */
export function Stack({ tabs, label }: { tabs: StackTab[]; label: string }) {
  const [active, setActive] = useState(0);
  const [pointed, setPointed] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const reduceMotion = useReducedMotion();
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const group = tabs[active];
  const shown = pointed ?? group.items[tick % group.items.length];

  useEffect(() => {
    if (reduceMotion || pointed) return;
    const timer = window.setInterval(() => setTick((n) => n + 1), CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion, pointed]);

  function pickGroup(index: number) {
    // Pointing at the open tab again must not restart it from the first item.
    if (index === active) return;
    setActive(index);
    setTick(0);
    setPointed(null);
  }

  // Moving from one technology to the next used to drop the pointer in the
  // gap between them, so the stage flashed back to the first item each time.
  // The pointed item holds until the pointer leaves the whole list, and the
  // cycle then carries on from it.
  function release() {
    if (!pointed) return;
    const at = group.items.indexOf(pointed);
    if (at >= 0) setTick(at);
    setPointed(null);
  }

  // Arrow keys move between the tabs (and wrap), Home and End jump to the
  // ends; the tab under focus opens, as in the ARIA tabs pattern.
  function onTabKey(event: React.KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    pickGroup(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={index === active}
              aria-controls={`${id}-panel`}
              tabIndex={index === active ? 0 : -1}
              onMouseEnter={() => pickGroup(index)}
              onClick={() => pickGroup(index)}
              onKeyDown={(event) => onTabKey(event, index)}
              className={cn(
                TAB,
                index === active
                  ? "border-on-accent bg-accent text-on-accent shadow-[3px_3px_0_var(--pop)]"
                  : "border-line-strong hover:bg-raise"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`}>
          <ul key={active} onMouseLeave={release} className="flex flex-wrap content-start gap-x-3 gap-y-2">
            {group.items.map((name, index) => (
              <li
                key={name}
                onMouseEnter={() => setPointed(name)}
                onClick={() => setPointed(name)}
                data-shown={name === shown ? "true" : undefined}
                style={{ animationDelay: `${index * 35}ms` }}
                // A marker stroke under the one being drawn.
                className="animate-stack-item cursor-default font-semibold text-muted transition-colors duration-150 motion-reduce:animate-none data-[shown=true]:text-ink data-[shown=true]:[box-shadow:inset_0_-0.42em_0_var(--accent-2)]"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The stage. Decorative: the list already says everything. */}
      <div
        aria-hidden
        data-swarm-stack
        data-swarm-show={shown}
        data-swarm-icon={TECH_ICONS[shown] ?? ""}
        className="min-h-56 font-display md:min-h-80"
      />
    </div>
  );
}
