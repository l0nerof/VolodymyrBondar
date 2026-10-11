// The swarm's scenes ("stages"): each section that wants a shape marks an
// element with a data-swarm-* attribute, and while it is in view its stage
// claims particles for that shape (see allocation.ts).
import { TECH_ICONS } from "@/data/stack";

import { one } from "./dom";
import { EMOJI_WORDS, TECH_WORDS, UKRAINE_WORDS } from "./eggs";
import type { SwarmEngine } from "./engine";
import { GlyphShape, labelLayers, logoLayers, paintName, paintText, paintUkraine } from "./glyphs";
import { CapsuleShape, GlobeShape, RailShape, SecondsShape, TARGET_STRIDE, type Shape } from "./shapes";
import { isHome, visitorPlace } from "./visitor";

export type Stage = {
  name: string;
  budget: number;
  isActive: (wasActive: boolean) => boolean;
  resolve: () => Shape | null;
  active: boolean;
  shape: Shape | null;
  targets: Float32Array;
  members: number[];
  toppedUpAt: number;
  pendingSince: number;
};

export function visibility(swarm: SwarmEngine, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const visible = Math.max(0, Math.min(r.bottom, swarm.height) - Math.max(r.top, 0));
  return visible / Math.max(1, Math.min(r.height, swarm.height * 0.5));
}

export function inView(swarm: SwarmEngine, el: HTMLElement, on = 0.6, off = 0.45) {
  return (was: boolean) => visibility(swarm, el) >= (was ? off : on);
}

export function addStage(
  swarm: SwarmEngine,
  name: string,
  budget: number,
  isActive: Stage["isActive"],
  resolve: Stage["resolve"]
) {
  swarm.stages.push({
    name,
    budget,
    isActive,
    resolve,
    active: false,
    shape: null,
    targets: new Float32Array(budget * TARGET_STRIDE),
    members: [],
    toppedUpAt: 0,
    pendingSince: 0,
  });
}

/** A stage that rebuilds its shape whenever `key()` changes. */
export function keyed(build: () => Shape | null, key: () => string) {
  let last = "";
  let shape: Shape | null = null;
  return () => {
    const next = key();
    if (next !== last) {
      last = next;
      shape = build();
    }
    return shape;
  };
}

// Order is allocation priority: small stages first, the hungry hero last so
// it takes whatever is left.
export function buildStages(swarm: SwarmEngine) {
  const n = swarm.activeN;
  const budget = (share: number, cap: number) => Math.round(Math.min(n * share, cap));

  const stack = one<HTMLElement>("[data-swarm-stack]");
  if (stack) addStackStage(swarm, stack, budget(0.3, 1200));

  const clock = one<HTMLElement>("[data-swarm-clock]");
  if (clock) addClockStages(swarm, clock, budget(0.3, 900));

  const globe = one<HTMLElement>("[data-swarm-globe]");
  if (globe) {
    const b = budget(0.5, 2000);
    const zone = visitorPlace();
    const visitor = zone && !isHome() ? zone : null;
    addStage(swarm, "globe", b, inView(swarm, globe), () =>
      swarm.mask ? (swarm.globe ??= new GlobeShape(globe, swarm.mask, b, visitor)) : null
    );
  }

  const rail = one<HTMLElement>("[data-swarm-rail]");
  if (rail) {
    const b = budget(0.36, 1300);
    const dots = Array.from(document.querySelectorAll<HTMLElement>("[data-swarm-dot]"));
    const shape = new RailShape(dots, b);
    // The rail is tall: start forming as soon as a good piece of it shows,
    // not once half a screen of it is in.
    addStage(swarm, "rail", b, inView(swarm, rail, 0.3, 0.2), () => shape);
  }

  const filters = one<HTMLElement>("[data-swarm-filters]");
  if (filters) addFilterStage(swarm, filters, budget(0.06, 220));

  const name = one<HTMLElement>("[data-swarm-name]");
  if (name) addHeroStage(swarm, name, budget(0.82, Infinity));
}

