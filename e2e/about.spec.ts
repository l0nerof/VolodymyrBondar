import { expect, test } from "@playwright/test";

import { ROLES, yearsInWeb } from "../src/data/experience";
import { PROJECTS } from "../src/data/projects";

const NUMBERS = [`${yearsInWeb()}+`, String(PROJECTS.length), String(ROLES.length)];

test.describe("the stack", () => {
  test("arrow keys move between categories, as ARIA tabs do", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard interaction.");
    await page.goto("/ua");
    const tabs = page.getByRole("tablist", { name: "Стек" }).getByRole("tab");
    await tabs.first().focus();

    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText("Zustand");

    await page.keyboard.press("End");
    await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowRight");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  });

  test("pointing at a technology puts it on the stage", async ({ page, isMobile }) => {
    test.skip(isMobile, "Hover interaction.");
    await page.goto("/ua");
    const stage = page.locator("[data-swarm-stack]");

    await page.getByRole("tabpanel").getByText("Next.js", { exact: true }).hover();

    await expect(stage).toHaveAttribute("data-swarm-show", "Next.js");
    await expect(stage).toHaveAttribute("data-swarm-icon", "/icons/stack/next.svg");
  });
});

test.describe("the visitor line", () => {
  test.describe("from London", () => {
    test.use({ timezoneId: "Europe/London" });
    test("says how far and how many hours", async ({ page }) => {
      await page.goto("/ua");
      // London and Kyiv change clocks on the same days: always two hours.
      // Ukrainian groups thousands with a no-break space, hence \s.
      await expect(page.getByText(/^Ваш пояс: Лондон · 2\s130 км · у вас на 2 години раніше$/)).toBeVisible();
    });
  });

  test.describe("from Kyiv", () => {
    test.use({ timezoneId: "Europe/Kyiv" });
    test("greets a neighbour", async ({ page }) => {
      await page.goto("/en");
      await expect(page.getByText("You are in Ukraine too")).toBeVisible();
    });
  });

  test.describe("from a zone it has no city for", () => {
    test.use({ timezoneId: "Pacific/Fiji" });
    test("still gives the hours", async ({ page }) => {
      await page.goto("/ua");
      await expect(page.getByText(/^Ваш час: у вас на \d+ годин(и|у)? пізніше$/)).toBeVisible();
    });
  });
});

test.describe("the numbers", () => {
  test("count up to the real values once seen", async ({ page }) => {
    await page.goto("/ua");
    const numbers = page.locator("#about dd [aria-hidden]");

    await page.locator("#about dl").scrollIntoViewIfNeeded();

    await expect(numbers).toHaveText(NUMBERS);
  });

  test("hold still with reduced motion, and screen readers always get the value", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/ua");

    await expect(page.locator("#about dd [aria-hidden]")).toHaveText(NUMBERS);
    await expect(page.locator("#about dd .sr-only")).toHaveText(NUMBERS);
  });
});
