// Input, one reaction per channel:
//   cursor   — pushes dots away (sand)
//   click    — a small shockwave; a filter click moves the ring to it
//   keyboard — re-spells the hero; some words draw logos, emoji, Ukraine
//   drag     — spins the globe
//   theme    — a wave from where you clicked recolours the swarm
// (Scrolling is read every frame, in the engine.)
import { one } from "./dom";
import type { SwarmEngine } from "./engine";
import { DARK, LIGHT, paletteFromCss, type Palette } from "./palette";

const MAX_TYPED = 14;
const TYPED_IDLE_MS = 7000;
/** A press on these is a click on the page, not a shockwave. */
const INTERACTIVE = "a, button, input, select, textarea, label, [role='tab'], [data-swarm-globe]";

export function on<K extends keyof WindowEventMap>(
  swarm: SwarmEngine,
  type: K,
  fn: (e: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
) {
  window.addEventListener(type, fn, options);
  swarm.cleanups.push(() => window.removeEventListener(type, fn, options));
}

export function listen(swarm: SwarmEngine) {
  on(swarm, "pointermove", (e) => onMove(swarm, e), { passive: true });
  on(swarm, "pointerdown", (e) => {
    swarm.lastInput = performance.now();
    swarm.lastDown = { x: e.clientX, y: e.clientY, at: performance.now() };
    const interactive = (e.target as Element | null)?.closest(INTERACTIVE);
    swarm.press = { down: e.button === 0 && !interactive, x: e.clientX, y: e.clientY };
  });
  on(swarm, "pointerup", (e) => {
    const moved = Math.hypot(e.clientX - swarm.press.x, e.clientY - swarm.press.y) > 8;
    if (swarm.press.down && !moved && !swarm.reduced) swarm.burst(e.clientX, e.clientY, 320, 26);
    swarm.press.down = false;
    if (e.pointerType !== "mouse") swarm.pointer.active = false;
  });
  on(swarm, "pointercancel", () => {
    swarm.press.down = false;
    swarm.pointer.active = false;
  });
  const leave = () => {
    swarm.pointer.active = false;
  };
  document.documentElement.addEventListener("pointerleave", leave);
  swarm.cleanups.push(() => document.documentElement.removeEventListener("pointerleave", leave));

  on(swarm, "keydown", (e) => onKey(swarm, e));
  // Also catches the scrollbar appearing or going away, which changes the
  // canvas width without a window resize.
  const sized = new ResizeObserver(() => {
    window.clearTimeout(swarm.resizeTimer);
    swarm.resizeTimer = window.setTimeout(() => onResize(swarm), 120);
  });
  sized.observe(swarm.canvas);
  swarm.cleanups.push(() => sized.disconnect());
  listenGlobeDrag(swarm);
}

export function onMove(swarm: SwarmEngine, e: PointerEvent) {
  const p = swarm.pointer;
  if (p.active) {
    p.vx = e.clientX - p.x;
    p.vy = e.clientY - p.y;
  }
  p.x = e.clientX;
  p.y = e.clientY;
  p.active = e.pointerType === "mouse" || e.pressure > 0;
  swarm.lastInput = performance.now();
}

export function listenGlobeDrag(swarm: SwarmEngine) {
  const el = one<HTMLElement>("[data-swarm-globe]");
  if (!el) return;
  let lastX = 0;
  const down = (e: PointerEvent) => {
    if (!swarm.globe) return;
    el.setPointerCapture(e.pointerId);
    lastX = e.clientX;
    swarm.globe.spinVelocity = 0;
    el.dataset.dragging = "true";
  };
  const move = (e: PointerEvent) => {
    if (!swarm.globe || el.dataset.dragging !== "true") return;
    const delta = (e.clientX - lastX) * 0.009;
    lastX = e.clientX;
    swarm.globe.spin += delta;
    swarm.globe.spinVelocity = delta;
  };
  const up = () => {
    delete el.dataset.dragging;
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  swarm.cleanups.push(() => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
  });
}

/** Typing while the name is on screen re-spells it in dots. */
export function onKey(swarm: SwarmEngine, e: KeyboardEvent) {
  swarm.lastInput = performance.now();
  if (!swarm.stage("hero")?.active) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const target = e.target as HTMLElement | null;
  if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

  let next = swarm.typed;
  if (e.key === "Escape") next = "";
  else if (e.key === "Backspace" && next) next = Array.from(next).slice(0, -1).join("");
  else if (Array.from(e.key).length === 1 && (e.key !== " " || next)) {
    next = Array.from(next + e.key).slice(0, MAX_TYPED).join("");
  } else return;

  // Space would scroll the page mid-word, Backspace may navigate back.
  if (e.key === " " || e.key === "Backspace") e.preventDefault();
  setTyped(swarm, next);
}

export function setTyped(swarm: SwarmEngine, text: string) {
  swarm.typed = text.trim() ? text : "";
  window.clearTimeout(swarm.typedTimer);
  if (swarm.typed) swarm.typedTimer = window.setTimeout(() => setTyped(swarm, ""), TYPED_IDLE_MS);
  const hint = one<HTMLElement>("[data-swarm-hint]");
  if (hint) hint.dataset.typing = swarm.typed ? "true" : "false";
}

export function onResize(swarm: SwarmEngine) {
  swarm.width = swarm.canvas.clientWidth || window.innerWidth;
  swarm.height = swarm.canvas.clientHeight || window.innerHeight;
  swarm.renderer.resize(swarm.width, swarm.height, swarm.dpr);
  swarm.layoutVersion++;
  swarm.lastInput = performance.now();
}

export function watchEnvironment(swarm: SwarmEngine) {
  const root = document.documentElement;
  // The colours are CSS custom properties on :root (globals.css), one set
  // per issue. Each set is read once, on first use, so a palette keeps its
  // identity (the glyph colour caches and the check below rely on that).
  const palettes = new Map<boolean, Palette | null>();
  const readTheme = () => {
    const dark = root.classList.contains("dark");
    if (!palettes.has(dark)) palettes.set(dark, paletteFromCss(root));
    const next = palettes.get(dark) ?? (dark ? DARK : LIGHT);
    if (next === swarm.palette) return;
    // Recolour as a wave from wherever the visitor just clicked (the theme
    // toggle, in practice); the very first read is not a switch.
    const recent = performance.now() - swarm.lastDown.at < 1500;
    if (performance.now() - swarm.started > 500 && !swarm.reduced) {
      swarm.wave = recent
        ? { x: swarm.lastDown.x, y: swarm.lastDown.y, at: performance.now() }
        : { x: swarm.width - 60, y: 60, at: performance.now() };
    }
    swarm.palette = next;
  };
  readTheme();
  const observer = new MutationObserver(readTheme);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  swarm.cleanups.push(() => observer.disconnect());

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const readMotion = () => {
    swarm.reduced = motion.matches;
  };
  readMotion();
  motion.addEventListener("change", readMotion);
  swarm.cleanups.push(() => motion.removeEventListener("change", readMotion));
}
