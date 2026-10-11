// Who gets which particle: active stages claim particles for their shapes,
// paired by locality; what a stage lets go joins the flock or fades out.
// Budgets are sized so stages that share the screen never starve each other.
import { DUST_LIFE } from "./dust";
import type { SwarmEngine } from "./engine";
import { FLOCK_MS, FLOCK_SHARE, startFlock } from "./flock";
import { hilbert, shuffle } from "./pairing";
import type { Stage } from "./scenes";
import { TARGET_STRIDE, type Shape } from "./shapes";

/** How long a stage must stay in view before it claims particles. */
const ACTIVATE_MS = 140;
/** Margin (px) around the viewport within which a target counts as on screen. */
const ON_SCREEN = 80;

type Box = { left: number; top: number; right: number; bottom: number };

export function updateStages(swarm: SwarmEngine, t: number, now: number) {
  swarm.stages.forEach((stage, index) => {
    // A stage has to stay in view for a moment before it claims particles,
    // so sections that only flash past during a fast scroll leave the swarm
    // alone; it lets go as soon as it leaves.
    const wanted = stage.isActive(stage.active);
    if (!wanted) stage.pendingSince = 0;
    else if (!stage.active && !stage.pendingSince) stage.pendingSince = now;
    stage.active = wanted && (stage.active || now - stage.pendingSince >= ACTIVATE_MS);

    const shape = stage.active ? stage.resolve() : null;
    if (shape !== stage.shape) reassign(swarm, stage, index, shape, t);
    else if (shape && stage.members.length < shape.count && now - stage.toppedUpAt > 400) {
      // Stages that activated while others still held particles top up as
      // those get released.
      stage.toppedUpAt = now;
      if (freeCount(swarm) > 40) reassign(swarm, stage, index, shape, t);
    }
    stage.shape?.write(stage.targets, t, swarm.palette, swarm.reduced);
  });
}

/** Free particles in the order a new shape should take them: the flock first
 * (that is the swarm arriving from the previous section), then the nearest
 * invisible spares. Visible dust comes last: taking it left a bald patch
 * around the shape (the timeline rail ate the dust on its side, so the other
 * side looked crowded). */
export function freeParticles(swarm: SwarmEngine, box: Box) {
  const now = performance.now();
  const free: number[] = [];
  const score = new Float32Array(swarm.activeN);
  for (let i = 0; i < swarm.activeN; i++) {
    if (swarm.owner[i] >= 0) continue;
    free.push(i);
    const dx = Math.max(box.left - swarm.px[i], 0, swarm.px[i] - box.right);
    const dy = Math.max(box.top - swarm.py[i], 0, swarm.py[i] - box.bottom);
    const distance = Math.hypot(dx, dy);
    const inFlock = swarm.flockUntil[i] > now;
    const showing = swarm.colour[i * 4 + 3] > 0.03;
    score[i] = inFlock ? distance - 8000 : showing ? distance + 5000 : distance;
  }
  return free.sort((a, b) => score[a] - score[b]);
}

export function freeCount(swarm: SwarmEngine) {
  let count = 0;
  for (let i = 0; i < swarm.activeN; i++) if (swarm.owner[i] < 0) count++;
  return count;
}

