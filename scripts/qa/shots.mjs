// Screenshots of a page, section by section, after the swarm has settled.
//
//   node scripts/qa/shots.mjs http://localhost:3000/ua [--phone] [--theme=light] [--tag=comic]
//
// Writes scripts/qa/out/<tag>-<desk|phone>-<theme>-<section>.png and prints
// console errors. Section anchors are the page's own ids; missing ones are
// skipped.
import { launch, out, parseArgs } from "./cdp.mjs";

const { url, phone, theme, tag } = parseArgs();
const page = await launch({ phone, dark: theme !== "light" });
const prefix = `${tag}-${phone ? "phone" : "desk"}-${theme}`;

try {
  await page.gotoWithTheme(url, theme);
  const stops = await page.eval(`(() => {
    const at = (selector, offset = 0) => {
      const el = document.querySelector(selector);
      return el ? Math.round(el.getBoundingClientRect().top + scrollY + offset) : -1;
    };
    return [
      ["hero", 0],
      ["about", at("#about", -90)],
      ["stack", at("[data-swarm-stack]", -300)],
      ["projects", at("#projects", -90)],
      ["experience", at("#work-experience", -90)],
      ["approach", at("#approach", -90)],
      ["contact", at("#contact", -90)],
      ["clock", at("[data-swarm-clock]", -450)],
    ];
  })()`);
  for (const [name, y] of stops) {
    if (y < 0) continue;
    // Long enough for the swarm to fly in and settle into the section's shape.
    await page.scrollTo(y, 2600);
    await page.shot(out(`${prefix}-${name}.png`));
  }
  const errors = page.errors();
  console.log(`${prefix}: ${stops.filter(([, y]) => y >= 0).length} shots, console: ${errors.length ? errors.join("\n") : "clean"}`);
} finally {
  await page.close();
}
