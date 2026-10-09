// A minimal headless-Chrome driver over the DevTools Protocol (Node 24 has a
// built-in WebSocket), used by the QA scripts next to it.
//
// Why not the editor's built-in browser: when its pane is hidden it stops
// requestAnimationFrame, so the swarm never animates there. Why not
// Puppeteer/Playwright: nothing to install for a handful of checks.
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const CHROME =
  process.env.CHROME_PATH ??
  {
    win32: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  }[process.platform] ??
  "google-chrome";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Where screenshots go: scripts/qa/out (git-ignored). */
export function out(name) {
  const dir = join(here, "out");
  mkdirSync(dir, { recursive: true });
  return join(dir, name);
}

/** Small argv parser: positional URL plus --phone, --theme=light|dark, --tag=x. */
export function parseArgs(argv = process.argv.slice(2)) {
  const flags = Object.fromEntries(
    argv.filter((a) => a.startsWith("--")).map((a) => {
      const [key, value = "true"] = a.slice(2).split("=");
      return [key, value];
    })
  );
  const url = argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3000/ua";
  return { url, phone: flags.phone === "true", theme: flags.theme ?? "dark", tag: flags.tag ?? "qa" };
}

/**
 * Starts Chrome and returns a page API. `phone` emulates a 390x844 touch
 * screen; otherwise a 1440x900 window with real scrollbars (one swarm bug
 * only showed with a classic Windows scrollbar).
 */
