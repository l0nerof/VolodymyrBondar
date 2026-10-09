// Everything no shape holds is dust, and the dust has its own "weather" per
// section (data-swarm-field): drifting stars, orbits round the globe, a
// current rising through the timeline, the Approach colours, a calm Contact.
import { one } from "./dom";
import type { SwarmEngine } from "./engine";
import { mix, type Rgb } from "./palette";

export type Field = "stars" | "orbit" | "stream" | "tint" | "calm";
export type Region = { field: Field; top: number; bottom: number };
export type Weather = ReturnType<typeof readWeather>;

/** Dust lives this long (ms) before it fades and respawns at a random spot, so
 * no corner of the screen slowly collects or loses dust. */
export const DUST_LIFE = { min: 8000, max: 22000, fade: 1200 };
/** Half-width of the band where neighbouring sections' dust weather blends. */
const BLEND = 180;

/** Section fields stretched to meet halfway across the margins between
 * them, so every y belongs to a section and there are no "no field" gaps. */
export function readRegions(swarm: SwarmEngine) {
  const raw = Array.from(document.querySelectorAll<HTMLElement>("[data-swarm-field]"), (el) => {
    const r = el.getBoundingClientRect();
    return { field: el.dataset.swarmField as Field, top: r.top, bottom: r.bottom };
  });
  swarm.regions = raw.map((region, k) => ({
    field: region.field,
    top: k === 0 ? -Infinity : (raw[k - 1].bottom + region.top) / 2,
    bottom: k === raw.length - 1 ? Infinity : (region.bottom + raw[k + 1].top) / 2,
  }));
}

/** The field at `y`, and within BLEND px of a border the neighbouring one
 * too: `w` is the weight of `a` (1 deep inside, 0.5 on the border). */
