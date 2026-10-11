import { expect, test } from "@playwright/test";

test("three phases, each in its own colour, numbers hidden from readers", async ({ page }) => {
  await page.goto("/en");
  const phases = page.locator("#approach ol > li");

  await expect(phases).toHaveCount(3);
  await expect(phases.getByRole("heading", { level: 3 })).toHaveText([
    "Tailored Planning & Strategy",
    "Efficient Development & Transparent Communication",
    "Final Testing & Seamless Launch",
  ]);
  // The big numbers are decoration; the list already orders the phases.
  await expect(phases.first().locator("span[aria-hidden]")).toHaveText("01");

  const colours = await phases.evaluateAll((items) =>
    items.map((li) => getComputedStyle(li.querySelector("span[aria-hidden]")!).color)
  );
  expect(new Set(colours).size).toBe(3);
});
