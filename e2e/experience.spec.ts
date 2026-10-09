import { expect, test } from "@playwright/test";

import { ROLES } from "../src/data/experience";

const roles = (page: import("@playwright/test").Page) => page.locator("#work-experience ol > li");

test("the roles run newest first, the current one marked", async ({ page }) => {
  await page.goto("/ua");

  await expect(roles(page)).toHaveCount(ROLES.length);
  await expect(roles(page).first().getByRole("heading", { level: 3 })).toHaveText("Software engineer");
  await expect(roles(page).first()).toContainText(/— зараз/);
  await expect(page.locator("[data-swarm-dot][data-current='true']")).toHaveCount(1);
});

test("every role panel lines up with the others, the current one too", async ({ page, isMobile }) => {
  test.skip(isMobile, "One column of panels either way; the desktop check is enough.");
  await page.goto("/ua");

  // The current role's panel sits inside the moving border's 1px frame; it
  // used to be 1px narrower on each side than its neighbours.
  const edges = await roles(page).evaluateAll((items) =>
    items.map((li) => {
      const panel = Array.from(li.querySelectorAll("div")).find((div) => getComputedStyle(div).borderTopWidth === "3px")!;
      const box = panel.getBoundingClientRect();
      return [box.left, box.right];
    })
  );
  for (const edge of edges) expect(edge).toEqual(edges[1]);
});

test("the current role's glint travels round its border", async ({ page }) => {
  await page.goto("/ua");
  const glint = roles(page).first().locator("span[aria-hidden].size-20");

  await expect(glint).toBeVisible();
  await expect(glint).toHaveCSS("animation-name", "border-run");
});

test("with reduced motion the glint is gone", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ua");

  await expect(roles(page).first().locator("span[aria-hidden].size-20")).toBeHidden();
});
