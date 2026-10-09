// One fixed set of particles for the whole page — the swarm
// that walks the visitor through the site.
//
// Stages (data attributes on the sections) claim particles for a shape while
// they are in view: the name, the globe and the Stack logo, a ring round the
// active Projects filter, the current on the career rail, the clock in Contact.
// Budgets are sized so stages that share the screen never starve each other.
// Stages can be active together and each keeps its own particles. Everything left
// over is dust, and the dust has its own "weather" per section (data-swarm-
// field): drifting stars, orbits round the globe, a current rising through the
// timeline, the Approach colours, a calm Contact.
//
// Input, one reaction per channel:
//   cursor   — pushes dots away (sand)
//   click    — a small shockwave; a filter click moves the ring to it
//   keyboard — re-spells the hero; some words draw logos, emoji, Ukraine
//   scroll   — the name blows away like ash and reassembles on the way back
//   theme    — a wave from where you clicked recolours the swarm
//
// Cost: fewer particles on touch screens, half frame rate after a few idle
// seconds, and an automatic step down if the device can't hold ~45 fps.
import { TECH_ICONS } from "@/data/stack";
import { GlyphShape, paintLabel, paintLogo, paintName, paintText, paintUkraine } from "./glyphs";
import { DARK, LIGHT, mix, paletteFromCss, type Palette, type Rgb } from "./palette";
import { FLOATS_PER_POINT, createRenderer, type Renderer } from "./renderer";
import {
  GlobeShape,
  CapsuleShape,
  RailShape,
  SecondsShape,
  TARGET_STRIDE,
  loadLandMask,
  type LandMask,
  type Shape,
} from "./shapes";
import { isHome, visitorPlace } from "./visitor";

