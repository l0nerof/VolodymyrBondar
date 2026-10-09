// The flock: when a section's shape lets go, its on-screen dots gather into a
// cloud that stays in view and runs ahead in the direction you scroll; the
// next section's shape is then built from it, so you can watch the swarm
// leave one section and assemble the next.
import { DUST_LIFE } from "./dust";
import type { SwarmEngine } from "./engine";

/** Unclaimed for this long (ms), the flock disperses. */
export const FLOCK_MS = 3000;
/** At most this share of the swarm flies in the flock at once. */
export const FLOCK_SHARE = 0.4;

/** A new flock starts where the released dots are, then heads off. */
export function startFlock(swarm: SwarmEngine, members: Set<number>) {
  let x = 0;
  let y = 0;
  for (const i of members) {
    x += swarm.px[i];
    y += swarm.py[i];
  }
  swarm.flock.x = x / members.size;
  swarm.flock.y = Math.min(swarm.height * 0.85, Math.max(swarm.height * 0.15, y / members.size));
  swarm.flock.vx = 0;
  swarm.flock.vy = 0;
}

/** Steers the flock ahead in the scroll direction, where the next
 * section's shape will turn up. */
export function moveFlock(swarm: SwarmEngine, dt: number) {
  const f = swarm.flock;
  if (!f.size) return;
  const goalX = swarm.width / 2;
  const goalY = swarm.height * (swarm.scrollDir > 0 ? 0.72 : 0.28);
  const keep = 0.9 ** dt;
  f.vx = (f.vx + (goalX - f.x) * 0.006 * dt) * keep;
  f.vy = (f.vy + (goalY - f.y) * 0.006 * dt) * keep;
  f.x += f.vx * dt;
  f.y += f.vy * dt;
}

/** A loose, slowly turning cloud round the flock's centre: dense and bright
 * in the middle, fainter at the rim. */
export function flockTarget(swarm: SwarmEngine, i: number, t: number, out: Float32Array) {
  const f = swarm.flock;
  const radius = Math.min(swarm.width, swarm.height) * 0.16;
  const seed = swarm.seed[i];
  const r = 8 + Math.sqrt(seed) * radius;
  const spin = 0.9 * Math.sqrt(40 / (r + 30));
  const a = seed * 2291.7 + swarm.depth[i] * 37 + t * spin;
  const wobble = Math.sin(t * 1.7 + seed * 40) * radius * 0.06;
  const u = r / (radius + 8);
  const { ink, accent } = swarm.palette;
  const k = 0.35 + u * 0.65;
  out[0] = f.x + Math.cos(a) * (r + wobble);
  out[1] = f.y + Math.sin(a) * (r + wobble) * 0.62;
  out[2] = ink[0] + (accent[0] - ink[0]) * k;
  out[3] = ink[1] + (accent[1] - ink[1]) * k;
  out[4] = ink[2] + (accent[2] - ink[2]) * k;
  out[5] = 0.8 - u * 0.5;
  out[6] = (1.5 + (1 - u) * 0.9) * swarm.palette.dotScale;
}

/** Nobody claimed the flock in time: its dots fade out where they are. */
export function leaveFlock(swarm: SwarmEngine, i: number, now: number) {
  swarm.flockUntil[i] = -Infinity;
  swarm.hx[i] = swarm.px[i];
  swarm.hy[i] = swarm.py[i];
  swarm.releasedAt[i] = now;
  swarm.respawnAt[i] = now + DUST_LIFE.fade;
}