export function fieldsAt(swarm: SwarmEngine, y: number): { a: Field; b: Field; w: number } {
  const regions = swarm.regions;
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

/** Per-frame inputs for the section fields. */
export function readWeather(swarm: SwarmEngine) {
  const globe = one<HTMLElement>("[data-swarm-globe]")?.getBoundingClientRect();
  const cards = Array.from(document.querySelectorAll<HTMLElement>("#approach ol > li"), (li) =>
    li.getBoundingClientRect()
  );
  const { palette } = swarm;
  return {
    orbit: globe ? { x: globe.left + globe.width / 2, y: globe.top + globe.height / 2 } : null,
    cards,
    tones: [palette.emerald, palette.pink, palette.sky] as Rgb[],
    orbitColour: mix(palette.dust, palette.sky, 0.55),
    calmColour: mix(palette.dust, palette.emerald, 0.35),
  };
}

export function dustTarget(
  swarm: SwarmEngine,
  i: number,
  dt: number,
  t: number,
  now: number,
  weather: Weather,
  out: Float32Array
) {
  const { palette, reduced } = swarm;
  const seed = swarm.seed[i];
  if (now - swarm.releasedAt[i] < DUST_LIFE.fade) {
    // Just let go and not in the flock: fade out where it is, on the page.
    const c = i * 4;
    out[0] = swarm.hx[i];
    out[1] = swarm.hy[i];
    out[2] = swarm.colour[c];
    out[3] = swarm.colour[c + 1];
    out[4] = swarm.colour[c + 2];
    out[5] = 0;
    out[6] = swarm.size[i];
    return;
  }
  const life = reduced ? 1 : dustLife(swarm, i, now);
  const { a, b, w } = fieldsAt(swarm, swarm.hy[i]);
  if (!reduced) drift(swarm, i, dt, t, a, b, w, weather.orbit);

  // Near a section border the two sections' weather is blended, so dust
  // changes colour and pace gradually instead of at a hard line.
  const sa = fieldStyle(swarm, a, i, weather);
  const sb = b === a ? sa : fieldStyle(swarm, b, i, weather);
  const colour = w === 1 ? sa.colour : mix(sb.colour, sa.colour, w);
  const strength = sb.strength + (sa.strength - sb.strength) * w;
  // Fields with motion of their own show a few more particles, or the
  // motion would be too sparse to read.
  const extra = swarm.depth[i] < 0.2 ? sb.extra + (sa.extra - sb.extra) * w : 0;
  const visibility = swarm.dust[i] === 1 ? 1 : extra;

  const twinkle = reduced ? 1 : 0.55 + 0.45 * Math.sin(t * (0.6 + seed) + seed * 50);
  out[0] = swarm.hx[i];
  out[1] = swarm.hy[i];
  out[2] = colour[0];
  out[3] = colour[1];
  out[4] = colour[2];
  out[5] = palette.dustAlpha * twinkle * (0.5 + seed) * strength * visibility * life;
  out[6] = (1.7 + seed * 1.4) * palette.dotScale;
}

/** 1 while a dust particle lives, fading to 0 at its end; once faded out
 * it reappears somewhere random with a new lifespan. */
export function dustLife(swarm: SwarmEngine, i: number, now: number) {
  const left = swarm.respawnAt[i] - now;
  if (left <= 0 && swarm.colour[i * 4 + 3] < 0.02) {
    swarm.teleport(i, Math.random() * swarm.width, Math.random() * swarm.height);
    swarm.respawnAt[i] = now + DUST_LIFE.min + Math.random() * (DUST_LIFE.max - DUST_LIFE.min);
    return 1;
  }
  return Math.min(1, Math.max(0, left / DUST_LIFE.fade));
}

export function fieldStyle(swarm: SwarmEngine, field: Field, i: number, weather: Weather) {
  const { palette } = swarm;
  switch (field) {
    case "orbit":
      return { colour: weather.orbitColour, strength: 1.35, extra: 1 };
    case "stream":
      return { colour: palette.accent, strength: 1.35, extra: 1 };
    case "calm":
      return { colour: weather.calmColour, strength: 0.7, extra: 0 };
    case "tint":
      return weather.cards.length
        ? { colour: weather.tones[nearestCard(swarm, i, weather.cards) % weather.tones.length], strength: 1.5, extra: 1 }
        : { colour: palette.dust, strength: 1, extra: 0 };
    default:
      return { colour: palette.dust, strength: 1, extra: 0 };
  }
}

export function nearestCard(swarm: SwarmEngine, i: number, cards: DOMRect[]) {
  let best = 0;
  let bestD = Infinity;
  cards.forEach((r, k) => {
    const d = Math.hypot(swarm.hx[i] - (r.left + r.width / 2), swarm.hy[i] - (r.top + r.height / 2));
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  });
  return best;
}

export function fieldVelocity(
  swarm: SwarmEngine,
  field: Field,
  i: number,
  t: number,
  orbit: { x: number; y: number } | null
): [number, number] {
  const x = swarm.hx[i];
  const y = swarm.hy[i];
  const depth = swarm.depth[i];
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
    return [Math.sin(t * 0.5 + swarm.seed[i] * 12) * 0.12, -(0.18 + depth * 0.35)];
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
export function drift(
  swarm: SwarmEngine,
  i: number,
  dt: number,
  t: number,
  a: Field,
  b: Field,
  w: number,
  orbit: { x: number; y: number } | null
) {
  const [ax, ay] = fieldVelocity(swarm, a, i, t, orbit);
  const [bx, by] = b === a ? [ax, ay] : fieldVelocity(swarm, b, i, t, orbit);
  swarm.hx[i] += (bx + (ax - bx) * w) * dt;
  swarm.hy[i] += (by + (ay - by) * w) * dt;

  const m = 30;
  // Land a little inside the opposite edge: where the flow points outwards
  // at both edges, wrapping exactly onto the far edge sent the same dot back
  // and forth across the screen every frame.
  const inset = 2 * m - 12;
  if (swarm.hx[i] < -m) wrap(swarm, i, swarm.width + inset, 0);
  else if (swarm.hx[i] > swarm.width + m) wrap(swarm, i, -(swarm.width + inset), 0);
  if (swarm.hy[i] < -m) wrap(swarm, i, 0, swarm.height + inset);
  else if (swarm.hy[i] > swarm.height + m) wrap(swarm, i, 0, -(swarm.height + inset));
}

/** Moves dust to the other side of the screen, fading it back in there. */
export function wrap(swarm: SwarmEngine, i: number, dx: number, dy: number) {
  swarm.hx[i] += dx;
  swarm.hy[i] += dy;
  swarm.px[i] += dx;
  swarm.py[i] += dy;
  swarm.colour[i * 4 + 3] = 0;
}
