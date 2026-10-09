import { expect, test } from "@playwright/test";

import { watchConsole } from "./console";

const LOCALES = [
  { path: "/ua", lang: "uk", work: "Переглянути роботи" },
  { path: "/en", lang: "en", work: "See my work" },
];

for (const { path, lang, work } of LOCALES) {
  test(`${path} renders the cover in its language`, async ({ page }) => {
    const problems = watchConsole(page);
    const response = await page.goto(path);

    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.getByRole("heading", { level: 1, name: "Volodymyr Bondar" })).toBeVisible();
    await expect(page.getByRole("link", { name: work })).toBeVisible();
    // Ukraine's offset is worked out for today, not written down.
    await expect(page.locator("#hero").getByText(/UTC\+[23]$/)).toBeVisible();
    expect(problems).toEqual([]);
  });
}

test("the night issue is the default and the day issue sticks", async ({ page }) => {
  await page.goto("/ua");
  const html = page.locator("html");
  const day = page.getByRole("button", { name: "День" });

  await expect(html).toHaveClass(/\bdark\b/);
  await day.click();
  await expect(html).not.toHaveClass(/\bdark\b/);
  await expect(day).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(html).not.toHaveClass(/\bdark\b/);
  await expect(day).toHaveAttribute("aria-pressed", "true");
});

test("the language switch shows the same page in English", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/ua");

  await page.getByRole("link", { name: "EN", exact: true }).click();

  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: "See my work" })).toBeVisible();
  expect(problems).toEqual([]);
});

test("an unknown address is a comic 404 that leads home", async ({ page }) => {
  const response = await page.goto("/ua/no-such-page");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Такої сторінки немає/);
  await page.getByRole("link", { name: /На головну/ }).click();
  await expect(page).toHaveURL(/\/ua$/);
});

test("the first Tab reaches the skip link", async ({ page, isMobile }) => {
  test.skip(isMobile, "No keyboard on the phone profile.");
  await page.goto("/ua");

  await page.keyboard.press("Tab");

  const skip = page.getByRole("link", { name: "Перейти до вмісту" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
});

test("below 1024px the sections are in the Contents panel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ua");
  const button = page.getByRole("button", { name: "Зміст" });
  const panel = page.getByRole("navigation", { name: "Зміст" });

  await expect(panel).toBeHidden();
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(panel.getByRole("link")).toHaveCount(4);

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(button).toBeFocused();

  await button.click();
  await page.mouse.click(20, 400);
  await expect(panel).toBeHidden();
});

test("each section link lands its section just below the header", async ({ page, isMobile }) => {
  await page.goto("/ua");
  const headerHeight = await page.locator("header").evaluate((el) => el.getBoundingClientRect().height);
  // Where anchors stop (globals.css); it has to clear the fixed header.
  const stop = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
  expect(stop).toBeGreaterThanOrEqual(headerHeight);

  for (const [name, id] of [
    ["Про мене", "about"],
    ["Проєкти", "projects"],
    ["Досвід", "work-experience"],
    ["Контакти", "contact"],
  ]) {
    // Phones reach the sections through the Contents panel.
    if (isMobile) await page.getByRole("button", { name: "Зміст" }).click();
    const nav = page.getByRole("navigation", { name: isMobile ? "Зміст" : "Розділи" });
    await nav.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));

    // The scroll is smooth and, with software WebGL, its frames can be slow:
    // poll for the end position rather than guessing when it has stopped.
    const top = () => page.locator(`#${id}`).evaluate((el) => Math.round(el.getBoundingClientRect().top));
    await expect.poll(top, { message: id, timeout: 10_000 }).toBe(stop);
  }
});

test("the header fits a 320px phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });

  // English labels are the wider ones (NIGHT / DAY / CONTENTS).
  for (const path of ["/ua", "/en"]) {
    await page.goto(path);

    // The header is fixed, so an overflow there never shows as page scroll.
    const row = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("header > div > a, header > div > div > *"))
        .filter((el) => getComputedStyle(el).display !== "none")
        .map((el) => el.getBoundingClientRect());
      return { left: items[0].left, right: Math.max(...items.map((box) => box.right)), overlaps: items.some((box, i) => i > 0 && box.left < items[i - 1].right) };
    });

    expect(row.left, path).toBeGreaterThanOrEqual(16);
    expect(row.right, path).toBeLessThanOrEqual(320 - 16);
    expect(row.overlaps, path).toBe(false);
  }
});

for (const width of [320, 390, 768, 1024, 1280, 1366, 1440]) {
  test(`nothing spills off a ${width}px screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });

    // Both languages: their long words differ ("ПОГОВОРИМО?", "EXPERIENCE").
    for (const path of ["/ua", "/en"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBe(0);

      // Anything past the left edge, or past either edge in the fixed header,
      // never shows as page scroll: it is simply cut off.
      const cut = await page.evaluate(() =>
        Array.from(document.querySelectorAll("header *, main *, footer *"))
          .filter((el) => {
            const box = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            const outside = box.left < -0.5 || box.right > document.documentElement.clientWidth + 0.5;
            return box.width >= 2 && box.height >= 2 && outside && style.visibility !== "hidden" && style.opacity !== "0";
          })
          .map((el) => el.textContent?.trim().slice(0, 30))
      );
      expect(cut, path).toEqual([]);
    }
  });
}

test("the rotating line holds still with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ua");
  const first = page.getByText("Будую інтерфейси на React і TypeScript").last();

  await expect(first).toBeVisible();
  await page.waitForTimeout(3500);
  await expect(first).toBeVisible();
  await expect(page.getByText("Пишу API та бекенд на Node.js").last()).toBeHidden();
});