export async function launch({ phone = false, dark = true } = {}) {
  const port = 9200 + Math.floor(Math.random() * 600);
  const width = phone ? 390 : 1440;
  const height = phone ? 844 : 900;
  const profile = join(tmpdir(), `qa-chrome-${port}`);
  mkdirSync(profile, { recursive: true });
  const proc = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      `--window-size=${width},${height}`,
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  // Chrome takes a moment to open its debugging port; poll it, and report the
  // last connection error if it never comes up.
  let targets = [];
  let lastError;
  for (let i = 0; i < 50 && !targets.some((t) => t.type === "page"); i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    } catch (error) {
      lastError = error;
    }
    if (!targets.some((t) => t.type === "page")) await sleep(200);
  }
  const target = targets.find((t) => t.type === "page");
  if (!target) {
    throw new Error(`Chrome did not start (looked for ${CHROME}; set CHROME_PATH)`, { cause: lastError });
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method === "Runtime.consoleAPICalled") {
      logs.push(`[${msg.params.type}] ` + msg.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
    } else if (msg.method === "Runtime.exceptionThrown") {
      logs.push("[exception] " + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text));
    } else if (msg.method === "Log.entryAdded") {
      logs.push(`[log:${msg.params.entry.level}] ${msg.params.entry.text}`);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, { resolve, reject });
      ws.send(JSON.stringify({ id: n, method, params }));
    });

  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: phone });
  if (phone) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }] });

  const api = {
    send,
    logs,
    sleep,
    /** Console errors, exceptions and hydration warnings seen so far. */
    errors: () => logs.filter((l) => /error|exception|hydrat/i.test(l)),
    /** Navigates, waits until the document has loaded (a dev server may still
     * be compiling), then gives the page `wait` ms to settle. */
    async goto(url, wait = 3000) {
      await send("Page.navigate", { url });
      await api.waitForLoad(new URL(url).origin);
      await sleep(wait);
    },
    async waitForLoad(origin, timeout = 60000) {
      let lastError;
      for (const start = Date.now(); Date.now() - start < timeout; await sleep(200)) {
        try {
          const [at, state] = await api.eval(`[location.origin, document.readyState]`);
          if (at === origin && state === "complete") return;
        } catch (error) {
          // The old document goes away mid-navigation; ask again.
          lastError = error;
        }
      }
      throw new Error(`${origin} did not finish loading in ${timeout} ms`, { cause: lastError });
    },
    /** Loads `url` with next-themes set to `theme` (stored in localStorage). */
    async gotoWithTheme(url, theme, wait = 7000) {
      await api.goto(url, 0);
      await api.eval(`localStorage.setItem("theme", ${JSON.stringify(theme)})`);
      await send("Page.reload", { ignoreCache: false });
      await api.waitForLoad(new URL(url).origin);
      await sleep(wait);
    },
    async eval(expression) {
      const res = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description ?? res.exceptionDetails.text);
      return res.result.value;
    },
    async shot(path) {
      const res = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(path, Buffer.from(res.data, "base64"));
      return path;
    },
    /** A zoomed crop, cut in the page itself: CDP clips of WebGL come out blank. */
    async crop(path, x, y, w, h, zoom = 2) {
      const res = await send("Page.captureScreenshot", { format: "png" });
      const data = await api.eval(`new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = ${w} * ${zoom}; c.height = ${h} * ${zoom};
          const ctx = c.getContext("2d");
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, ${x}, ${y}, ${w}, ${h}, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/png").split(",")[1]);
        };
        img.src = "data:image/png;base64,${res.data}";
      })`);
      writeFileSync(path, Buffer.from(data, "base64"));
      return path;
    },
    /** Screenshots taken while `during()` runs (say, a scroll), tiled into one
     * numbered image: the quickest way to see how the swarm travels. */
    async filmstrip(path, during, { frames = 12, every = 90, cols = 4, scale = 0.32 } = {}) {
      const shots = [];
      const work = during();
      for (let k = 0; k < frames; k++) {
        const res = await send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
        shots.push(res.data);
        await sleep(every);
      }
      await work;
      const data = await api.eval(`new Promise(async (resolve) => {
        const imgs = await Promise.all(${JSON.stringify(shots)}.map((b) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/jpeg;base64," + b; })));
        const w = imgs[0].width * ${scale}, h = imgs[0].height * ${scale}, rows = Math.ceil(imgs.length / ${cols});
        const c = document.createElement("canvas"); c.width = w * ${cols} + (${cols} - 1) * 4; c.height = h * rows + (rows - 1) * 4;
        const ctx = c.getContext("2d"); ctx.fillStyle = "#f0f"; ctx.fillRect(0, 0, c.width, c.height);
        imgs.forEach((img, k) => {
          const x = (k % ${cols}) * (w + 4), y = Math.floor(k / ${cols}) * (h + 4);
          ctx.drawImage(img, x, y, w, h);
          ctx.fillStyle = "#ff0"; ctx.font = "bold 14px sans-serif"; ctx.fillText(String(k), x + 6, y + 16);
        });
        resolve(c.toDataURL("image/jpeg", 0.8).split(",")[1]);
      })`);
      writeFileSync(path, Buffer.from(data, "base64"));
      return path;
    },
    async move(x, y, steps = 1, from) {
      const [sx, sy] = from ?? [x, y];
      for (let i = 1; i <= steps; i++) {
        await send("Input.dispatchMouseEvent", {
          type: "mouseMoved",
          x: sx + ((x - sx) * i) / steps,
          y: sy + ((y - sy) * i) / steps,
          pointerType: "mouse",
        });
        await sleep(16);
      }
    },
    async click(x, y) {
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    },
    async type(text) {
      for (const ch of text) {
        await send("Input.dispatchKeyEvent", { type: "keyDown", key: ch, text: ch });
        await send("Input.dispatchKeyEvent", { type: "keyUp", key: ch });
        await sleep(60);
      }
    },
    async scrollTo(y, wait = 1200) {
      await api.eval(`window.scrollTo({ top: ${y}, behavior: "instant" })`);
      await sleep(wait);
    },
    async close() {
      ws.close();
      proc.kill();
      await sleep(300);
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Could not remove the temporary Chrome profile ${profile}:`, error.message);
      }
    },
  };
  return api;
}