type Stage = {
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

type Box = { left: number; top: number; right: number; bottom: number };

type Field = "stars" | "orbit" | "stream" | "tint" | "calm";
type Region = { field: Field; top: number; bottom: number };

const POINTER_RADIUS = 110;
const MAX_TYPED = 14;
const TYPED_IDLE_MS = 7000;
const IDLE_MS = 6000;
/** How long a stage must stay in view before it claims particles. */
const ACTIVATE_MS = 140;
/** When a section's shape lets go, its on-screen dots gather into a "flock"
 * that stays in view and runs ahead in the direction you scroll; the next
 * section's shape is then built from it, so you can watch the swarm leave one
 * section and assemble the next. Unclaimed for this long (ms), it disperses. */
const FLOCK_MS = 3000;
/** At most this share of the swarm flies in the flock at once. */
const FLOCK_SHARE = 0.4;
/** Beyond this, a particle jumps instead of flying (a safety net only). */
const MAX_FLIGHT = 1400;
/** Margin (px) around the viewport within which a target counts as on screen. */
const ON_SCREEN = 80;
/** Dust lives this long (ms) before it fades and respawns at a random spot, so
 * no corner of the screen slowly collects or loses dust. */
const DUST_LIFE = { min: 8000, max: 22000, fade: 1200 };
/** Half-width of the band where neighbouring sections' dust weather blends. */
const BLEND = 180;
const INTERACTIVE = "a, button, input, select, textarea, label, [role='tab'], [data-swarm-globe]";

/** Words that draw a logo instead of themselves. */
const TECH_WORDS: Record<string, string> = {
  react: "React",
  next: "Next.js",
  nextjs: "Next.js",
  "next.js": "Next.js",
  ts: "TypeScript",
  typescript: "TypeScript",
  node: "Node.js",
  nodejs: "Node.js",
  nest: "Nest.js",
  nestjs: "Nest.js",
  redux: "Redux",
  prisma: "Prisma",
  tailwind: "Tailwind",
  vite: "Vite",
  vitest: "Vitest",
  zod: "Zod",
  zustand: "Zustand",
  supabase: "Supabase",
  jest: "Jest",
  cypress: "Cypress",
  scss: "SCSS",
  sass: "SCSS",
  shadcn: "shadcn",
  bem: "BEM",
  docker: "Docker",
  git: "Git",
  turbo: "Turborepo",
  turborepo: "Turborepo",
  claude: "Claude Code",
  tanstack: "React Query",
  "react query": "React Query",
  framer: "Framer Motion",
  "framer motion": "Framer Motion",
  github: "GitHub",
  telegram: "Telegram",
  linkedin: "LinkedIn",
};
/** Words that draw an emoji in its own colours. */
const EMOJI_WORDS: Record<string, string> = {
  кава: "☕",
  coffee: "☕",
  ракета: "🚀",
  rocket: "🚀",
  кіт: "🐈",
  cat: "🐈",
  серце: "❤️",
  love: "❤️",
  піца: "🍕",
  pizza: "🍕",
};
const UKRAINE_WORDS = new Set(["україна", "ukraine", "слава україні"]);

const one = <T extends Element>(selector: string) => document.querySelector<T>(selector);

/** window, typed for the development-only QA handle (see start()). */
const debugHandle = () => window as unknown as { __swarm?: unknown };

function shuffle<T>(list: T[]) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** Position along a Hilbert curve over a 1024×1024 grid: close in 2D ⇒ close here. */
function hilbert(px: number, py: number) {
  const n = 1024;
  let x = Math.min(n - 1, Math.max(0, px | 0));
  let y = Math.min(n - 1, Math.max(0, py | 0));
  let d = 0;
  for (let s = n / 2; s > 0; s >>= 1) {
    const rx = x & s ? 1 : 0;
    const ry = y & s ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    if (!ry) {
      if (rx) {
        x = n - 1 - x;
        y = n - 1 - y;
      }
      [x, y] = [y, x];
    }
  }
  return d;
}

class SwarmEngine {
  private readonly n: number;
  private activeN: number;
  private readonly px: Float32Array;
  private readonly py: Float32Array;
  private readonly vx: Float32Array;
  private readonly vy: Float32Array;
  private readonly hx: Float32Array;
  private readonly hy: Float32Array;
  private readonly colour: Float32Array;
  private readonly size: Float32Array;
  private readonly seed: Float32Array;
  private readonly depth: Float32Array;
  private readonly dust: Uint8Array;
  private readonly owner: Int16Array;
  private readonly slot: Int32Array;
  /** When each particle got its current target; new arrivals ease in. */
  private readonly assignedAt: Float32Array;
  /** When each dust particle fades out and reappears somewhere random. */
  private readonly respawnAt: Float64Array;
  /** When each particle was let go by a shape without joining the flock; it
   * then fades out riding along with the page. */
  private readonly releasedAt: Float64Array;
  /** Until when each particle flies in the flock (see FLOCK_MS). */
  private readonly flockUntil: Float64Array;
  private readonly flock = { x: 0, y: 0, vx: 0, vy: 0, size: 0 };
  /** Last scroll direction, 1 down / -1 up: the flock waits ahead of you. */
  private scrollDir = 1;
  private readonly buffer: Float32Array;

  // The canvas's own box, not window.innerWidth: with a classic scrollbar
  // (Windows) innerWidth is ~15px wider than what the canvas covers, and the
  // whole drawing was squeezed left by up to that much.
  private width: number;
  private height: number;
  private readonly coarse = window.matchMedia("(pointer: coarse)").matches;
  private dpr: number;
  private palette: Palette = DARK;
  private reduced = false;
  private stages: Stage[] = [];
  private regions: Region[] = [];
  private globe: GlobeShape | null = null;
  private mask: LandMask | null = null;
  private fontsReady = false;
  private layoutVersion = 0;
  private family = "sans-serif";
  private readonly icons = new Map<string, HTMLImageElement>();
  private typed = "";
  private typedTimer = 0;
  private readonly pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };
  private press = { down: false, x: 0, y: 0 };
  private lastDown = { x: 0, y: 0, at: -Infinity };
  private wave: { x: number; y: number; at: number } | null = null;
  private scrollY = window.scrollY;
  private last = performance.now();
  private lastInput = performance.now();
  private skipFrame = false;
  /** Longest distance a particle may visibly fly to a new target. */
  private perf = { frames: 0, total: 0, strikes: 0, tier: 0 };
  private readonly started = performance.now();
  private frameId = 0;
  private resizeTimer = 0;
  private readonly cleanups: (() => void)[] = [];

  constructor(
    private readonly renderer: Renderer,
    private readonly canvas: HTMLCanvasElement
  ) {
    this.width = canvas.clientWidth || window.innerWidth;
    this.height = canvas.clientHeight || window.innerHeight;
    // Touch screens get fewer, slightly cheaper particles; small phones still
    // need ~1100 for the name to read.
    const area = this.width * this.height;
    const cores = navigator.hardwareConcurrency || 4;
    const scale = cores <= 4 ? 0.8 : 1;
    this.n = this.coarse
      ? Math.round(Math.min(2600, Math.max(1100, (area / 420) * scale)))
      : Math.round(Math.min(4200, Math.max(1500, (area / 330) * scale)));
    this.activeN = this.n;
    this.dpr = Math.min(this.coarse ? 1.5 : 2, window.devicePixelRatio || 1);

    const n = this.n;
    this.px = new Float32Array(n);
    this.py = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.hx = new Float32Array(n);
    this.hy = new Float32Array(n);
    this.colour = new Float32Array(n * 4);
    this.size = new Float32Array(n).fill(1.5);
    this.seed = new Float32Array(n);
    this.depth = new Float32Array(n);
    this.dust = new Uint8Array(n);
    this.owner = new Int16Array(n).fill(-1);
    this.slot = new Int32Array(n).fill(-1);
    this.assignedAt = new Float32Array(n);
    this.respawnAt = Float64Array.from({ length: n }, () => performance.now() + Math.random() * DUST_LIFE.max);
    this.releasedAt = new Float64Array(n).fill(-Infinity);
    this.flockUntil = new Float64Array(n).fill(-Infinity);
    this.buffer = new Float32Array(n * FLOATS_PER_POINT);

    for (let i = 0; i < n; i++) {
      this.hx[i] = this.px[i] = Math.random() * this.width;
      this.hy[i] = this.py[i] = Math.random() * this.height;
      this.seed[i] = Math.random();
      this.depth[i] = 0.08 + Math.random() * 0.5;
      // Only a fifth of idle particles show as dust; the rest wait invisibly
      // and condense out of nowhere when a shape needs them.
      this.dust[i] = Math.random() < 0.2 ? 1 : 0;
    }
  }

  start() {
    this.renderer.resize(this.width, this.height, this.dpr);
    // Words drawn in dots (a technology without a logo) use the Stack stage's
    // typeface, so a page's design can choose it; by default it is the body's.
    this.family = getComputedStyle(one("[data-swarm-stack]") ?? document.body).fontFamily;
    Object.values(TECH_ICONS).forEach((url) => this.icon(url));
    this.buildStages();
    this.watchEnvironment();
    this.listen();
    document.fonts.ready.then(() => {
      this.fontsReady = true;
    });
    loadLandMask()
      .then((mask) => {
        this.mask = mask;
      })
      .catch((error) => console.error("swarm: globe data failed to load", error));
    this.frameId = requestAnimationFrame(this.frame);
    // Development only: a handle for the QA scripts (scripts/qa) to read the
    // particles and stages. Never present in a production build.
    if (process.env.NODE_ENV === "development") debugHandle().__swarm = this;
  }

  stop() {
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.typedTimer);
    window.clearTimeout(this.resizeTimer);
    this.cleanups.forEach((fn) => fn());
    document.querySelectorAll("[data-swarm-ready]").forEach((el) => el.removeAttribute("data-swarm-ready"));
    this.renderer.destroy();
    if (process.env.NODE_ENV === "development" && debugHandle().__swarm === this) delete debugHandle().__swarm;
  }

  // -------------------------------------------------------------------------
  // Stages
  // -------------------------------------------------------------------------

  private visibility(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const visible = Math.max(0, Math.min(r.bottom, this.height) - Math.max(r.top, 0));
    return visible / Math.max(1, Math.min(r.height, this.height * 0.5));
  }

  private inView(el: HTMLElement, on = 0.6, off = 0.45) {
    return (was: boolean) => this.visibility(el) >= (was ? off : on);
  }

  private addStage(name: string, budget: number, isActive: Stage["isActive"], resolve: Stage["resolve"]) {
    this.stages.push({
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
  private keyed(build: () => Shape | null, key: () => string) {
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
  private buildStages() {
    const n = this.activeN;
    const budget = (share: number, cap: number) => Math.round(Math.min(n * share, cap));

    const stack = one<HTMLElement>("[data-swarm-stack]");
    if (stack) this.addStackStage(stack, budget(0.3, 1200));

    const clock = one<HTMLElement>("[data-swarm-clock]");
    if (clock) this.addClockStages(clock, budget(0.3, 900));

    const globe = one<HTMLElement>("[data-swarm-globe]");
    if (globe) {
      const b = budget(0.5, 2000);
      const zone = visitorPlace();
      const visitor = zone && !isHome() ? zone : null;
      this.addStage("globe", b, this.inView(globe), () =>
        this.mask ? (this.globe ??= new GlobeShape(globe, this.mask, b, visitor)) : null
      );
    }

    const rail = one<HTMLElement>("[data-swarm-rail]");
    if (rail) {
      const b = budget(0.36, 1300);
      const dots = Array.from(document.querySelectorAll<HTMLElement>("[data-swarm-dot]"));
      const shape = new RailShape(dots, b);
      // The rail is tall: start forming as soon as a good piece of it shows,
      // not once half a screen of it is in.
      this.addStage("rail", b, this.inView(rail, 0.3, 0.2), () => shape);
    }

    const filters = one<HTMLElement>("[data-swarm-filters]");
    if (filters) this.addFilterStage(filters, budget(0.06, 220));

    const name = one<HTMLElement>("[data-swarm-name]");
    if (name) this.addHeroStage(name, budget(0.82, Infinity));
  }

  private addStackStage(stack: HTMLElement, b: number) {
    const current = () => {
      const label = stack.dataset.swarmShow ?? "";
      const url = TECH_ICONS[label];
      return { label, img: url ? this.icon(url) : null };
    };
    this.addStage(
      "stack",
      b,
      this.inView(stack),
      this.keyed(
        () => {
          const { label, img } = current();
          if (!label || !this.fontsReady) return null;
          const paint = img ? paintLogo(img, label, this.family) : paintLabel(label, this.family);
          return new GlyphShape(stack, b, `stack:${label}`, paint);
        },
        () => {
          const { label, img } = current();
          return `${label}|${img ? 1 : 0}|${this.fontsReady}|${this.layoutVersion}`;
        }
      )
    );
  }

  private addClockStages(clock: HTMLElement, b: number) {
    const seen = this.inView(clock);
    this.addStage(
      "clock",
      b,
      seen,
      this.keyed(
        () => {
          if (!this.fontsReady) return null;
          clock.dataset.swarmReady = "true";
          return new GlyphShape(clock, b, `clock:${clock.textContent}`, paintName(clock));
        },
        () => `${clock.textContent}|${this.fontsReady}|${this.layoutVersion}`
      )
    );
    const seconds = new SecondsShape(clock);
    this.addStage("seconds", 60, seen, () => seconds);
  }

  private addFilterStage(row: HTMLElement, b: number) {
    const active = () => row.querySelector<HTMLElement>("[aria-pressed='true']");
    this.addStage(
      "filter",
      b,
      this.inView(row),
      this.keyed(
        () => {
          const chip = active();
          return chip ? new CapsuleShape(chip, chip.dataset.swarmFilter ?? "", b) : null;
        },
        () => active()?.dataset.swarmFilter ?? ""
      )
    );
  }

  private addHeroStage(name: HTMLElement, b: number) {
    const egg = () => {
      const word = this.typed.trim().toLowerCase();
      if (UKRAINE_WORDS.has(word)) return this.mask ? "ukraine" : null;
      if (EMOJI_WORDS[word]) return "emoji";
      const tech = TECH_WORDS[word];
      return tech && this.icon(TECH_ICONS[tech]) ? tech : null;
    };
    const typedBudget = Math.round(b * 0.85);
    this.addStage(
      "hero",
      b,
      this.inView(name),
      this.keyed(
        () => {
          if (!this.fontsReady) return null;
          name.dataset.swarmReady = "true";
          if (!this.typed) return new GlyphShape(name, b, "name", paintName(name), true);
          const found = egg();
          const word = this.typed.trim().toLowerCase();
          if (found === "ukraine" && this.mask) {
            return new GlyphShape(name, typedBudget, "egg:ukraine", paintUkraine(this.mask.ukraine));
          }
          // An emoji keeps all its own colours: half-own (the coffee) and half
          // swarm ink (the white cup) looked like a stain on a light page.
          if (found === "emoji")
            return new GlyphShape(name, typedBudget, `egg:${word}`, paintText(name, EMOJI_WORDS[word]), false, true);
          const img = found ? this.icon(TECH_ICONS[found]) : null;
          if (found && img) return new GlyphShape(name, typedBudget, `egg:${found}`, paintLogo(img, found, this.family));
          return new GlyphShape(name, typedBudget, `typed:${this.typed}`, paintText(name, this.typed));
        },
        () => `${this.typed}|${egg() ?? ""}|${this.fontsReady}|${this.layoutVersion}`
      )
    );
  }

  private icon(url: string) {
    let img = this.icons.get(url);
    if (!img) {
      img = new Image();
      img.decoding = "async";
      img.src = url;
      this.icons.set(url, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  private updateStages(t: number, now: number) {
    this.stages.forEach((stage, index) => {
      // A stage has to stay in view for a moment before it claims particles,
      // so sections that only flash past during a fast scroll leave the swarm
      // alone; it lets go as soon as it leaves.
      const wanted = stage.isActive(stage.active);
      if (!wanted) stage.pendingSince = 0;
      else if (!stage.active && !stage.pendingSince) stage.pendingSince = now;
      stage.active = wanted && (stage.active || now - stage.pendingSince >= ACTIVATE_MS);

      const shape = stage.active ? stage.resolve() : null;
      if (shape !== stage.shape) this.reassign(stage, index, shape, t);
      else if (shape && stage.members.length < shape.count && now - stage.toppedUpAt > 400) {
        // Stages that activated while others still held particles top up as
        // those get released.
        stage.toppedUpAt = now;
        if (this.freeCount() > 40) this.reassign(stage, index, shape, t);
      }
      stage.shape?.write(stage.targets, t, this.palette, this.reduced);
    });
  }

  /** Free particles in the order a new shape should take them: the flock first
   * (that is the swarm arriving from the previous section), then the nearest
   * invisible spares. Visible dust comes last: taking it left a bald patch
   * around the shape (the timeline rail ate the dust on its side, so the other
   * side looked crowded). */
  private freeParticles(box: Box) {
    const now = performance.now();
    const free: number[] = [];
    const score = new Float32Array(this.activeN);
    for (let i = 0; i < this.activeN; i++) {
      if (this.owner[i] >= 0) continue;
      free.push(i);
      const dx = Math.max(box.left - this.px[i], 0, this.px[i] - box.right);
      const dy = Math.max(box.top - this.py[i], 0, this.py[i] - box.bottom);
      const distance = Math.hypot(dx, dy);
      const inFlock = this.flockUntil[i] > now;
      const showing = this.colour[i * 4 + 3] > 0.03;
      score[i] = inFlock ? distance - 8000 : showing ? distance + 5000 : distance;
    }
    return free.sort((a, b) => score[a] - score[b]);
  }

  private freeCount() {
    let count = 0;
    for (let i = 0; i < this.activeN; i++) if (this.owner[i] < 0) count++;
    return count;
  }

  private targetBox(targets: Float32Array, count: number): Box {
    const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (let j = 0; j < count; j++) {
      const x = targets[j * TARGET_STRIDE];
      const y = targets[j * TARGET_STRIDE + 1];
      box.left = Math.min(box.left, x);
      box.right = Math.max(box.right, x);
      box.top = Math.min(box.top, y);
      box.bottom = Math.max(box.bottom, y);
    }
    return box;
  }

  /** Gives a stage's targets to particles. Topping up keeps everyone already
   * in place where they are; a new shape is paired by locality, so dots move
   * to the nearest free spot instead of crossing the page. */
  private reassign(stage: Stage, index: number, shape: Shape | null, t: number) {
    const old = stage.members;
    if (!shape) {
      this.release(old);
      stage.members = [];
      stage.shape = null;
      return;
    }
    const topUp = shape === stage.shape;
    stage.shape = shape;
    if (stage.targets.length < shape.count * TARGET_STRIDE) {
      stage.targets = new Float32Array(shape.count * TARGET_STRIDE);
    }
    shape.write(stage.targets, t, this.palette, this.reduced);
    const box = this.targetBox(stage.targets, shape.count);

    if (topUp) {
      const filled = new Uint8Array(shape.count);
      for (const i of old) filled[this.slot[i]] = 1;
      const open = shuffle(Array.from({ length: shape.count }, (_, j) => j).filter((j) => !filled[j]));
      const fresh = this.freeParticles(box).slice(0, open.length);
      this.place(fresh, open.slice(0, fresh.length), stage, index);
      stage.members = old.concat(fresh);
      return;
    }

    const want = shape.count;
    const pool = old.length >= want ? old : old.concat(this.freeParticles(box).slice(0, want - old.length));
    const take = pool.slice(0, want);
    this.release(pool.slice(want));
    const slots = Array.from({ length: want }, (_, j) => j);
    this.place(take, take.length < want ? shuffle(slots).slice(0, take.length) : slots, stage, index);
    stage.members = take;
  }

  /** Splits a shape's slots into on-screen and off-screen ones. The best
   * particles (first in `particles`) fly to the on-screen part; the off-screen
   * part (a long timeline, say) is filled by the rest jumping there unseen,
   * instead of dots visibly streaking off the edge of the screen. */
  private place(particles: number[], slots: number[], stage: Stage, index: number) {
    const T = TARGET_STRIDE;
    const seen = (j: number) => {
      const x = stage.targets[j * T];
      const y = stage.targets[j * T + 1];
      return x > -ON_SCREEN && x < this.width + ON_SCREEN && y > -ON_SCREEN && y < this.height + ON_SCREEN;
    };
    const near = slots.filter(seen);
    const far = slots.filter((j) => !seen(j));
    const flyers = particles.slice(0, near.length);
    const jumpers = particles.slice(near.length, near.length + far.length);
    this.pair(flyers, near.slice(0, flyers.length), stage, index);
    this.pair(jumpers, far.slice(0, jumpers.length), stage, index);
    for (const i of jumpers) {
      const o = this.slot[i] * T;
      this.teleport(i, stage.targets[o], stage.targets[o + 1]);
    }
  }

  /** Matches particles to slots along a Hilbert curve over both sets, which
   * keeps neighbours together in 2D (sorting by x alone scrambled the rows). */
  private pair(particles: number[], slots: number[], stage: Stage, index: number) {
    const T = TARGET_STRIDE;
    const xs = [...particles.map((i) => this.px[i]), ...slots.map((j) => stage.targets[j * T])];
    const ys = [...particles.map((i) => this.py[i]), ...slots.map((j) => stage.targets[j * T + 1])];
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const span = Math.max(1, Math.max(...xs) - left, Math.max(...ys) - top);
    const key = (x: number, y: number) => hilbert(((x - left) / span) * 1023, ((y - top) / span) * 1023);
    const byParticle = particles.map((i) => ({ i, k: key(this.px[i], this.py[i]) })).sort((a, b) => a.k - b.k);
    const bySlot = slots
      .map((j) => ({ j, k: key(stage.targets[j * T], stage.targets[j * T + 1]) }))
      .sort((a, b) => a.k - b.k);
    const now = performance.now();
    byParticle.forEach(({ i }, n) => {
      if (this.owner[i] !== index) this.assignedAt[i] = now;
      this.flockUntil[i] = -Infinity;
      this.releasedAt[i] = -Infinity;
      this.owner[i] = index;
      this.slot[i] = bySlot[n].j;
    });
  }

  /** Let-go particles that are on screen and glowing join the flock (up to its
   * capacity); the rest fade out where they are, riding along with the page,
   * and come back as evenly spread dust. Nothing lingers as a clump or slides
   * about with the dust's parallax. */
  private release(list: number[]) {
    const now = performance.now();
    const room = this.reduced ? 0 : Math.max(0, Math.round(this.activeN * FLOCK_SHARE) - this.flock.size);
    const joining = new Set(
      list
        .filter((i) => this.colour[i * 4 + 3] > 0.08 && this.px[i] > 0 && this.px[i] < this.width && this.py[i] > 0 && this.py[i] < this.height)
        .slice(0, room)
    );
    if (joining.size && this.flock.size === 0) this.startFlock(joining);
    for (const i of list) {
      this.owner[i] = -1;
      this.slot[i] = -1;
      this.hx[i] = this.px[i];
      this.hy[i] = this.py[i];
      if (joining.has(i)) {
        this.flockUntil[i] = now + FLOCK_MS;
        this.respawnAt[i] = Infinity;
      } else {
        this.releasedAt[i] = now;
        this.respawnAt[i] = now + DUST_LIFE.fade;
      }
    }
    this.flock.size += joining.size;
  }

  /** A new flock starts where the released dots are, then heads off. */
  private startFlock(members: Set<number>) {
    let x = 0;
    let y = 0;
    for (const i of members) {
      x += this.px[i];
      y += this.py[i];
    }
    this.flock.x = x / members.size;
    this.flock.y = Math.min(this.height * 0.85, Math.max(this.height * 0.15, y / members.size));
    this.flock.vx = 0;
    this.flock.vy = 0;
  }

  /** Steers the flock ahead in the scroll direction, where the next
   * section's shape will turn up. */
  private moveFlock(dt: number) {
    const f = this.flock;
    if (!f.size) return;
    const goalX = this.width / 2;
    const goalY = this.height * (this.scrollDir > 0 ? 0.72 : 0.28);
    const keep = 0.9 ** dt;
    f.vx = (f.vx + (goalX - f.x) * 0.006 * dt) * keep;
    f.vy = (f.vy + (goalY - f.y) * 0.006 * dt) * keep;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
  }

  /** A loose, slowly turning cloud round the flock's centre: dense and bright
   * in the middle, fainter at the rim. */
  private flockTarget(i: number, t: number, out: Float32Array) {
    const f = this.flock;
    const radius = Math.min(this.width, this.height) * 0.16;
    const seed = this.seed[i];
    const r = 8 + Math.sqrt(seed) * radius;
    const spin = 0.9 * Math.sqrt(40 / (r + 30));
    const a = seed * 2291.7 + this.depth[i] * 37 + t * spin;
    const wobble = Math.sin(t * 1.7 + seed * 40) * radius * 0.06;
    const u = r / (radius + 8);
    const { ink, accent } = this.palette;
    const k = 0.35 + u * 0.65;
    out[0] = f.x + Math.cos(a) * (r + wobble);
    out[1] = f.y + Math.sin(a) * (r + wobble) * 0.62;
    out[2] = ink[0] + (accent[0] - ink[0]) * k;
    out[3] = ink[1] + (accent[1] - ink[1]) * k;
    out[4] = ink[2] + (accent[2] - ink[2]) * k;
    out[5] = 0.8 - u * 0.5;
    out[6] = (1.5 + (1 - u) * 0.9) * this.palette.dotScale;
  }

  private stage(name: string) {
    return this.stages.find((s) => s.name === name);
  }

  // -------------------------------------------------------------------------
  // Frame
  // -------------------------------------------------------------------------

  private frame = (now: number) => {
    this.frameId = requestAnimationFrame(this.frame);
    // Nobody is touching the page: half frame rate is plenty for drifting dust.
    if (now - this.lastInput > IDLE_MS && !this.wave) {
      this.skipFrame = !this.skipFrame;
      if (this.skipFrame) return;
    }
    const interval = now - this.last;
    const dt = Math.min(3, Math.max(0.25, interval / 16.667));
    this.last = now;
    const t = this.reduced ? 0 : now / 1000;

    this.readRegions();
    this.updateStages(t, now);
    this.applyScroll(now);
    this.moveFlock(dt);
    this.step(dt, t, now);
    this.renderer.draw(this.buffer, this.activeN, this.palette.additive);
    this.watchPerformance(interval, now);
  };

  /** Steps quality down (fewer particles, 1x canvas) if frames stay slow. */
  private watchPerformance(interval: number, now: number) {
    const perf = this.perf;
    if (perf.tier >= 2 || now - this.started < 3000 || now - this.lastInput > IDLE_MS) return;
    perf.frames++;
    perf.total += interval;
    if (perf.frames < 90) return;
    perf.strikes = perf.total / perf.frames > 24 ? perf.strikes + 1 : 0;
    perf.frames = 0;
    perf.total = 0;
    if (perf.strikes < 2) return;

    perf.strikes = 0;
    perf.tier++;
    this.activeN = Math.round(this.activeN * 0.6);
    this.dpr = 1;
    this.renderer.resize(this.width, this.height, this.dpr);
    this.stages.forEach((stage) => this.release(stage.members));
    for (let i = this.activeN; i < this.n; i++) this.colour[i * 4 + 3] = 0;
    this.stages = [];
    this.globe = null;
    this.buildStages();
  }

  /** Section fields stretched to meet halfway across the margins between
   * them, so every y belongs to a section and there are no "no field" gaps. */
  private readRegions() {
    const raw = Array.from(document.querySelectorAll<HTMLElement>("[data-swarm-field]"), (el) => {
      const r = el.getBoundingClientRect();
      return { field: el.dataset.swarmField as Field, top: r.top, bottom: r.bottom };
    });
    this.regions = raw.map((region, k) => ({
      field: region.field,
      top: k === 0 ? -Infinity : (raw[k - 1].bottom + region.top) / 2,
      bottom: k === raw.length - 1 ? Infinity : (region.bottom + raw[k + 1].top) / 2,
    }));
  }

  /** The field at `y`, and within BLEND px of a border the neighbouring one
   * too: `w` is the weight of `a` (1 deep inside, 0.5 on the border). */
  private fieldsAt(y: number): { a: Field; b: Field; w: number } {
    const regions = this.regions;
    const k = regions.findIndex((r) => y >= r.top && y < r.bottom);
    if (k < 0) return { a: "stars", b: "stars", w: 1 };
    const here = regions[k];
    const toTop = y - here.top;
    const toBottom = here.bottom - y;
    if (toTop < BLEND && k > 0) return { a: here.field, b: regions[k - 1].field, w: 0.5 + (0.5 * toTop) / BLEND };
    if (toBottom < BLEND && k < regions.length - 1) {
      return { a: here.field, b: regions[k + 1].field, w: 0.5 + (0.5 * toBottom) / BLEND };
    }
    return { a: here.field, b: here.field, w: 1 };
  }

  /** Shapes are anchored to content, so their particles move with the page;
   * dust moves by its own depth, which gives the background parallax. */
  private applyScroll(now: number) {
    const dy = window.scrollY - this.scrollY;
    this.scrollY = window.scrollY;
    if (!dy) return;
    this.lastInput = now;
    this.scrollDir = dy > 0 ? 1 : -1;
    for (let i = 0; i < this.activeN; i++) {
      const owned = this.owner[i] >= 0;
      // The flock belongs to the screen, not the page: it travels with you.
      if (!owned && this.flockUntil[i] > now) continue;
      const withPage = owned || now - this.releasedAt[i] < DUST_LIFE.fade;
      const shift = withPage ? dy : dy * this.depth[i];
      this.py[i] -= shift;
      if (!owned) this.hy[i] -= shift;
    }
  }

  private step(dt: number, t: number, now: number) {
    const { reduced, pointer } = this;
    const intro = Math.min(1, 0.3 + (now - this.started) / 2200);
    const r2 = POINTER_RADIUS * POINTER_RADIUS;
    const fade = Math.min(1, 0.07 * dt);
    const target = new Float32Array(7);
    const weather = this.weather();

    let flockSize = 0;
    const wave = this.wave;
    const front = wave ? (now - wave.at) * 1.5 : 0;
    if (wave && front > Math.hypot(this.width, this.height) + 100) this.wave = null;

    for (let i = 0; i < this.activeN; i++) {
      const seed = this.seed[i];
      let k: number;
      let damp: number;

      if (this.owner[i] >= 0) {
        const stage = this.stages[this.owner[i]];
        const o = this.slot[i] * TARGET_STRIDE;
        for (let c = 0; c < 7; c++) target[c] = stage.targets[o + c];
        // Newcomers start on a soft spring and tighten as they settle, so a
        // shape gathers rather than snaps.
        const settle = Math.min(1, 0.25 + (now - this.assignedAt[i]) / 900);
        k = 0.05 * (stage.shape?.stiffness ?? 1) * intro * settle * (0.55 + seed * 0.9);
        damp = 0.8;
        // Dots fly to their new spot (that flight is the swarm moving on to the
        // next section); only an absurdly long trip is cut short.
        if (Math.hypot(target[0] - this.px[i], target[1] - this.py[i]) > MAX_FLIGHT) {
          this.teleport(i, target[0], target[1]);
          this.vx[i] = 0;
          this.vy[i] = 0;
        }
      } else if (this.flockUntil[i] > now) {
        flockSize++;
        this.flockTarget(i, t, target);
        k = 0.03 * (0.6 + seed * 0.8);
        damp = 0.86;
      } else {
        if (this.flockUntil[i] > -Infinity) this.leaveFlock(i, now);
        this.dustTarget(i, dt, t, now, weather, target);
        k = 0.012;
        damp = 0.9;
      }

      let rate = reduced ? 1 : fade;
      if (reduced) {
        this.px[i] = target[0];
        this.py[i] = target[1];
      } else {
        let ax = (target[0] - this.px[i]) * k;
        let ay = (target[1] - this.py[i]) * k;
        if (pointer.active) {
          const dx = this.px[i] - pointer.x;
          const dy = this.py[i] - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2) {
            const d = Math.sqrt(d2) + 0.001;
            const f = (1 - d / POINTER_RADIUS) ** 2;
            ax += (dx / d) * f * 2.4 + pointer.vx * f * 0.09;
            ay += (dy / d) * f * 2.4 + pointer.vy * f * 0.09;
          }
        }
        if (wave) {
          // Colour holds until the wave front reaches the particle, which gets
          // a little push as it passes.
          const dx = this.px[i] - wave.x;
          const dy = this.py[i] - wave.y;
          const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
          if (d > front) rate = 0;
          else if (front - d < 60) {
            const push = (1 - (front - d) / 60) * 1.6;
            ax += (dx / d) * push;
            ay += (dy / d) * push;
          }
        }
        const keep = damp ** dt;
        this.vx[i] = (this.vx[i] + ax * dt) * keep;
        this.vy[i] = (this.vy[i] + ay * dt) * keep;
        this.px[i] += this.vx[i] * dt;
        this.py[i] += this.vy[i] * dt;
      }

      const c = i * 4;
      this.colour[c] += (target[2] - this.colour[c]) * rate;
      this.colour[c + 1] += (target[3] - this.colour[c + 1]) * rate;
      this.colour[c + 2] += (target[4] - this.colour[c + 2]) * rate;
      this.colour[c + 3] += (target[5] - this.colour[c + 3]) * (reduced ? 1 : fade);
      this.size[i] += (target[6] - this.size[i]) * (reduced ? 1 : fade);

      const o = i * FLOATS_PER_POINT;
      this.buffer[o] = this.px[i];
      this.buffer[o + 1] = this.py[i];
      this.buffer[o + 2] = this.colour[c];
      this.buffer[o + 3] = this.colour[c + 1];
      this.buffer[o + 4] = this.colour[c + 2];
      this.buffer[o + 5] = this.colour[c + 3];
      this.buffer[o + 6] = this.size[i];
    }

    pointer.vx *= 0.85;
    pointer.vy *= 0.85;
    this.flock.size = flockSize;
  }

  /** Nobody claimed the flock in time: its dots fade out where they are. */
  private leaveFlock(i: number, now: number) {
    this.flockUntil[i] = -Infinity;
    this.hx[i] = this.px[i];
    this.hy[i] = this.py[i];
    this.releasedAt[i] = now;
    this.respawnAt[i] = now + DUST_LIFE.fade;
  }

  // -------------------------------------------------------------------------
  // Dust weather
  // -------------------------------------------------------------------------

  /** Per-frame inputs for the section fields. */
  private weather() {
    const globe = one<HTMLElement>("[data-swarm-globe]")?.getBoundingClientRect();
    const cards = Array.from(document.querySelectorAll<HTMLElement>("#approach ol > li"), (li) =>
      li.getBoundingClientRect()
    );
    const { palette } = this;
    return {
      orbit: globe ? { x: globe.left + globe.width / 2, y: globe.top + globe.height / 2 } : null,
      cards,
      tones: [palette.emerald, palette.pink, palette.sky] as Rgb[],
      orbitColour: mix(palette.dust, palette.sky, 0.55),
      calmColour: mix(palette.dust, palette.emerald, 0.35),
    };
  }

  private dustTarget(
    i: number,
    dt: number,
    t: number,
    now: number,
    weather: ReturnType<SwarmEngine["weather"]>,
    out: Float32Array
  ) {
    const { palette, reduced } = this;
    const seed = this.seed[i];
    if (now - this.releasedAt[i] < DUST_LIFE.fade) {
      // Just let go and not in the flock: fade out where it is, on the page.
      const c = i * 4;
      out[0] = this.hx[i];
      out[1] = this.hy[i];
      out[2] = this.colour[c];
      out[3] = this.colour[c + 1];
      out[4] = this.colour[c + 2];
      out[5] = 0;
      out[6] = this.size[i];
      return;
    }
    const life = reduced ? 1 : this.dustLife(i, now);
    const { a, b, w } = this.fieldsAt(this.hy[i]);
    if (!reduced) this.drift(i, dt, t, a, b, w, weather.orbit);

    // Near a section border the two sections' weather is blended, so dust
    // changes colour and pace gradually instead of at a hard line.
    const sa = this.fieldStyle(a, i, weather);
    const sb = b === a ? sa : this.fieldStyle(b, i, weather);
    const colour = w === 1 ? sa.colour : mix(sb.colour, sa.colour, w);
    const strength = sb.strength + (sa.strength - sb.strength) * w;
    // Fields with motion of their own show a few more particles, or the
    // motion would be too sparse to read.
    const extra = this.depth[i] < 0.2 ? sb.extra + (sa.extra - sb.extra) * w : 0;
    const visibility = this.dust[i] === 1 ? 1 : extra;

    const twinkle = reduced ? 1 : 0.55 + 0.45 * Math.sin(t * (0.6 + seed) + seed * 50);
    out[0] = this.hx[i];
    out[1] = this.hy[i];
    out[2] = colour[0];
    out[3] = colour[1];
    out[4] = colour[2];
    out[5] = palette.dustAlpha * twinkle * (0.5 + seed) * strength * visibility * life;
    out[6] = (1.7 + seed * 1.4) * palette.dotScale;
  }

  /** 1 while a dust particle lives, fading to 0 at its end; once faded out
   * it reappears somewhere random with a new lifespan. */
  private dustLife(i: number, now: number) {
    const left = this.respawnAt[i] - now;
    if (left <= 0 && this.colour[i * 4 + 3] < 0.02) {
      this.teleport(i, Math.random() * this.width, Math.random() * this.height);
      this.respawnAt[i] = now + DUST_LIFE.min + Math.random() * (DUST_LIFE.max - DUST_LIFE.min);
      return 1;
    }
    return Math.min(1, Math.max(0, left / DUST_LIFE.fade));
  }

  private fieldStyle(field: Field, i: number, weather: ReturnType<SwarmEngine["weather"]>) {
    const { palette } = this;
    switch (field) {
      case "orbit":
        return { colour: weather.orbitColour, strength: 1.35, extra: 1 };
      case "stream":
        return { colour: palette.accent, strength: 1.35, extra: 1 };
      case "calm":
        return { colour: weather.calmColour, strength: 0.7, extra: 0 };
      case "tint":
        return weather.cards.length
          ? { colour: weather.tones[this.nearestCard(i, weather.cards) % weather.tones.length], strength: 1.5, extra: 1 }
          : { colour: palette.dust, strength: 1, extra: 0 };
      default:
        return { colour: palette.dust, strength: 1, extra: 0 };
    }
  }

  private nearestCard(i: number, cards: DOMRect[]) {
    let best = 0;
    let bestD = Infinity;
    cards.forEach((r, k) => {
      const d = Math.hypot(this.hx[i] - (r.left + r.width / 2), this.hy[i] - (r.top + r.height / 2));
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    });
    return best;
  }

  private fieldVelocity(field: Field, i: number, t: number, orbit: { x: number; y: number } | null): [number, number] {
    const x = this.hx[i];
    const y = this.hy[i];
    const depth = this.depth[i];
    if (field === "orbit" && orbit) {
      // Slow circles round the globe, inner ones faster.
      const dx = x - orbit.x;
      const dy = y - orbit.y;
      const r = Math.max(60, Math.hypot(dx, dy));
      const speed = 0.45 * Math.sqrt(220 / r) * (0.6 + depth);
      return [(-dy / r) * speed, (dx / r) * speed];
    }
    if (field === "stream") {
      // A gentle current rising through the timeline, towards the present.
      return [Math.sin(t * 0.5 + this.seed[i] * 12) * 0.12, -(0.18 + depth * 0.35)];
    }
    // Curl of a stream function ψ = sin(ax + bt)·cos(cy − dt): a divergence-
    // free flow, so drifting dust never piles up in one place and thins out
    // in another (the old angle field did, which bunched dust on one side).
    const ka = 0.0021;
    const kc = 0.0017;
    const u = x * ka + t * 0.07;
    const v = y * kc - t * 0.05;
    const speed = ((0.12 + depth * 0.35) * (field === "calm" ? 0.35 : 1)) / ka;
    return [-kc * Math.sin(u) * Math.sin(v) * speed, -ka * Math.cos(u) * Math.cos(v) * speed];
  }

  /** Moves a dust particle's home by its section's field (blended at borders). */
  private drift(i: number, dt: number, t: number, a: Field, b: Field, w: number, orbit: { x: number; y: number } | null) {
    const [ax, ay] = this.fieldVelocity(a, i, t, orbit);
    const [bx, by] = b === a ? [ax, ay] : this.fieldVelocity(b, i, t, orbit);
    this.hx[i] += (bx + (ax - bx) * w) * dt;
    this.hy[i] += (by + (ay - by) * w) * dt;

    const m = 30;
    // Land a little inside the opposite edge: where the flow points outwards
    // at both edges, wrapping exactly onto the far edge sent the same dot back
    // and forth across the screen every frame.
    const inset = 2 * m - 12;
    if (this.hx[i] < -m) this.wrap(i, this.width + inset, 0);
    else if (this.hx[i] > this.width + m) this.wrap(i, -(this.width + inset), 0);
    if (this.hy[i] < -m) this.wrap(i, 0, this.height + inset);
    else if (this.hy[i] > this.height + m) this.wrap(i, 0, -(this.height + inset));
  }

  /** Moves dust to the other side of the screen, fading it back in there. */
  private wrap(i: number, dx: number, dy: number) {
    this.hx[i] += dx;
    this.hy[i] += dy;
    this.px[i] += dx;
    this.py[i] += dy;
    this.colour[i * 4 + 3] = 0;
  }

  /** Moves a particle without it visibly flying there: it fades back in. */
  private teleport(i: number, x: number, y: number) {
    this.hx[i] = this.px[i] = x;
    this.hy[i] = this.py[i] = y;
    this.colour[i * 4 + 3] = 0;
  }

  private burst(x: number, y: number, radius: number, strength: number) {
    for (let i = 0; i < this.activeN; i++) {
      const dx = this.px[i] - x;
      const dy = this.py[i] - y;
      const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
      if (d > radius) continue;
      const f = (1 - d / radius) ** 1.5 * strength * (0.6 + this.seed[i] * 0.8);
      this.vx[i] += (dx / d) * f;
      this.vy[i] += (dy / d) * f;
    }
  }

  // -------------------------------------------------------------------------
  // Input
  // -------------------------------------------------------------------------

  private on<K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, options?: AddEventListenerOptions) {
    window.addEventListener(type, fn, options);
    this.cleanups.push(() => window.removeEventListener(type, fn, options));
  }

  private listen() {
    this.on("pointermove", this.onMove, { passive: true });
    this.on("pointerdown", (e) => {
      this.lastInput = performance.now();
      this.lastDown = { x: e.clientX, y: e.clientY, at: performance.now() };
      const interactive = (e.target as Element | null)?.closest(INTERACTIVE);
      this.press = { down: e.button === 0 && !interactive, x: e.clientX, y: e.clientY };
    });
    this.on("pointerup", (e) => {
      const moved = Math.hypot(e.clientX - this.press.x, e.clientY - this.press.y) > 8;
      if (this.press.down && !moved && !this.reduced) this.burst(e.clientX, e.clientY, 320, 26);
      this.press.down = false;
      if (e.pointerType !== "mouse") this.pointer.active = false;
    });
    this.on("pointercancel", () => {
      this.press.down = false;
      this.pointer.active = false;
    });
    const leave = () => {
      this.pointer.active = false;
    };
    document.documentElement.addEventListener("pointerleave", leave);
    this.cleanups.push(() => document.documentElement.removeEventListener("pointerleave", leave));

    this.on("keydown", this.onKey);
    // Also catches the scrollbar appearing or going away, which changes the
    // canvas width without a window resize.
    const sized = new ResizeObserver(() => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(this.onResize, 120);
    });
    sized.observe(this.canvas);
    this.cleanups.push(() => sized.disconnect());
    this.listenGlobeDrag();
  }

  private onMove = (e: PointerEvent) => {
    const p = this.pointer;
    if (p.active) {
      p.vx = e.clientX - p.x;
      p.vy = e.clientY - p.y;
    }
    p.x = e.clientX;
    p.y = e.clientY;
    p.active = e.pointerType === "mouse" || e.pressure > 0;
    this.lastInput = performance.now();
  };

  private listenGlobeDrag() {
    const el = one<HTMLElement>("[data-swarm-globe]");
    if (!el) return;
    let lastX = 0;
    const down = (e: PointerEvent) => {
      if (!this.globe) return;
      el.setPointerCapture(e.pointerId);
      lastX = e.clientX;
      this.globe.spinVelocity = 0;
      el.dataset.dragging = "true";
    };
    const move = (e: PointerEvent) => {
      if (!this.globe || el.dataset.dragging !== "true") return;
      const delta = (e.clientX - lastX) * 0.009;
      lastX = e.clientX;
      this.globe.spin += delta;
      this.globe.spinVelocity = delta;
    };
    const up = () => {
      delete el.dataset.dragging;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    this.cleanups.push(() => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    });
  }

  /** Typing while the name is on screen re-spells it in dots. */
  private onKey = (e: KeyboardEvent) => {
    this.lastInput = performance.now();
    if (!this.stage("hero")?.active) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

    let next = this.typed;
    if (e.key === "Escape") next = "";
    else if (e.key === "Backspace" && next) next = Array.from(next).slice(0, -1).join("");
    else if (Array.from(e.key).length === 1 && (e.key !== " " || next)) {
      next = Array.from(next + e.key).slice(0, MAX_TYPED).join("");
    } else return;

    // Space would scroll the page mid-word, Backspace may navigate back.
    if (e.key === " " || e.key === "Backspace") e.preventDefault();
    this.setTyped(next);
  };

  private setTyped(text: string) {
    this.typed = text.trim() ? text : "";
    window.clearTimeout(this.typedTimer);
    if (this.typed) this.typedTimer = window.setTimeout(() => this.setTyped(""), TYPED_IDLE_MS);
    const hint = one<HTMLElement>("[data-swarm-hint]");
    if (hint) hint.dataset.typing = this.typed ? "true" : "false";
  }

  private onResize = () => {
    this.width = this.canvas.clientWidth || window.innerWidth;
    this.height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.resize(this.width, this.height, this.dpr);
    this.layoutVersion++;
    this.lastInput = performance.now();
  };

  private watchEnvironment() {
    const root = document.documentElement;
    // The colours are CSS custom properties on :root (globals.css), one set
    // per issue. Each set is read once, on first use, so a palette keeps its
    // identity (the glyph colour caches and the check below rely on that).
    const palettes = new Map<boolean, Palette | null>();
    const readTheme = () => {
      const dark = root.classList.contains("dark");
      if (!palettes.has(dark)) palettes.set(dark, paletteFromCss(root));
      const next = palettes.get(dark) ?? (dark ? DARK : LIGHT);
      if (next === this.palette) return;
      // Recolour as a wave from wherever the visitor just clicked (the theme
      // toggle, in practice); the very first read is not a switch.
      const recent = performance.now() - this.lastDown.at < 1500;
      if (performance.now() - this.started > 500 && !this.reduced) {
        this.wave = recent
          ? { x: this.lastDown.x, y: this.lastDown.y, at: performance.now() }
          : { x: this.width - 60, y: 60, at: performance.now() };
      }
      this.palette = next;
    };
    readTheme();
    const observer = new MutationObserver(readTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    this.cleanups.push(() => observer.disconnect());

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const readMotion = () => {
      this.reduced = motion.matches;
    };
    readMotion();
    motion.addEventListener("change", readMotion);
    this.cleanups.push(() => motion.removeEventListener("change", readMotion));
  }
}

/** Starts the swarm on `canvas`; returns the cleanup. Without WebGL the page
 * simply keeps its plain text heading. */
export function startSwarm(canvas: HTMLCanvasElement): () => void {
  const renderer = createRenderer(canvas);
  if (!renderer) return () => {};
  const engine = new SwarmEngine(renderer, canvas);
  engine.start();
  return () => engine.stop();
}
