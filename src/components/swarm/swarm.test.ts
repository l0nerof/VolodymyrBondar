import { describe, expect, it, vi } from "vitest";

import landMask from "@/data/land-mask.json";

import { fieldVelocity, fieldsAt, type Field, type Region } from "./dust";
import type { SwarmEngine } from "./engine";
import { hilbert, shuffle } from "./pairing";
import { particleCount } from "./quality";
import { kindAt, loadLandMask } from "./shapes";

/** Just enough of an engine for the dust maths: one particle at (x, y). */
function oneParticle(x: number, y: number, depth = 0.3, seed = 0.5) {
  return {
    hx: Float32Array.of(x),
    hy: Float32Array.of(y),
    depth: Float32Array.of(depth),
    seed: Float32Array.of(seed),
  } as unknown as SwarmEngine;
}

describe("pairing", () => {
  it("keeps neighbours close along the Hilbert curve", () => {
    // Grid neighbours usually sit next to each other on the curve, out of
    // 1024² positions (that is what keeps a shape's rows together).
    const gaps: number[] = [];
    for (let x = 0; x < 1000; x += 37) {
      for (let y = 0; y < 1000; y += 41) gaps.push(Math.abs(hilbert(x, y) - hilbert(x + 1, y)));
    }
    gaps.sort((a, b) => a - b);
    expect(gaps[Math.floor(gaps.length / 2)]).toBeLessThan(16);
  });

  it("clamps to the 1024 grid", () => {
    expect(hilbert(-50, -50)).toBe(hilbert(0, 0));
    expect(hilbert(5000, 5000)).toBe(hilbert(1023, 1023));
  });

  it("shuffles into a permutation", () => {
    const list = Array.from({ length: 50 }, (_, i) => i);
    expect([...shuffle([...list])].sort((a, b) => a - b)).toEqual(list);
  });
});

describe("land mask", () => {
  it("has runs that cover the map exactly", () => {
    const cells = landMask.runs.filter((_, i) => i % 2 === 1).reduce((sum, count) => sum + count, 0);
    expect(cells).toBe(landMask.width * landMask.height);
  });

  it("knows the sea, the land and Ukraine", async () => {
    const mask = await loadLandMask();
    expect(kindAt(mask, 50.45, 30.52)).toBe(2); // Kyiv
    expect(kindAt(mask, 48.85, 2.35)).toBe(1); // Paris
    expect(kindAt(mask, 30, -40)).toBe(0); // the Atlantic
    expect(mask.ukraine[0].length).toBeGreaterThan(50);
  });
});

describe("quality", () => {
  it("keeps the particle count within each device's bounds", () => {
    vi.stubGlobal("navigator", { hardwareConcurrency: 8 });
    expect(particleCount(390, 844, true)).toBe(1100);
    expect(particleCount(1440, 900, false)).toBe(3927);
    expect(particleCount(3840, 2160, false)).toBe(4200);
    expect(particleCount(320, 400, false)).toBe(1500);
    vi.unstubAllGlobals();
  });
});

describe("dust", () => {
  const regions: Region[] = [
    { field: "stars", top: -Infinity, bottom: 1000 },
    { field: "orbit", top: 1000, bottom: Infinity },
  ];
  const swarm = { regions } as unknown as SwarmEngine;

  it("blends two sections' weather near their border", () => {
    expect(fieldsAt(swarm, 500)).toEqual({ a: "stars", b: "stars", w: 1 });
    expect(fieldsAt(swarm, 999.9).a).toBe("stars");
    expect(fieldsAt(swarm, 999.9).b).toBe("orbit");
    expect(fieldsAt(swarm, 999.9).w).toBeCloseTo(0.5, 2);
    expect(fieldsAt(swarm, 1090)).toEqual({ a: "orbit", b: "stars", w: 0.75 });
  });

  it("drifts without sources or sinks, so dust never piles up", () => {
    // The drift is the curl of a stream function: its divergence is zero.
    const h = 0.01;
    const at = (field: Field, x: number, y: number) => fieldVelocity(oneParticle(x, y), field, 0, 12.5, null);
    for (const field of ["stars", "calm"] as Field[]) {
      for (const [x, y] of [
        [100, 200],
        [640, 75],
        [1300, 820],
      ]) {
        const dvx = (at(field, x + h, y)[0] - at(field, x - h, y)[0]) / (2 * h);
        const dvy = (at(field, x, y + h)[1] - at(field, x, y - h)[1]) / (2 * h);
        expect(Math.abs(dvx + dvy)).toBeLessThan(1e-6);
      }
    }
  });

  it("circles the globe and rises through the timeline", () => {
    const [vx, vy] = fieldVelocity(oneParticle(400, 300), "orbit", 0, 0, { x: 300, y: 300 });
    expect(vx).toBeCloseTo(0, 6);
    expect(vy).toBeGreaterThan(0);
    expect(fieldVelocity(oneParticle(400, 300), "stream", 0, 0, null)[1]).toBeLessThan(0);
  });
});