export function targetBox(targets: Float32Array, count: number): Box {
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
export function reassign(swarm: SwarmEngine, stage: Stage, index: number, shape: Shape | null, t: number) {
  const old = stage.members;
  if (!shape) {
    release(swarm, old);
    stage.members = [];
    stage.shape = null;
    return;
  }
  const topUp = shape === stage.shape;
  stage.shape = shape;
  if (stage.targets.length < shape.count * TARGET_STRIDE) {
    stage.targets = new Float32Array(shape.count * TARGET_STRIDE);
  }
  shape.write(stage.targets, t, swarm.palette, swarm.reduced);
  const box = targetBox(stage.targets, shape.count);

  if (topUp) {
    const filled = new Uint8Array(shape.count);
    for (const i of old) filled[swarm.slot[i]] = 1;
    const open = shuffle(Array.from({ length: shape.count }, (_, j) => j).filter((j) => !filled[j]));
    const fresh = freeParticles(swarm, box).slice(0, open.length);
    place(swarm, fresh, open.slice(0, fresh.length), stage, index);
    stage.members = old.concat(fresh);
    return;
  }

  const want = shape.count;
  const pool = old.length >= want ? old : old.concat(freeParticles(swarm, box).slice(0, want - old.length));
  const take = pool.slice(0, want);
  release(swarm, pool.slice(want));
  const slots = Array.from({ length: want }, (_, j) => j);
  place(swarm, take, take.length < want ? shuffle(slots).slice(0, take.length) : slots, stage, index);
  stage.members = take;
}

/** Splits a shape's slots into on-screen and off-screen ones. The best
 * particles (first in `particles`) fly to the on-screen part; the off-screen
 * part (a long timeline, say) is filled by the rest jumping there unseen,
 * instead of dots visibly streaking off the edge of the screen. */
export function place(swarm: SwarmEngine, particles: number[], slots: number[], stage: Stage, index: number) {
  const T = TARGET_STRIDE;
  const seen = (j: number) => {
    const x = stage.targets[j * T];
    const y = stage.targets[j * T + 1];
    return x > -ON_SCREEN && x < swarm.width + ON_SCREEN && y > -ON_SCREEN && y < swarm.height + ON_SCREEN;
  };
  const near = slots.filter(seen);
  const far = slots.filter((j) => !seen(j));
  const flyers = particles.slice(0, near.length);
  const jumpers = particles.slice(near.length, near.length + far.length);
  pair(swarm, flyers, near.slice(0, flyers.length), stage, index);
  pair(swarm, jumpers, far.slice(0, jumpers.length), stage, index);
  for (const i of jumpers) {
    const o = swarm.slot[i] * T;
    swarm.teleport(i, stage.targets[o], stage.targets[o + 1]);
  }
}

/** Matches particles to slots along a Hilbert curve over both sets, which
 * keeps neighbours together in 2D (sorting by x alone scrambled the rows). */
export function pair(swarm: SwarmEngine, particles: number[], slots: number[], stage: Stage, index: number) {
  const T = TARGET_STRIDE;
  const xs = [...particles.map((i) => swarm.px[i]), ...slots.map((j) => stage.targets[j * T])];
  const ys = [...particles.map((i) => swarm.py[i]), ...slots.map((j) => stage.targets[j * T + 1])];
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const span = Math.max(1, Math.max(...xs) - left, Math.max(...ys) - top);
  const key = (x: number, y: number) => hilbert(((x - left) / span) * 1023, ((y - top) / span) * 1023);
  const byParticle = particles.map((i) => ({ i, k: key(swarm.px[i], swarm.py[i]) })).sort((a, b) => a.k - b.k);
  const bySlot = slots
    .map((j) => ({ j, k: key(stage.targets[j * T], stage.targets[j * T + 1]) }))
    .sort((a, b) => a.k - b.k);
  const now = performance.now();
  byParticle.forEach(({ i }, n) => {
    if (swarm.owner[i] !== index) swarm.assignedAt[i] = now;
    swarm.flockUntil[i] = -Infinity;
    swarm.releasedAt[i] = -Infinity;
    swarm.owner[i] = index;
    swarm.slot[i] = bySlot[n].j;
  });
}

/** Let-go particles that are on screen and glowing join the flock (up to its
 * capacity); the rest fade out where they are, riding along with the page,
 * and come back as evenly spread dust. Nothing lingers as a clump or slides
 * about with the dust's parallax. */
export function release(swarm: SwarmEngine, list: number[]) {
  const now = performance.now();
  const room = swarm.reduced ? 0 : Math.max(0, Math.round(swarm.activeN * FLOCK_SHARE) - swarm.flock.size);
  const joining = new Set(
    list
      .filter(
        (i) =>
          swarm.colour[i * 4 + 3] > 0.08 &&
          swarm.px[i] > 0 &&
          swarm.px[i] < swarm.width &&
          swarm.py[i] > 0 &&
          swarm.py[i] < swarm.height
      )
      .slice(0, room)
  );
  if (joining.size && swarm.flock.size === 0) startFlock(swarm, joining);
  for (const i of list) {
    swarm.owner[i] = -1;
    swarm.slot[i] = -1;
    swarm.hx[i] = swarm.px[i];
    swarm.hy[i] = swarm.py[i];
    if (joining.has(i)) {
      swarm.flockUntil[i] = now + FLOCK_MS;
      swarm.respawnAt[i] = Infinity;
    } else {
      swarm.releasedAt[i] = now;
      swarm.respawnAt[i] = now + DUST_LIFE.fade;
    }
  }
  swarm.flock.size += joining.size;
}
