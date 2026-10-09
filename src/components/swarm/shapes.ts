// Every shape the swarm can hold. A shape owns no particles: it
// writes `count` target points (viewport px + colour + size) each frame, and the
// engine springs whichever particles it assigned towards them. Shapes read their
// anchor's rect on every write, so they scroll with the page for free.
import { type Palette, type Rgb } from "./palette";

export const TARGET_STRIDE = 7; // x, y, r, g, b, a, size

export interface Shape {
  /** A new key means the engine reassigns particles; same key keeps them. */
  readonly key: string;
  readonly count: number;
  /** Multiplies the spring constant; higher holds the shape tighter. */
  readonly stiffness: number;
  /** `reduced`: the visitor prefers reduced motion; scroll-driven effects stop. */
  write(out: Float32Array, t: number, palette: Palette, reduced: boolean): void;
}

export function put(
  out: Float32Array,
  i: number,
  x: number,
  y: number,
  c: Rgb,
  a: number,
  size: number
) {
  const o = i * TARGET_STRIDE;
  out[o] = x;
  out[o + 1] = y;
  out[o + 2] = c[0];
  out[o + 3] = c[1];
  out[o + 4] = c[2];
  out[o + 5] = a;
  out[o + 6] = size;
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ---------------------------------------------------------------------------
// Globe: dotted land, Ukraine in flag colours, a pulse on Kyiv
// ---------------------------------------------------------------------------

export type LandMask = {
  width: number;
  height: number;
  kind: Uint8Array;
  /** Ukraine's outline in [lon, lat] rings, for drawing it large in the hero. */
  ukraine: number[][][];
};

type Geometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };
type GeoJson = { features: { properties: { name: string }; geometry: Geometry }[] };

/** Rasterises the existing globe GeoJSON once: 0 sea, 1 land, 2 Ukraine. */
export async function loadLandMask(): Promise<LandMask> {
  const geo = (await import("@/data/globe.json")).default as unknown as GeoJson;
  const width = 720;
  const height = 360;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("swarm: no 2D context for the land mask");

  const draw = (geometry: Geometry, fill: string) => {
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    ctx.fillStyle = fill;
    for (const polygon of polygons) {
      ctx.beginPath();
      for (const ring of polygon) {
        ring.forEach(([lon, lat], k) => {
          const x = ((lon + 180) / 360) * width;
          const y = ((90 - lat) / 180) * height;
          if (k) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        });
        ctx.closePath();
      }
      ctx.fill("evenodd");
    }
  };

  const ukraine = geo.features.find((f) => f.properties.name === "Ukraine");
  for (const feature of geo.features) if (feature !== ukraine) draw(feature.geometry, "#0000ff");
  if (ukraine) draw(ukraine.geometry, "#ff00ff");

  const { data } = ctx.getImageData(0, 0, width, height);
  const kind = new Uint8Array(width * height);
  for (let i = 0; i < kind.length; i++) {
    if (data[i * 4] > 127) kind[i] = 2;
    else if (data[i * 4 + 2] > 127) kind[i] = 1;
  }
  const ukraineRings = !ukraine
    ? []
    : ukraine.geometry.type === "Polygon"
      ? ukraine.geometry.coordinates
      : ukraine.geometry.coordinates.flat();
  return { width, height, kind, ukraine: ukraineRings };
}

function kindAt(mask: LandMask, lat: number, lon: number) {
  const x = Math.min(mask.width - 1, Math.max(0, Math.floor(((lon + 180) / 360) * mask.width)));
  const y = Math.min(mask.height - 1, Math.max(0, Math.floor(((90 - lat) / 180) * mask.height)));
  return mask.kind[y * mask.width + x];
}

const RAD = Math.PI / 180;
const UKRAINE_MID_LAT = 48.4; // flag split: blue above, yellow below

// Point kinds inside the globe shape
const LAND = 0;
const UA_BLUE = 1;
const UA_YELLOW = 2;
const RIM = 3;
const PULSE = 4;
const ARC = 5;
const VISITOR_PULSE = 6;
const RIM_COUNT = 120;
const PULSE_COUNT = 30;
const ARC_COUNT = 160;

const unit = (latDeg: number, lonDeg: number): [number, number, number] => {
  const lat = latDeg * RAD;
  const lon = lonDeg * RAD;
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
};

/** Point `s` of the way along the great circle from a to b. */
function slerp(a: number[], b: number[], omega: number, s: number) {
  const sin = Math.sin(omega) || 1;
  const wa = Math.sin((1 - s) * omega) / sin;
  const wb = Math.sin(s * omega) / sin;
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
}

export type GlobePlace = { lat: number; lon: number };

