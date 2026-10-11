import { expect, test } from "@playwright/test";

import { PROJECTS } from "../src/data/projects";

const cards = (page: import("@playwright/test").Page) => page.locator("#projects ul > li");

test("the filter shows commercial and personal work", async ({ page }) => {
  await page.goto("/ua");
  const filters = page.getByRole("group", { name: "Показати" });
  const commercial = PROJECTS.filter((project) => project.kind === "commercial").length;

  await expect(cards(page)).toHaveCount(PROJECTS.length);

  await filters.getByRole("button", { name: /Комерційні/ }).click();
  await expect(filters.getByRole("button", { name: /Комерційні/ })).toHaveAttribute("aria-pressed", "true");
  await expect(cards(page)).toHaveCount(commercial);

  await filters.getByRole("button", { name: /Особисті/ }).click();
  await expect(cards(page)).toHaveCount(PROJECTS.length - commercial);

  await filters.getByRole("button", { name: /Усі/ }).click();
  await expect(cards(page)).toHaveCount(PROJECTS.length);
});

test("every live project opens in a new tab; private ones say so", async ({ page }) => {
  await page.goto("/en");

  for (const project of PROJECTS.filter((item) => item.link)) {
    const link = page.locator(`#projects a[href="${project.link}"]`);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveAccessibleName(/^Open live site: /);
  }
  await expect(cards(page).filter({ hasText: "Rollin" })).toContainText("Private");
});

test("a card leans towards the mouse", async ({ page, isMobile }) => {
  test.skip(isMobile, "Touch screens get a flat card.");
  await page.goto("/ua");
  const card = cards(page).nth(1);
  await card.scrollIntoViewIfNeeded();

  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.25);

  await expect(card.locator(".transform-3d").first()).toHaveAttribute("style", /rotateY\(.+deg\) rotateX\(.+deg\)/);
});

test("with reduced motion the cards stay flat", async ({ page, isMobile }) => {
  test.skip(isMobile, "Touch screens get a flat card anyway.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ua");
  const card = cards(page).nth(1);
  await card.scrollIntoViewIfNeeded();

  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.25);

  await expect(card.locator(".transform-3d").first()).not.toHaveAttribute("style", /rotate/);
});
