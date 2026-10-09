import { expect, test } from "@playwright/test";

import { CHANNELS, EMAIL, RESUME_URL } from "../src/data/contact";

test("the copy button copies the address and says so", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Clipboard permissions are a Chromium feature in Playwright.");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/ua");
  const button = page.getByRole("button", { name: `Скопіювати пошту: ${EMAIL}` });

  await button.click();

  await expect(button).toContainText("Скопійовано");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);
  // It says so for a moment, then offers to copy again.
  await expect(button).toContainText("Скопіювати пошту", { timeout: 4000 });
});

test("the address is still a mailto link", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("#contact").getByRole("link", { name: EMAIL })).toHaveAttribute("href", `mailto:${EMAIL}`);
});

test("the resume and every channel open in a new tab", async ({ page }) => {
  await page.goto("/ua");
  const contact = page.locator("#contact");

  const resume = contact.getByRole("link", { name: /Резюме/ });
  await expect(resume).toHaveAttribute("href", RESUME_URL);
  await expect(resume).toHaveAttribute("target", "_blank");
  for (const channel of CHANNELS) {
    const link = contact.locator(`a[href="${channel.href}"]`);
    await expect(link).toContainText(channel.handle);
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("the clock shows Ukraine's time", async ({ page }) => {
  await page.goto("/ua");
  const clock = page.locator("[data-swarm-clock] time");

  await expect(clock).toHaveText(/^\d{2}:\d{2}$/);
  const shown = await clock.textContent();
  const now = new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const near = [now.format(new Date()), now.format(new Date(Date.now() - 60_000))];
  expect(near).toContain(shown);
});

test("open to the work types the owner picked", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("#contact ul").first().locator("li")).toHaveText(["Full-time", "Part-time", "Freelance"]);
});
