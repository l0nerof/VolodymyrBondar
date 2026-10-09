// Everything the swarm "draws" from a picture: the name, a typed
// word or emoji, a tech logo with its label, Ukraine's outline. All of them go
// through one raster → dot-grid step, so they read as the same material.
import { mix, type Palette, type Rgb } from "./palette";
import { clamp01, TARGET_STRIDE, type Shape } from "./shapes";

/** Paints white (or coloured) ink into a canvas the size of the anchor box. */
export type Painter = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

const POINT = 7; // lx, ly, seed, r, g, b, ownColour
/** Rows of the name above this viewport line start blowing away on scroll. */
const WIND_LINE = 150;

function fontOf(style: CSSStyleDeclaration, size = style.fontSize, fontStyle = style.fontStyle) {
  return `${fontStyle} ${style.fontWeight} ${size} ${style.fontFamily}`;
}

function centredBaseline(ctx: CanvasRenderingContext2D, text: string, height: number) {
  const m = ctx.measureText(text);
  return height / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
}

/** With `allOwn`, every dot keeps the colour it was painted in (an emoji);
 * otherwise only clearly coloured dots do (a logo), and the rest take the
 * swarm's ink. */
function rasterise(width: number, height: number, budget: number, paint: Painter, allOwn = false) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { points: new Float32Array(0), step: 4 };

  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";
  paint(ctx, canvas.width, canvas.height);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let lit = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 127) lit++;
  if (!lit) return { points: new Float32Array(0), step: 4 };

  // Spend roughly the whole budget on ink, but never tighter than ~3px: below
  // that small text reads as blurry rather than as dots.
  const step = Math.max(3.2, Math.sqrt(lit / budget));
  const found: number[] = [];
  for (let row = 0, y = step / 2; y < canvas.height; y += step, row++) {
    // Offset every other row: a hex grid reads as "made of dots".
    for (let x = step / 2 + (row % 2) * (step / 2); x < canvas.width; x += step) {
      const o = ((y | 0) * canvas.width + (x | 0)) * 4;
      if (data[o + 3] > 127) found.push(x, y, data[o], data[o + 1], data[o + 2]);
    }
  }

  const total = found.length / 5;
  const keep = Math.min(total, budget);
  const order = Array.from({ length: total }, (_, i) => i);
  for (let i = total - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [order[i], order[j]] = [order[j], order[i]];
  }
  const points = new Float32Array(keep * POINT);
  for (let k = 0; k < keep; k++) {
    const f = order[k] * 5;
    const [r, g, b] = [found[f + 2] / 255, found[f + 3] / 255, found[f + 4] / 255];
    const max = Math.max(r, g, b);
    const saturation = max ? (max - Math.min(r, g, b)) / max : 0;
    const own = allOwn || (saturation > 0.25 && max > 0.15);
    points.set([found[f], found[f + 1], Math.random(), r, g, b, own ? 1 : 0], k * POINT);
  }
  return { points, step };
}

/** Keeps a logo's own colours but makes sure they show on the current theme. */
function vivid(c: Rgb, palette: Palette): Rgb {
  const lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  if (palette.additive && lum < 0.5) return mix(c, [1, 1, 1], 0.55 - lum * 0.6);
  // On a light page the lightest parts (a white cup, a logo's white) are
  // pulled furthest towards the ink, or they vanish into the paper.
  if (!palette.additive && lum > 0.72) return mix(c, palette.ink, 0.35 + (lum - 0.72));
  return c;
}

export class GlyphShape implements Shape {
  readonly stiffness = 1.25;
  readonly count: number;
  private readonly points: Float32Array;
  private readonly width: number;
  private readonly dot: number;
  private colours = new Float32Array(0);
  private colourFor: Palette | null = null;

