// Everything the swarm "draws" from a picture: the name, a typed
// word or emoji, a tech logo with its label, Ukraine's outline. All of them go
// through one raster → dot-grid step, so they read as the same material.
import { mix, type Palette, type Rgb } from "./palette";
import { clamp01, TARGET_STRIDE, type Shape } from "./shapes";

/** Paints white (or coloured) ink into a canvas the size of the anchor box. */
export type Painter = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

/** One picture of a shape. A logo and its name are two layers: the name's
 * dots get a finer grid and one solid colour, so it reads as text. */
export type Layer = { paint: Painter; text?: boolean };

const POINT = 8; // lx, ly, seed, r, g, b, kind, dot size
const SWARM = 0; // the swarm's colours
const OWN = 1; // the colour it was painted in (a logo, an emoji)
const TEXT = 2; // a name: one solid colour

// Letters read as letters when their dots are about this close; a logo's
// bold shapes hold up at a coarser grid. A name next to a logo was sampled at
// the logo's ~8px and came out as a few dots per stroke.
const TEXT_STEP = 3.4;
// The most of a shared budget the name may take from its logo.
const TEXT_SHARE = 0.7;
/** Rows of the name above this viewport line start blowing away on scroll. */
const WIND_LINE = 150;

function fontOf(style: CSSStyleDeclaration, size = style.fontSize, fontStyle = style.fontStyle) {
  return `${fontStyle} ${style.fontWeight} ${size} ${style.fontFamily}`;
}

function centredBaseline(ctx: CanvasRenderingContext2D, text: string, height: number) {
  const m = ctx.measureText(text);
  return height / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
}

/** A layer painted on a canvas of the box's size, with its count of lit pixels. */
function paintLayer(width: number, height: number, layer: Layer) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { layer, width: canvas.width, height: canvas.height, data: null, lit: 0 };

  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";
  layer.paint(ctx, canvas.width, canvas.height);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let lit = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 127) lit++;
  return { layer, width: canvas.width, height: canvas.height, data, lit };
}

/** Dots on a hex grid of `step` over the lit pixels, at most `keep` of them,
 * picked at random so a thinned shape stays even. */
function sample(painted: ReturnType<typeof paintLayer>, step: number, keep: number, allOwn: boolean, out: number[]) {
  const { data, width, height, layer } = painted;
  if (!data) return;
  const found: number[] = [];
  for (let row = 0, y = step / 2; y < height; y += step, row++) {
    // Offset every other row: a hex grid reads as "made of dots".
    for (let x = step / 2 + (row % 2) * (step / 2); x < width; x += step) {
      const o = ((y | 0) * width + (x | 0)) * 4;
      if (data[o + 3] > 127) found.push(x, y, data[o], data[o + 1], data[o + 2]);
    }
  }

  const total = found.length / 5;
  const order = Array.from({ length: total }, (_, i) => i);
  for (let i = total - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [order[i], order[j]] = [order[j], order[i]];
  }
  // Text dots are a little bigger for their grid, so strokes read as solid.
  const dot = Math.min(3.8, Math.max(2, step * (layer.text ? 0.78 : 0.64)));
  for (let k = 0; k < Math.min(total, keep); k++) {
    const f = order[k] * 5;
    const [r, g, b] = [found[f + 2] / 255, found[f + 3] / 255, found[f + 4] / 255];
    const max = Math.max(r, g, b);
    const saturation = max ? (max - Math.min(r, g, b)) / max : 0;
    const kind = layer.text ? TEXT : allOwn || (saturation > 0.25 && max > 0.15) ? OWN : SWARM;
    out.push(found[f], found[f + 1], Math.random(), r, g, b, kind, dot);
  }
}

/** With `allOwn`, every dot keeps the colour it was painted in (an emoji);
 * otherwise only clearly coloured dots do (a logo), the rest take the swarm's
 * colours, and a text layer takes one solid colour. The budget goes to text
 * first, at TEXT_STEP, then to everything else. */
