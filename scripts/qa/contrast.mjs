// WCAG 2 contrast audit of every visible text node in <main> (and the page's
// header and footer) against its nearest opaque background.
//
//   node scripts/qa/contrast.mjs http://localhost:3000/ua [--theme=light] [--phone]
//
// Lists every text below its threshold (4.5:1, or 3:1 for large text) and
// the five closest calls. Outlined lettering (-webkit-text-stroke) is listed
// apart: its outline gives the contrast (WCAG counts a halo), which this
// script cannot measure, so check those by eye. Still a false positive:
// text on a starburst sticker, which is drawn by sibling layers rather than
// an ancestor background. Swarm-drawn text (the name, the clock) is
// transparent and skipped.
import { launch, parseArgs } from "./cdp.mjs";

const { url, phone, theme } = parseArgs();
const page = await launch({ phone, dark: theme !== "light" });

try {
  await page.gotoWithTheme(url, theme, 6500);
  const report = await page.eval(`(() => {
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    // Resolves any CSS colour (oklab, lab, color-mix…) to sRGB through a canvas.
    const toRgb = (c) => {
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data; return { r, g, b, a: a / 255 };
    };
    const lum = ({ r, g, b }) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const blend = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
    const bgOf = (el) => {
      const layers = [];
      for (let n = el; n; n = n.parentElement) {
        const c = toRgb(getComputedStyle(n).backgroundColor);
        if (c.a > 0) { layers.push(c); if (c.a >= 1) break; }
      }
      let base = toRgb(getComputedStyle(document.body).backgroundColor);
      for (let k = layers.length - 1; k >= 0; k--) base = blend(layers[k], base);
      return base;
    };
    const rows = [];
    const seen = new Set();
    for (const root of document.querySelectorAll("main, header, footer")) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const el = walker.currentNode.parentElement;
        const text = walker.currentNode.textContent.trim();
        if (!text || seen.has(el) || el.closest(".proto-picker")) continue;
        seen.add(el);
        const style = getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none") continue;
        const box = el.getBoundingClientRect();
        if (!box.width || !box.height) continue;
        const fg = toRgb(style.color);
        if (fg.a < 0.05) continue;
        const bg = bgOf(el);
        const L1 = lum(blend(fg, bg)), L2 = lum(bg);
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const size = parseFloat(style.fontSize);
        const large = size >= 24 || (Number(style.fontWeight) >= 700 && size >= 18.66);
        const outlined = parseFloat(style.webkitTextStrokeWidth) > 0;
        rows.push({ text: text.slice(0, 48), ratio: +ratio.toFixed(2), need: large ? 3 : 4.5, size, outlined });
      }
    }
    rows.sort((a, b) => a.ratio / a.need - b.ratio / b.need);
    const below = rows.filter((r) => r.ratio < r.need);
    return {
      checked: rows.length,
      failing: below.filter((r) => !r.outlined),
      outlined: below.filter((r) => r.outlined),
      closest: rows.filter((r) => r.ratio >= r.need).slice(0, 5),
    };
  })()`);
  console.log(`${url} [${theme}${phone ? ", phone" : ""}]: ${report.checked} texts, ${report.failing.length} below threshold`);
  for (const r of report.failing) console.log("  FAIL", JSON.stringify(r));
  if (report.outlined.length) {
    console.log(`  outlined, check by eye: ${report.outlined.map((r) => r.text).join(" · ")}`);
  }
  for (const r of report.closest) console.log("  ok  ", JSON.stringify(r));
} finally {
  await page.close();
}