export function addStackStage(swarm: SwarmEngine, stack: HTMLElement, b: number) {
  const current = () => {
    const label = stack.dataset.swarmShow ?? "";
    const url = TECH_ICONS[label];
    return { label, img: url ? swarm.icon(url) : null };
  };
  addStage(
    swarm,
    "stack",
    b,
    inView(swarm, stack),
    keyed(
      () => {
        const { label, img } = current();
        if (!label || !swarm.fontsReady) return null;
        const paint = img ? logoLayers(img, label, swarm.family) : labelLayers(label, swarm.family);
        return new GlyphShape(stack, b, `stack:${label}`, paint);
      },
      () => {
        const { label, img } = current();
        return `${label}|${img ? 1 : 0}|${swarm.fontsReady}|${swarm.layoutVersion}`;
      }
    )
  );
}

export function addClockStages(swarm: SwarmEngine, clock: HTMLElement, b: number) {
  const seen = inView(swarm, clock);
  addStage(
    swarm,
    "clock",
    b,
    seen,
    keyed(
      () => {
        if (!swarm.fontsReady) return null;
        clock.dataset.swarmReady = "true";
        return new GlyphShape(clock, b, `clock:${clock.textContent}`, paintName(clock));
      },
      () => `${clock.textContent}|${swarm.fontsReady}|${swarm.layoutVersion}`
    )
  );
  const seconds = new SecondsShape(clock);
  addStage(swarm, "seconds", 60, seen, () => seconds);
}

export function addFilterStage(swarm: SwarmEngine, row: HTMLElement, b: number) {
  const active = () => row.querySelector<HTMLElement>("[aria-pressed='true']");
  addStage(
    swarm,
    "filter",
    b,
    inView(swarm, row),
    keyed(
      () => {
        const chip = active();
        return chip ? new CapsuleShape(chip, chip.dataset.swarmFilter ?? "", b) : null;
      },
      () => active()?.dataset.swarmFilter ?? ""
    )
  );
}

export function addHeroStage(swarm: SwarmEngine, name: HTMLElement, b: number) {
  const egg = () => {
    const word = swarm.typed.trim().toLowerCase();
    if (UKRAINE_WORDS.has(word)) return swarm.mask ? "ukraine" : null;
    if (EMOJI_WORDS[word]) return "emoji";
    const tech = TECH_WORDS[word];
    return tech && swarm.icon(TECH_ICONS[tech]) ? tech : null;
  };
  const typedBudget = Math.round(b * 0.85);
  addStage(
    swarm,
    "hero",
    b,
    inView(swarm, name),
    keyed(
      () => {
        if (!swarm.fontsReady) return null;
        name.dataset.swarmReady = "true";
        if (!swarm.typed) return new GlyphShape(name, b, "name", paintName(name), true);
        const found = egg();
        const word = swarm.typed.trim().toLowerCase();
        if (found === "ukraine" && swarm.mask) {
          return new GlyphShape(name, typedBudget, "egg:ukraine", paintUkraine(swarm.mask.ukraine));
        }
        // An emoji keeps all its own colours: half-own (the coffee) and half
        // swarm ink (the white cup) looked like a stain on a light page.
        if (found === "emoji")
          return new GlyphShape(name, typedBudget, `egg:${word}`, paintText(name, EMOJI_WORDS[word]), false, true);
        const img = found ? swarm.icon(TECH_ICONS[found]) : null;
        if (found && img) return new GlyphShape(name, typedBudget, `egg:${found}`, logoLayers(img, found, swarm.family));
        return new GlyphShape(name, typedBudget, `typed:${swarm.typed}`, paintText(name, swarm.typed));
      },
      () => `${swarm.typed}|${egg() ?? ""}|${swarm.fontsReady}|${swarm.layoutVersion}`
    )
  );
}
