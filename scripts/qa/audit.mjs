// Swarm transition audit: scrolls between every pair of neighbouring sections
// in both directions, then back to the top and down to the end, and reports
// for each leg how much the visible dots streak and whether every shape in
// view is fully built once you arrive.
//
//   node scripts/qa/audit.mjs http://localhost:3000/ua [--phone] [--theme=light] [--tag=x]
//
// Needs the engine exposed as window.__swarm (see README.md: the dev hook).
//
// Reading it:
//   p95 / max  bright dots moving more than 6px in a frame. The flock that
//              carries the swarm between sections makes this large by design;
//              compare with a baseline run, do not aim for zero.
//   fill       members / shape.count of every active shape. "!" marks a shape
//              below 97%: that is a bug (a starved shape builds in jerks).
import { launch, parseArgs } from "./cdp.mjs";

const { url, phone, theme, tag } = parseArgs();
const page = await launch({ phone, dark: theme !== "light" });

const probeStart = () =>
  page.eval(`(() => {
    window.__chaos = []; window.__chaosOn = true; window.__by = {};
    const e = __swarm; const px = Float32Array.from(e.px), py = Float32Array.from(e.py); let sy = scrollY;
    (function probe() {
      if (!window.__chaosOn) return;
      const ds = scrollY - sy; sy = scrollY; let streak = 0;
      for (let i = 0; i < e.activeN; i++) {
        const owned = e.owner[i] >= 0;
        const v = Math.hypot(e.px[i] - px[i], e.py[i] - py[i] + (owned ? ds : ds * e.depth[i]));
        px[i] = e.px[i]; py[i] = e.py[i];
        if (v > 6 && e.colour[i * 4 + 3] > 0.12 && e.py[i] > 0 && e.py[i] < e.height) {
          streak++; const k = owned ? e.stages[e.owner[i]].name : "dust"; __by[k] = (__by[k] ?? 0) + 1;
        }
      }
      __chaos.push(streak);
      requestAnimationFrame(probe);
    })();
  })()`);
const probeStop = async () => {
  await page.eval(`window.__chaosOn = false`);
  const data = await page.eval(`__chaos`);
  const sorted = [...data].sort((a, b) => a - b);
  return { p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0, max: sorted[sorted.length - 1] ?? 0 };
};
const fill = () =>
  page.eval(
    `__swarm.stages.filter((s) => s.active && s.shape).map((s) => s.name + "=" + s.members.length + "/" + s.shape.count + (s.members.length < s.shape.count * 0.97 ? "!" : "")).join(" ")`
  );
// An eased scroll over `ms`, like a person flicking the wheel.
const glide = (to, ms) =>
  page.eval(`new Promise((resolve) => {
    const from = scrollY, start = performance.now();
    (function step(now) {
      const k = Math.min(1, (now - start) / ${ms});
      scrollTo(0, from + (${to} - from) * (0.5 - Math.cos(Math.PI * k) / 2));
      if (k < 1) requestAnimationFrame(step); else resolve();
    })(start);
  })`);

try {
  await page.gotoWithTheme(url, theme, 8000);
  if (!(await page.eval(`typeof window.__swarm === "object"`))) {
    console.error("window.__swarm is missing: add the dev hook first (scripts/qa/README.md).");
    process.exitCode = 1;
  } else {
    const stops = await page.eval(`(() => {
      const at = (selector, offset = 0) => {
        const el = document.querySelector(selector);
        return el ? Math.round(el.getBoundingClientRect().top + scrollY + offset) : null;
      };
      return [["hero", 0], ["about-globe", at("[data-swarm-globe]", -250)], ["projects", at("#projects", -80)],
        ["experience", at("#work-experience", -80)], ["approach", at("#approach", -80)], ["contact", at("#contact", -80)]]
        .filter(([, y]) => y !== null);
    })()`);
    const legs = [];
    for (let k = 1; k < stops.length; k++) legs.push([stops[k - 1], stops[k]]);
    for (let k = stops.length - 1; k > 0; k--) legs.push([stops[k], stops[k - 1]]);

    let underfilled = 0;
    for (const [[fromName], [toName, to]] of legs) {
      await probeStart();
      await glide(to, 1600);
      await page.sleep(1200);
      const m = await probeStop();
      const shapes = await fill();
      if (shapes.includes("!")) underfilled++;
      console.log(`${tag} ${fromName}→${toName}: p95=${m.p95} max=${m.max} | ${shapes}`);
    }

    const end = await page.eval(`document.documentElement.scrollHeight - innerHeight`);
    await page.scrollTo(end, 2500);
    await probeStart();
    await page.eval(`scrollTo({ top: 0, behavior: "smooth" })`);
    await page.sleep(3200);
    const up = await probeStop();
    console.log(`${tag} end→top (smooth): p95=${up.p95} max=${up.max} | ${await fill()}`);

    console.log(underfilled ? `${underfilled} leg(s) arrived with an underfilled shape` : "every shape filled on arrival");
    const errors = page.errors();
    if (errors.length) console.log(errors.join("\n"));
  }
} finally {
  await page.close();
}
