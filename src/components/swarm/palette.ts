// The swarm's colours, per theme. Values are 0..1 RGB so they
// go straight into the vertex buffer.

export type Rgb = readonly [number, number, number];

export type Palette = {
  additive: boolean;
  ink: Rgb;
  accent: Rgb;
  deep: Rgb;
  dust: Rgb;
  dustAlpha: number;
  emerald: Rgb;
  pink: Rgb;
  sky: Rgb;
  flagBlue: Rgb;
  flagYellow: Rgb;
  /** Scales dust and flock dots; on a light page they need to be bigger to
   * read as the same swarm. */
  dotScale: number;
};

function hex(value: string): Rgb {
  const n = parseInt(value.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Accent values are the site's own: purple-100 / purple-200 from globals.css and
// the three Approach colours (emerald, pink, sky) from Tailwind's palette.
export const DARK: Palette = {
  additive: true,
  ink: hex("#ffffff"),
  accent: hex("#cbacf9"),
  deep: hex("#9a6bf6"),
  dust: hex("#bec1dd"),
  dustAlpha: 0.34,
  emerald: hex("#34d399"),
  pink: hex("#f472b6"),
  sky: hex("#38bdf8"),
  flagBlue: hex("#4b8dff"),
  flagYellow: hex("#ffd60a"),
  dotScale: 1,
};

export const LIGHT: Palette = {
  additive: false,
  ink: hex("#10132e"),
  accent: hex("#8136f0"),
  deep: hex("#5b21b6"),
  // Dark dust on white read as dirt between lines of text; a soft lilac at
  // low strength reads as the same material without fighting the copy.
  dust: hex("#8a7fc4"),
  dustAlpha: 0.22,
  emerald: hex("#059669"),
  pink: hex("#db2777"),
  sky: hex("#0284c7"),
  flagBlue: hex("#1d5fd8"),
  flagYellow: hex("#e0a800"),
  dotScale: 1,
};

/** The swarm's colours from the CSS custom properties (--swarm-*) on `el`,
 * one set per light/dark theme (see globals.css); without them the swarm
 * uses DARK / LIGHT above. */
export function paletteFromCss(el: Element | null): Palette | null {
  if (!el) return null;
  const style = getComputedStyle(el);
  const read = (name: string) => style.getPropertyValue(`--swarm-${name}`).trim();
  if (!read("ink")) return null;
  // The CSS minifier rewrites colours (#ffffff becomes #fff), so let the
  // browser normalise whatever arrives: a 2D context hands back #rrggbb.
  const probe = document.createElement("canvas").getContext("2d");
  const colour = (name: string, fallback: Rgb): Rgb => {
    const value = read(name);
    if (!probe || !value || !CSS.supports("color", value)) return fallback;
    probe.fillStyle = value;
    const normal = String(probe.fillStyle);
    return normal.startsWith("#") ? hex(normal) : fallback;
  };
  const base = read("additive") === "1" ? DARK : LIGHT;
  return {
    additive: read("additive") === "1",
    ink: colour("ink", base.ink),
    accent: colour("accent", base.accent),
    deep: colour("deep", base.deep),
    dust: colour("dust", base.dust),
    dustAlpha: Number(read("dust-alpha")) || base.dustAlpha,
    emerald: colour("tone-1", base.emerald),
    pink: colour("tone-2", base.pink),
    sky: colour("tone-3", base.sky),
    flagBlue: colour("flag-blue", base.flagBlue),
    flagYellow: colour("flag-yellow", base.flagYellow),
    dotScale: Number(read("dot-scale")) || 1,
  };
}

export function mix(a: Rgb, b: Rgb, t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
