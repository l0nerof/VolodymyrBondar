// Small helpers for handing particles to a shape.

export function shuffle<T>(list: T[]) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** Position along a Hilbert curve over a 1024×1024 grid: close in 2D ⇒ close here. */
export function hilbert(px: number, py: number) {
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