export class GlobeShape implements Shape {
  readonly key = "globe";
  readonly stiffness = 1.6;
  readonly count: number;
  private readonly xyz: Float32Array;
  private readonly kinds: Uint8Array;
  private readonly seeds: Float32Array;
  private readonly kyiv = unit(50.45, 30.52);
  private readonly visitor: [number, number, number] | null;
  private readonly omega: number;
  private readonly yawBase: number;
  private readonly tiltBase: number;
  /** Extra yaw from dragging, with inertia. Owned here so it survives scenes. */
  spin = 0;
  spinVelocity = 0;

  constructor(private readonly el: HTMLElement, mask: LandMask, budget: number, visitor: GlobePlace | null) {
    const xyz: number[] = [];
    const kinds: number[] = [];
    const add = (lat: number, lon: number, kind: number) => {
      xyz.push(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
      kinds.push(kind);
    };

    // Ukraine gets its own finer grid; at globe density it would be ~6 dots.
    // Not much finer though: at card size the country is ~26px wide, and with
    // additive blending overlapping dots burn out to white instead of the flag.
    for (let lat = 44.6; lat <= 52.5; lat += 1.35) {
      for (let lon = 22.2; lon <= 40.3; lon += 1.35 / Math.cos(lat * RAD)) {
        if (kindAt(mask, lat, lon) === 2) {
          add(lat * RAD, lon * RAD, lat > UKRAINE_MID_LAT ? UA_BLUE : UA_YELLOW);
        }
      }
    }
    for (let i = 0; i < RIM_COUNT; i++) add(0, 0, RIM);
    for (let i = 0; i < PULSE_COUNT; i++) add(0, 0, PULSE);
    if (visitor) {
      for (let i = 0; i < ARC_COUNT; i++) add(0, 0, ARC);
      for (let i = 0; i < PULSE_COUNT; i++) add(0, 0, VISITOR_PULSE);
    }

    // Fibonacci lattice for even spacing; ~29% of it lands on land.
    const remaining = Math.max(0, budget - kinds.length);
    const lattice = Math.round(remaining / 0.29);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < lattice && kinds.length < budget; i++) {
      const y = 1 - (2 * (i + 0.5)) / lattice;
      const lat = Math.asin(y);
      const lon = ((((i * golden) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
      if (kindAt(mask, lat / RAD, lon / RAD) === 1) add(lat, lon, LAND);
    }

    this.xyz = new Float32Array(xyz);
    this.kinds = new Uint8Array(kinds);
    this.count = kinds.length;
    this.seeds = Float32Array.from({ length: this.count }, () => Math.random());

    // With a visitor, face the middle of the arc so both ends are on the
    // front of the globe; otherwise face Ukraine.
    this.visitor = visitor ? unit(visitor.lat, visitor.lon) : null;
    const a = this.visitor ?? this.kyiv;
    const b = this.kyiv;
    this.omega = Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
    const mid = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const len = Math.hypot(mid[0], mid[1], mid[2]) || 1;
    this.yawBase = Math.atan2(mid[0] / len, mid[2] / len);
    this.tiltBase = Math.min(50 * RAD, Math.max(8 * RAD, Math.asin(mid[1] / len)));
  }

  write(out: Float32Array, t: number, palette: Palette) {
    const box = this.el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const r = (Math.min(box.width, box.height) / 2) * 0.9;

    // Sway instead of spinning, so both ends stay on the front; dragging
    // adds `spin` on top.
    this.spin += this.spinVelocity;
    this.spinVelocity *= 0.95;
    const sway = this.visitor ? 0.3 : 0.75;
    const yaw = this.yawBase + Math.sin(t * 0.22) * sway + this.spin;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosT = Math.cos(this.tiltBase);
    const sinT = Math.sin(this.tiltBase);
    const project = (x: number, y: number, z: number) => {
      // rotate about Y so `yaw` faces the viewer, then tip the north pole back
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      return [x1, y * cosT - z1 * sinT, y * sinT + z1 * cosT] as const;
    };

    const [kyivX, kyivY, kyivZ] = project(...this.kyiv);
    const [visX, visY, visZ] = this.visitor ? project(...this.visitor) : [0, 0, -1];

    let rimIndex = 0;
    let pulseIndex = 0;
    let arcIndex = 0;
    let visitorIndex = 0;
    for (let i = 0; i < this.count; i++) {
      const kind = this.kinds[i];
      const seed = this.seeds[i];

      if (kind === RIM) {
        const a = (rimIndex++ / RIM_COUNT) * Math.PI * 2 + t * 0.05;
        put(out, i, cx + Math.cos(a) * r * 1.035, cy + Math.sin(a) * r * 1.035, palette.accent, 0.22, 1.5);
        continue;
      }
      if (kind === PULSE || kind === VISITOR_PULSE) {
        const isVisitor = kind === VISITOR_PULSE;
        const a = ((isVisitor ? visitorIndex++ : pulseIndex++) / PULSE_COUNT) * Math.PI * 2;
        const phase = (t * 0.55 + (isVisitor ? 0.5 : 0)) % 1;
        const radius = 3 + phase * 16;
        const [px, py, pz] = isVisitor ? [visX, visY, visZ] : [kyivX, kyivY, kyivZ];
        const alpha = pz > 0.1 ? (1 - phase) * 0.9 : 0;
        const colour = isVisitor ? palette.pink : palette.ink;
        put(out, i, cx + px * r + Math.cos(a) * radius, cy - py * r + Math.sin(a) * radius, colour, alpha, 1.6);
        continue;
      }
      if (kind === ARC && this.visitor) {
        // Dots stream along the arc from the visitor towards Ukraine.
        const s = (arcIndex++ / ARC_COUNT + t * 0.16) % 1;
        const p = slerp(this.visitor, this.kyiv, this.omega, s);
        const lift = 1 + Math.sin(Math.PI * s) * (0.06 + 0.22 * Math.min(1, this.omega / 1.5));
        const [x, y, z] = project(p[0] * lift, p[1] * lift, p[2] * lift);
        const alpha = Math.sin(Math.PI * s) ** 0.6 * (z > -0.05 ? 0.95 : 0.15);
        put(out, i, cx + x * r, cy - y * r, s > 0.5 ? palette.accent : palette.pink, alpha, 1.7);
        continue;
      }

      const [x, y, z] = project(this.xyz[i * 3], this.xyz[i * 3 + 1], this.xyz[i * 3 + 2]);
      const front = z > 0;
      const isUkraine = kind === UA_BLUE || kind === UA_YELLOW;
      const colour = kind === UA_BLUE ? palette.flagBlue : kind === UA_YELLOW ? palette.flagYellow : seed > 0.85 ? palette.ink : palette.accent;
      const alpha = front ? (isUkraine ? 1 : 0.34 + 0.66 * z) : isUkraine ? 0.12 : 0.08;
      const size = (isUkraine ? 2.6 : 2.1) * (front ? 0.75 + 0.35 * z : 0.7);
      put(out, i, cx + x * r, cy - y * r, colour, alpha, size);
    }
  }
}

// ---------------------------------------------------------------------------
// Rail: a current flowing up the career timeline, rings around each role
// ---------------------------------------------------------------------------

export class RailShape implements Shape {
  readonly key = "rail";
  readonly stiffness = 1.4;
  readonly count: number;
  private readonly stream: number;
  private readonly ringSizes: number[];
  private readonly seeds: Float32Array;

  constructor(private readonly dots: HTMLElement[], budget: number) {
    const current = dots.findIndex((d) => d.dataset.current === "true");
    this.stream = Math.round(budget * 0.55);
    const ringBudget = budget - this.stream;
    const currentShare = current >= 0 ? 0.4 : 0;
    const others = Math.max(1, dots.length - (current >= 0 ? 1 : 0));
    this.ringSizes = dots.map((_, i) =>
      Math.round(i === current ? ringBudget * currentShare : (ringBudget * (1 - currentShare)) / others)
    );
    this.count = this.stream + this.ringSizes.reduce((a, b) => a + b, 0);
    this.seeds = Float32Array.from({ length: this.count * 2 }, () => Math.random());
  }

  write(out: Float32Array, t: number, palette: Palette) {
    const centres = this.dots.map((d) => {
      const r = d.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, current: d.dataset.current === "true" };
    });
    if (!centres.length) return;
    const top = centres[0].y - 60;
    const bottom = centres[centres.length - 1].y;
    const span = Math.max(1, bottom - top);
    const railX = centres[0].x;

    let i = 0;
    for (; i < this.stream; i++) {
      const s = this.seeds[i * 2];
      const jitter = (this.seeds[i * 2 + 1] - 0.5) * 2.6;
      // Upwards: from the earliest role towards the current one.
      const u = (((s - t * 0.03) % 1) + 1) % 1;
      const edge = Math.min(u, 1 - u) / 0.08;
      const x = railX + Math.sin(s * 60 + t * 1.6) * 1.4 + jitter;
      put(out, i, x, top + u * span, palette.accent, 0.55 * clamp01(edge), 1.5 + s * 0.6);
    }

    centres.forEach((c, d) => {
      const n = this.ringSizes[d];
      for (let k = 0; k < n; k++, i++) {
        const s = this.seeds[i * 2];
        const s2 = this.seeds[i * 2 + 1];
        const inner = 13;
        const radius = inner + s2 * (c.current ? 22 : 8);
        const speed = (c.current ? 1.1 : 0.45) * (d % 2 ? -1 : 1) * (inner / radius);
        const a = s * Math.PI * 2 + t * speed;
        const colour = c.current ? (s2 > 0.6 ? palette.pink : palette.accent) : palette.dust;
        const alpha = c.current ? 0.9 - s2 * 0.4 : 0.5;
        put(out, i, c.x + Math.cos(a) * radius, c.y + Math.sin(a) * radius, colour, alpha, c.current ? 1.9 : 1.5);
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Seconds: a row of 60 dots under the Contact clock, filling up as the minute
// passes; the clock's digits re-form when it rolls over.
// ---------------------------------------------------------------------------

export class SecondsShape implements Shape {
  readonly key = "seconds";
  readonly stiffness = 1.6;
  readonly count = 60;

  constructor(private readonly el: HTMLElement) {}

  write(out: Float32Array, _t: number, palette: Palette) {
    const r = this.el.getBoundingClientRect();
    const second = new Date().getSeconds();
    const gap = r.width / 60;
    for (let i = 0; i < 60; i++) {
      const current = i === second;
      const colour = current ? palette.accent : i < second ? palette.ink : palette.dust;
      const alpha = current ? 1 : i < second ? 0.55 : 0.2;
      put(out, i, r.left + (i + 0.5) * gap, r.bottom + 12 - (current ? 2 : 0), colour, alpha, current ? 3 : 1.7);
    }
  }
}

// ---------------------------------------------------------------------------
// Capsule: in Projects the swarm rings the active filter, with a bright head
// running round it like the moving border on the current role. Switching the
// filter makes the same dots flow over to the new chip.
// ---------------------------------------------------------------------------

/** Point at fraction `s` along a pill's outline (radius = half its height). */
/** A point `s` (0..1) of the way round a w×h rounded rectangle with corner
 * radius `r`, clockwise from the top-left end of the top edge. With r = h/2
 * it is a pill. */
function outlinePoint(w: number, h: number, radius: number, s: number): [number, number] {
  const r = Math.max(0.5, Math.min(radius, w / 2, h / 2));
  const across = w - 2 * r;
  const down = h - 2 * r;
  const corner = (Math.PI * r) / 2;
  let d = s * (2 * across + 2 * down + 4 * corner);
  const arc = (cx: number, cy: number, from: number): [number, number] => {
    const a = from + d / r;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  if (d < across) return [r + d, 0];
  d -= across;
  if (d < corner) return arc(w - r, r, -Math.PI / 2);
  d -= corner;
  if (d < down) return [w, r + d];
  d -= down;
  if (d < corner) return arc(w - r, h - r, 0);
  d -= corner;
  if (d < across) return [w - r - d, h];
  d -= across;
  if (d < corner) return arc(r, h - r, Math.PI / 2);
  d -= corner;
  if (d < down) return [0, h - r - d];
  d -= down;
  return arc(r, r, Math.PI);
}

export class CapsuleShape implements Shape {
  readonly key: string;
  readonly stiffness = 1.3;
  readonly count: number;
  private readonly seeds: Float32Array;

  /** The chip's own corner radius, so the ring follows a pill or a box. */
  private readonly radius: number;

  constructor(private readonly chip: HTMLElement, id: string, budget: number) {
    this.key = `capsule:${id}`;
    this.count = budget;
    this.seeds = Float32Array.from({ length: budget }, () => Math.random());
    this.radius = parseFloat(getComputedStyle(chip).borderTopLeftRadius) || 0;
  }

  write(out: Float32Array, t: number, palette: Palette) {
    const r = this.chip.getBoundingClientRect();
    // Chips sit 8px apart; 4px keeps the ring clear of the neighbours.
    const pad = 4;
    const w = r.width + pad * 2;
    const h = r.height + pad * 2;
    const head = (t * 0.22) % 1;
    for (let i = 0; i < this.count; i++) {
      const seed = this.seeds[i];
      const s = (i / this.count + t * 0.015) % 1;
      const [x, y] = outlinePoint(w, h, this.radius + pad, s);
      // Distance along the outline to the running head, wrapping round.
      const along = Math.min(Math.abs(s - head), 1 - Math.abs(s - head));
      const glow = Math.max(0, 1 - along / 0.14);
      const wobble = (seed - 0.5) * 2.2;
      put(
        out,
        i,
        r.left - pad + x + wobble,
        r.top - pad + y + wobble,
        glow > 0.45 ? palette.ink : palette.accent,
        0.28 + glow * 0.7,
        1.5 + glow * 1.2
      );
    }
  }
}
