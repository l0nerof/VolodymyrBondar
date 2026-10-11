// Cost: fewer particles on touch screens, half frame rate after a few idle
// seconds (in the engine's frame), and an automatic step down if the device
// can't hold ~45 fps.
import { release } from "./allocation";
import type { SwarmEngine } from "./engine";
import { buildStages } from "./scenes";

/** Nobody has touched the page for this long: half frame rate is plenty. */
export const IDLE_MS = 6000;

/** Touch screens get fewer, slightly cheaper particles; small phones still
 * need ~1100 for the name to read. */
export function particleCount(width: number, height: number, coarse: boolean) {
  const area = width * height;
  const cores = navigator.hardwareConcurrency || 4;
  const scale = cores <= 4 ? 0.8 : 1;
  return coarse
    ? Math.round(Math.min(2600, Math.max(1100, (area / 420) * scale)))
    : Math.round(Math.min(4200, Math.max(1500, (area / 330) * scale)));
}

/** Steps quality down (fewer particles, 1x canvas) if frames stay slow. */
export function watchPerformance(swarm: SwarmEngine, interval: number, now: number) {
  const perf = swarm.perf;
  if (perf.tier >= 2 || now - swarm.started < 3000 || now - swarm.lastInput > IDLE_MS) return;
  perf.frames++;
  perf.total += interval;
  if (perf.frames < 90) return;
  perf.strikes = perf.total / perf.frames > 24 ? perf.strikes + 1 : 0;
  perf.frames = 0;
  perf.total = 0;
  if (perf.strikes < 2) return;

  perf.strikes = 0;
  perf.tier++;
  swarm.activeN = Math.round(swarm.activeN * 0.6);
  swarm.dpr = 1;
  swarm.renderer.resize(swarm.width, swarm.height, swarm.dpr);
  swarm.stages.forEach((stage) => release(swarm, stage.members));
  for (let i = swarm.activeN; i < swarm.n; i++) swarm.colour[i * 4 + 3] = 0;
  swarm.stages = [];
  swarm.globe = null;
  buildStages(swarm);
}