function rasterise(width: number, height: number, budget: number, layers: Layer[], allOwn = false) {
  const painted = layers.map((layer) => paintLayer(width, height, layer)).filter((p) => p.lit > 0);
  const textLit = painted.reduce((sum, p) => sum + (p.layer.text ? p.lit : 0), 0);
  const restLit = painted.reduce((sum, p) => sum + (p.layer.text ? 0 : p.lit), 0);
  const textDots = textLit ? Math.min(restLit ? budget * TEXT_SHARE : budget, textLit / TEXT_STEP ** 2) : 0;
  const restDots = budget - textDots;

  const out: number[] = [];
  for (const p of painted) {
    const dots = p.layer.text ? (textDots * p.lit) / textLit : (restDots * p.lit) / restLit;
    // Never tighter than ~3px: below that small text reads as blurry rather
    // than as dots.
    const step = Math.max(3.2, Math.sqrt(p.lit / Math.max(1, dots)));
    sample(p, step, Math.round(dots), allOwn, out);
  }
  return Float32Array.from(out);
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
  private colours = new Float32Array(0);
  private colourFor: Palette | null = null;

  constructor(
    private readonly el: HTMLElement,
    budget: number,
    readonly key: string,
    paint: Painter | Layer[],
    private readonly crumble = false,
    ownColours = false
  ) {
    const box = el.getBoundingClientRect();
    const layers = typeof paint === "function" ? [{ paint }] : paint;
    this.points = rasterise(box.width, box.height, budget, layers, ownColours);
    this.count = this.points.length / POINT;
    this.width = Math.max(1, box.width);
  }

  private paintColours(palette: Palette) {
    const p = this.points;
    this.colours = new Float32Array(this.count * 3);
    for (let i = 0; i < this.count; i++) {
      const o = i * POINT;
      const seed = p[o + 2];
      const kind = p[o + 6];
      const u = clamp01((p[o] / this.width) * 1.25 - 0.1);
      // A name is one solid colour: the ink on paper (the gradient's red on
      // cream was hard to read), the accent yellow at night, which read well.
      const c =
        kind === OWN
          ? vivid([p[o + 3], p[o + 4], p[o + 5]], palette)
          : kind === TEXT
            ? palette.additive
              ? palette.accent
              : palette.ink
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
      out[k + 6] = p[o + 7] * (0.85 + seed * 0.3);
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

// The weight names are lettered in. At 800 the small counters of e, a and s
// filled up with dots and the letters turned to blobs; lighter strokes keep
// them open and need fewer dots for the same size.
const LABEL_WEIGHT = 650;

function fitFont(ctx: CanvasRenderingContext2D, text: string, family: string, size: number, room: number) {
  ctx.font = `${LABEL_WEIGHT} ${size}px ${family}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${-0.02 * size}px`;
  const width = ctx.measureText(text).width;
  if (width <= room) return size;
  const fitted = (size * room) / width;
  ctx.font = `${LABEL_WEIGHT} ${fitted}px ${family}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${-0.02 * fitted}px`;
  return fitted;
}

/** A tech name on its own, centred. */
export function labelLayers(label: string, family: string): Layer[] {
  return [
    {
      text: true,
      paint: (ctx, w, h) => {
        fitFont(ctx, label, family, h * 0.5, w * 0.9);
        ctx.fillText(label, (w - ctx.measureText(label).width) / 2, centredBaseline(ctx, label, h));
      },
    },
  ];
}

/** A name on one line, or on two when that sets it clearly larger: "React
 * Testing Library" on one line beside its logo came out about 30px tall,
 * too small for the dot grid to keep its letters straight. Leaves `ctx.font`
 * set to the chosen size. */
function fitLines(ctx: CanvasRenderingContext2D, label: string, family: string, max: number, room: number, height: number) {
  const single = { lines: [label], size: fitFont(ctx, label, family, max, room) };
  // The best split into two lines: the largest size, and of equal sizes the
  // most even lines ("React Testing / Library", not "React / Testing Library").
  // Two lines also have to fit the height, at a 1.1 line height each.
  const cap = Math.min(max, height / 2.2);
  const words = label.split(" ");
  let split: { lines: string[]; size: number; uneven: number } | null = null;
  for (let cut = 1; cut < words.length; cut++) {
    const lines = [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
    const size = Math.min(...lines.map((line) => fitFont(ctx, line, family, cap, room)));
    fitFont(ctx, lines[0], family, size, Infinity);
    const widths = lines.map((line) => ctx.measureText(line).width);
    const uneven = Math.abs(widths[0] - widths[1]);
    if (!split || size > split.size + 0.5 || (Math.abs(size - split.size) <= 0.5 && uneven < split.uneven)) {
      split = { lines, size, uneven };
    }
  }
  const best = split && split.size > single.size * 1.15 ? split : single;
  fitFont(ctx, best.lines[0], family, best.size, Infinity);
  return best;
}

/** Where a logo and its name go: side by side on a wide stage, stacked on a
 * narrow one (a phone's), where the name can take the full width; side by
 * side the name came out ~30px there, too small to read in dots. Leaves
 * `ctx.font` set to the name's size. */
function planLogo(ctx: CanvasRenderingContext2D, label: string, family: string, w: number, h: number) {
  if (w / h >= 1.6) {
    // A smaller logo leaves more of the budget, and the room, to its name.
    const icon = Math.min(h * 0.56, w * 0.24);
    const gap = icon * 0.22;
    const { lines, size } = fitLines(ctx, label, family, Math.min(h * 0.4, 110), w * 0.94 - icon - gap, h * 0.8);
    if (size >= Math.min(26, h * 0.16)) {
      const width = Math.max(...lines.map((line) => ctx.measureText(line).width));
      const x0 = (w - (icon + gap + width)) / 2;
      const lineHeight = size * 1.1;
      const cap = ctx.measureText("H").actualBoundingBoxAscent;
      const top = (h - (lines.length - 1) * lineHeight - cap) / 2 + cap;
      return {
        icon: { x: x0, y: (h - icon) / 2, size: icon },
        text: lines.map((line, i) => ({ line, x: x0 + icon + gap, y: top + i * lineHeight })),
      };
    }
  }

  const icon = Math.min(h * 0.44, w * 0.5);
  const gap = h * 0.06;
  const { lines, size } = fitLines(ctx, label, family, Math.min(h * 0.24, 90), w * 0.92, h * 0.9 - icon - gap);
  const lineHeight = size * 1.1;
  const cap = ctx.measureText("H").actualBoundingBoxAscent;
  const top = (h - (icon + gap + (lines.length - 1) * lineHeight + cap)) / 2;
  return {
    icon: { x: (w - icon) / 2, y: top, size: icon },
    text: lines.map((line, i) => ({
      line,
      x: (w - ctx.measureText(line).width) / 2,
      y: top + icon + gap + cap + i * lineHeight,
    })),
  };
}

/** A logo and its name, as two layers laid out together. */
export function logoLayers(img: HTMLImageElement, label: string, family: string): Layer[] {
  const ratio = (img.naturalWidth || 1) / (img.naturalHeight || 1);
  return [
    {
      paint: (ctx, w, h) => {
        const { icon } = planLogo(ctx, label, family, w, h);
        const iw = ratio >= 1 ? icon.size : icon.size * ratio;
        const ih = ratio >= 1 ? icon.size / ratio : icon.size;
        ctx.drawImage(img, icon.x + (icon.size - iw) / 2, icon.y + (icon.size - ih) / 2, iw, ih);
      },
    },
    {
      text: true,
      paint: (ctx, w, h) => {
        for (const { line, x, y } of planLogo(ctx, label, family, w, h).text) ctx.fillText(line, x, y);
      },
    },
  ];
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