  constructor(
    private readonly el: HTMLElement,
    budget: number,
    readonly key: string,
    paint: Painter,
    private readonly crumble = false,
    ownColours = false
  ) {
    const box = el.getBoundingClientRect();
    const { points, step } = rasterise(box.width, box.height, budget, paint, ownColours);
    this.points = points;
    this.count = points.length / POINT;
    this.width = Math.max(1, box.width);
    this.dot = Math.min(3.8, Math.max(2, step * 0.64));
  }

  private paintColours(palette: Palette) {
    const p = this.points;
    this.colours = new Float32Array(this.count * 3);
    for (let i = 0; i < this.count; i++) {
      const o = i * POINT;
      const seed = p[o + 2];
      const own = p[o + 6] > 0.5;
      const u = clamp01((p[o] / this.width) * 1.25 - 0.1);
      const c = own
        ? vivid([p[o + 3], p[o + 4], p[o + 5]], palette)
        : seed > 0.93
          ? palette.deep
          : mix(palette.ink, palette.accent, u);
      this.colours.set(c, i * 3);
    }
    this.colourFor = palette;
  }

  write(out: Float32Array, t: number, palette: Palette, reduced: boolean) {
    if (this.colourFor !== palette) this.paintColours(palette);
    const box = this.el.getBoundingClientRect();
    const p = this.points;
    const c = this.colours;
    for (let i = 0; i < this.count; i++) {
      const o = i * POINT;
      const lx = p[o];
      const ly = p[o + 1];
      const seed = p[o + 2];
      // A slow shimmer so the dots never sit perfectly still.
      let x = box.left + lx + Math.sin(t * 1.4 + seed * 40) * 0.45;
      let y = box.top + ly + Math.cos(t * 1.1 + seed * 31) * 0.45;
      let alpha = 0.94;

      // Scrolling the name up blows it away row by row, like ash; scrolling
      // back reassembles it. Pure function of position, so it is reversible.
      if (this.crumble && !reduced) {
        const lift = (WIND_LINE - (box.top + ly) + (seed - 0.5) * 90) / 170;
        if (lift > 0) {
          const e = Math.min(1, lift) ** 2;
          const drift = (seed * 7.31) % 1;
          x += (drift - 0.35) * 280 * e + Math.sin(t * 0.8 + seed * 20) * 12 * e;
          y -= (50 + seed * 150) * e;
          alpha *= 1 - e * 0.92;
        }
      }

      const k = i * TARGET_STRIDE;
      out[k] = x;
      out[k + 1] = y;
      out[k + 2] = c[i * 3];
      out[k + 3] = c[i * 3 + 1];
      out[k + 4] = c[i * 3 + 2];
      out[k + 5] = alpha;
      out[k + 6] = this.dot * (0.85 + seed * 0.3);
    }
  }
}

// ---------------------------------------------------------------------------
// Painters
// ---------------------------------------------------------------------------

