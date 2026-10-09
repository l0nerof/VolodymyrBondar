import { expect, test } from "@playwright/test";

import { watchConsole } from "./console";

test("the swarm takes over the printed name", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/ua");
  const name = page.getByRole("heading", { level: 1, name: "Volodymyr Bondar" });

  // The engine marks the heading once its dots stand where the letters are;
  // the text then fades to transparent but stays in the page for readers.
  await expect(name).toHaveAttribute("data-swarm-ready", "true");
  await expect(name).toHaveCSS("color", "rgba(0, 0, 0, 0)");
  await expect(page.locator("canvas[aria-hidden]")).toHaveCSS("pointer-events", "none");
  expect(problems).toEqual([]);
});

test("without WebGL the name stays printed", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.call(this, type as "2d", ...(rest as []));
    } as typeof original;
  });
  await page.goto("/ua");
  const name = page.getByRole("heading", { level: 1, name: "Volodymyr Bondar" });

  await page.waitForTimeout(1500);
  await expect(name).not.toHaveAttribute("data-swarm-ready", "true");
  await expect(name).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
});

test("typing on the cover re-spells it, Escape brings the name back", async ({ page, isMobile }) => {
  test.skip(isMobile, "Typing is a keyboard interaction.");
  await page.goto("/ua");
  const hint = page.locator("[data-swarm-hint]");
  await expect(page.getByRole("heading", { level: 1 })).toHaveAttribute("data-swarm-ready", "true");

  await page.keyboard.type("react");
  await expect(hint).toHaveAttribute("data-typing", "true");
  await expect(hint.getByText(/Esc повертає ім'я/)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(hint).toHaveAttribute("data-typing", "false");
});

test("with reduced motion the swarm hints are gone", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ua");

  await expect(page.locator("[data-swarm-hint]")).toBeHidden();
});

test("a lost WebGL context hands the name back as text; the swarm resumes", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/ua");
  const name = page.getByRole("heading", { level: 1, name: "Volodymyr Bondar" });
  await expect(name).toHaveAttribute("data-swarm-ready", "true");

  // What a GPU reset does, on demand: the context goes, then comes back.
  await page.evaluate(() => {
    const gl = document.querySelector("canvas")!.getContext("webgl")!;
    const lose = gl.getExtension("WEBGL_lose_context")!;
    (window as unknown as { lose: WEBGL_lose_context }).lose = lose;
    lose.loseContext();
  });
  await expect(name).not.toHaveAttribute("data-swarm-ready", "true");
  await expect(name).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");

  await page.evaluate(() => (window as unknown as { lose: WEBGL_lose_context }).lose.restoreContext());
  await expect(name).toHaveAttribute("data-swarm-ready", "true");
  // Chrome itself reports the forced loss; anything else is ours.
  expect(problems.filter((line) => !line.includes("CONTEXT_LOST_WEBGL"))).toEqual([]);
});
