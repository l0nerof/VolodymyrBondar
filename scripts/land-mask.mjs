// Draws src/data/globe.json's countries on a 720x360 equirectangular canvas
// in Chrome (0 sea, 1 land, 2 Ukraine) and stores the result as run lengths
// in src/data/land-mask.json, with Ukraine's outline for the cover's egg.
// The swarm used to do this in every visitor's browser, after downloading
// the 566 KB GeoJSON. Run it again after changing globe.json:
//
//   node scripts/land-mask.mjs
import { readFileSync, writeFileSync } from "node:fs";

import { chromium } from "@playwright/test";

const WIDTH = 720;
const HEIGHT = 360;
const source = new URL("../src/data/globe.json", import.meta.url);
const target = new URL("../src/data/land-mask.json", import.meta.url);

const geo = JSON.parse(readFileSync(source, "utf8"));
const ukraine = geo.features.find((feature) => feature.properties.name === "Ukraine");
if (!ukraine) throw new Error("land-mask: globe.json has no Ukraine");

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
const kind = await page.evaluate(
  ({ geo, width, height }) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    // willReadFrequently keeps the canvas on the CPU rasteriser, the same
    // in headless Chrome as in a visitor's.
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const draw = (geometry, fill) => {
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
    const isUkraine = (feature) => feature.properties.name === "Ukraine";
    for (const feature of geo.features) if (!isUkraine(feature)) draw(feature.geometry, "#0000ff");
    for (const feature of geo.features) if (isUkraine(feature)) draw(feature.geometry, "#ff00ff");

    const { data } = ctx.getImageData(0, 0, width, height);
    return Array.from({ length: width * height }, (_, i) => (data[i * 4] > 127 ? 2 : data[i * 4 + 2] > 127 ? 1 : 0));
  },
  { geo, width: WIDTH, height: HEIGHT }
);
await browser.close();

// Run lengths: kind, count, kind, count… in reading order.
const runs = [];
for (let i = 0; i < kind.length; ) {
  let j = i;
  while (j < kind.length && kind[j] === kind[i]) j++;
  runs.push(kind[i], j - i);
  i = j;
}
const outline = ukraine.geometry.type === "Polygon" ? ukraine.geometry.coordinates : ukraine.geometry.coordinates.flat();

writeFileSync(target, `${JSON.stringify({ width: WIDTH, height: HEIGHT, runs, ukraine: outline })}\n`);
console.log(`land-mask.json: ${runs.length / 2} runs, Ukraine's outline in ${outline.flat().length} points`);