/** The hero heading, word by word, exactly where the browser laid it out. */
export function paintName(el: HTMLElement): Painter {
  return (ctx) => {
    const origin = el.getBoundingClientRect();
    el.querySelectorAll<HTMLElement>("[data-swarm-word]").forEach((word) => {
      const rect = word.getBoundingClientRect();
      const style = getComputedStyle(word);
      const text = word.textContent ?? "";
      ctx.font = fontOf(style);
      if ("letterSpacing" in ctx) ctx.letterSpacing = style.letterSpacing;
      const m = ctx.measureText(text);
      // An inline box's top edge sits one font-ascent above the baseline.
      const ascent = m.fontBoundingBoxAscent || rect.height * 0.8;
      const sx = m.width ? rect.width / m.width : 1;
      ctx.setTransform(sx, 0, 0, 1, rect.left - origin.left, rect.top - origin.top + ascent);
      ctx.fillText(text, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
  };
}

/** One line in the heading's font, shrunk to fit. Emoji keep their colours. */
export function paintText(fontFrom: HTMLElement, text: string): Painter {
  return (ctx, w, h) => {
    const word = fontFrom.querySelector<HTMLElement>("[data-swarm-word]") ?? fontFrom;
    const style = getComputedStyle(word);
    const base = parseFloat(style.fontSize);
    const spacing = parseFloat(style.letterSpacing) || 0;
    // An emoji is a picture: under an italic heading it came out slanted.
    const slant = /\p{Extended_Pictographic}/u.test(text) ? "normal" : style.fontStyle;
    ctx.font = fontOf(style, style.fontSize, slant);
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${spacing}px`;
    const fit = Math.min(1, (w * 0.94) / Math.max(1, ctx.measureText(text).width));
    ctx.font = fontOf(style, `${base * fit}px`, slant);
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${spacing * fit}px`;
    ctx.fillText(text, (w - ctx.measureText(text).width) / 2, centredBaseline(ctx, text, h));
  };
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, family: string, size: number, room: number) {
  ctx.font = `800 ${size}px ${family}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${-0.03 * size}px`;
  const width = ctx.measureText(text).width;
  if (width <= room) return size;
  const fitted = (size * room) / width;
  ctx.font = `800 ${fitted}px ${family}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${-0.03 * fitted}px`;
  return fitted;
}

/** A tech name on its own, centred. */
export function paintLabel(label: string, family: string): Painter {
  return (ctx, w, h) => {
    fitFont(ctx, label, family, h * 0.5, w * 0.9);
    ctx.fillText(label, (w - ctx.measureText(label).width) / 2, centredBaseline(ctx, label, h));
  };
}

/** Logo + name side by side; stacked when the box is too narrow for that. */
export function paintLogo(img: HTMLImageElement, label: string, family: string): Painter {
  return (ctx, w, h) => {
    const ratio = (img.naturalWidth || 1) / (img.naturalHeight || 1);
    const drawIcon = (x: number, y: number, size: number) => {
      const iw = ratio >= 1 ? size : size * ratio;
      const ih = ratio >= 1 ? size / ratio : size;
      ctx.drawImage(img, x + (size - iw) / 2, y + (size - ih) / 2, iw, ih);
    };

    const icon = Math.min(h * 0.78, w * 0.34);
    const gap = icon * 0.22;
    const size = fitFont(ctx, label, family, Math.min(h * 0.42, 120), w * 0.94 - icon - gap);
    if (size >= Math.min(30, h * 0.2)) {
      const total = icon + gap + ctx.measureText(label).width;
      const x0 = (w - total) / 2;
      drawIcon(x0, (h - icon) / 2, icon);
      ctx.fillText(label, x0 + icon + gap, centredBaseline(ctx, label, h));
      return;
    }

    const stackedIcon = h * 0.52;
    drawIcon((w - stackedIcon) / 2, h * 0.04, stackedIcon);
    fitFont(ctx, label, family, h * 0.24, w * 0.9);
    ctx.fillText(label, (w - ctx.measureText(label).width) / 2, h * 0.9);
  };
}

/** Ukraine's outline in flag colours — an easter egg for typing "україна". */
export function paintUkraine(rings: number[][][]): Painter {
  return (ctx, w, h) => {
    const [west, east, south, north] = [22, 40.3, 44.3, 52.4];
    const squash = Math.cos((48.4 * Math.PI) / 180);
    const scale = Math.min((w * 0.9) / ((east - west) * squash), (h * 0.95) / (north - south));
    const ox = (w - (east - west) * squash * scale) / 2;
    const oy = (h - (north - south) * scale) / 2;
    const at = (lon: number, lat: number): [number, number] => [ox + (lon - west) * squash * scale, oy + (north - lat) * scale];

    ctx.save();
    ctx.beginPath();
    for (const ring of rings) {
      ring.forEach(([lon, lat], k) => {
        const [x, y] = at(lon, lat);
        if (k) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.closePath();
    }
    ctx.clip("evenodd");
    const split = at(0, 48.4)[1];
    ctx.fillStyle = "#0057b7";
    ctx.fillRect(0, 0, w, split);
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(0, split, w, h - split);
    ctx.restore();
  };
}
