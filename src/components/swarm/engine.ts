// One fixed set of particles for the whole page — the swarm that walks the
// visitor through the site. The engine owns the particles and runs the frame;
// the rest lives in modules that work on it:
//   scenes      the shapes sections ask for while they are in view
//   allocation  which particles a shape gets, and what it lets go
//   flock       the cloud that carries the swarm between sections
//   dust        everything else, with each section's "weather"
//   input       pointer, keyboard, globe drag, resize, theme, reduced motion
//   quality     particle count, idle half rate, automatic step down
// Scrolling moves shapes with the page and dust by its depth (parallax); the
// name blows away like ash on the way down and reassembles on the way back.
import { TECH_ICONS } from "@/data/stack";

import { updateStages } from "./allocation";
import { one } from "./dom";
import { DUST_LIFE, dustTarget, readRegions, readWeather, type Region } from "./dust";
import { flockTarget, leaveFlock, moveFlock } from "./flock";
import { listen, watchEnvironment } from "./input";
import { DARK, type Palette } from "./palette";
import { IDLE_MS, particleCount, watchPerformance } from "./quality";
import { FLOATS_PER_POINT, createRenderer, type Renderer } from "./renderer";
import { buildStages, type Stage } from "./scenes";
import { TARGET_STRIDE, loadLandMask, type GlobeShape, type LandMask } from "./shapes";

const POINTER_RADIUS = 110;
/** Beyond this, a particle jumps instead of flying (a safety net only). */
const MAX_FLIGHT = 1400;

/** window, typed for the development-only QA handle (see start()). */
const debugHandle = () => window as unknown as { __swarm?: unknown };

/** The swarm's state and frame loop. Its fields are shared with the modules
 * above, so they are public; nothing outside the swarm uses them (apart from
 * scripts/qa, through the development-only handle). */
export class SwarmEngine {
  readonly n: number;
  activeN: number;
  readonly px: Float32Array;
  readonly py: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly hx: Float32Array;
  readonly hy: Float32Array;
  readonly colour: Float32Array;
  readonly size: Float32Array;
  readonly seed: Float32Array;
  readonly depth: Float32Array;
  readonly dust: Uint8Array;
  readonly owner: Int16Array;
  readonly slot: Int32Array;
  /** When each particle got its current target; new arrivals ease in. */
  readonly assignedAt: Float32Array;
  /** When each dust particle fades out and reappears somewhere random. */
  readonly respawnAt: Float64Array;
  /** When each particle was let go by a shape without joining the flock; it
   * then fades out riding along with the page. */
  readonly releasedAt: Float64Array;
  /** Until when each particle flies in the flock (see FLOCK_MS). */
  readonly flockUntil: Float64Array;
  readonly flock = { x: 0, y: 0, vx: 0, vy: 0, size: 0 };
  /** Last scroll direction, 1 down / -1 up: the flock waits ahead of you. */
  scrollDir = 1;
  readonly buffer: Float32Array;

  // The canvas's own box, not window.innerWidth: with a classic scrollbar
  // (Windows) innerWidth is ~15px wider than what the canvas covers, and the
  // whole drawing was squeezed left by up to that much.
  width: number;
  height: number;
  readonly coarse = window.matchMedia("(pointer: coarse)").matches;
  dpr: number;
  palette: Palette = DARK;
  reduced = false;
  stages: Stage[] = [];
  regions: Region[] = [];
  globe: GlobeShape | null = null;
  mask: LandMask | null = null;
  fontsReady = false;
  layoutVersion = 0;
  family = "sans-serif";
  readonly icons = new Map<string, HTMLImageElement>();
  typed = "";
  typedTimer = 0;
  readonly pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };
  press = { down: false, x: 0, y: 0 };
  lastDown = { x: 0, y: 0, at: -Infinity };
  wave: { x: number; y: number; at: number } | null = null;
  scrollY = window.scrollY;
  last = performance.now();
  lastInput = performance.now();
  skipFrame = false;
  /** Frame times for the automatic step down (quality.ts). */
  perf = { frames: 0, total: 0, strikes: 0, tier: 0 };
  readonly started = performance.now();
  frameId = 0;
  resizeTimer = 0;
  readonly cleanups: (() => void)[] = [];

  constructor(
    readonly renderer: Renderer,
    readonly canvas: HTMLCanvasElement
  ) {
    this.width = canvas.clientWidth || window.innerWidth;
    this.height = canvas.clientHeight || window.innerHeight;
    this.n = particleCount(this.width, this.height, this.coarse);
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
    buildStages(this);
    watchEnvironment(this);
    listen(this);
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

  /** A technology's logo, once it has loaded (it starts loading on first ask). */
  icon(url: string) {
    let img = this.icons.get(url);
    if (!img) {
      img = new Image();
      img.decoding = "async";
      img.src = url;
      this.icons.set(url, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  stage(name: string) {
    return this.stages.find((s) => s.name === name);
  }

  /** Moves a particle without it visibly flying there: it fades back in. */
  teleport(i: number, x: number, y: number) {
    this.hx[i] = this.px[i] = x;
    this.hy[i] = this.py[i] = y;
    this.colour[i * 4 + 3] = 0;
  }

  /** A click's shockwave: pushes particles away from (x, y). */
  burst(x: number, y: number, radius: number, strength: number) {
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

    readRegions(this);
    updateStages(this, t, now);
    this.applyScroll(now);
    moveFlock(this, dt);
    this.step(dt, t, now);
    this.renderer.draw(this.buffer, this.activeN, this.palette.additive);
    watchPerformance(this, interval, now);
  };

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

  /** Moves every particle towards its target (a shape's slot, the flock or
   * its dust home), adds the pointer's push and the theme wave, and writes
   * the result into the vertex buffer. The hot loop, kept in one place. */
  private step(dt: number, t: number, now: number) {
    const { reduced, pointer } = this;
    const intro = Math.min(1, 0.3 + (now - this.started) / 2200);
    const r2 = POINTER_RADIUS * POINTER_RADIUS;
    const fade = Math.min(1, 0.07 * dt);
    const target = new Float32Array(7);
    const weather = readWeather(this);

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
        flockTarget(this, i, t, target);
        k = 0.03 * (0.6 + seed * 0.8);
        damp = 0.86;
      } else {
        if (this.flockUntil[i] > -Infinity) leaveFlock(this, i, now);
        dustTarget(this, i, dt, t, now, weather, target);
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
