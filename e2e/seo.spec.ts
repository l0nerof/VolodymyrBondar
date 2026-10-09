import { expect, test } from "@playwright/test";

const SITE = "https://volodymyrbondar.vercel.app";

const PAGES = [
  { path: "/ua", title: "Володимир Бондар · Software engineer", ogLocale: "uk_UA" },
  { path: "/en", title: "Volodymyr Bondar · Software engineer", ogLocale: "en_US" },
];

for (const { path, title, ogLocale } of PAGES) {
  test(`${path} introduces itself to search engines and link previews`, async ({ page, request, isMobile }) => {
    test.skip(isMobile, "The head is the same on every device.");
    await page.goto(path);
    await expect(page).toHaveTitle(title);

    const head = page.locator("head");
    await expect(head.locator('meta[name="description"]')).toHaveAttribute("content", /Panenco/);
    await expect(head.locator('link[rel="canonical"]')).toHaveAttribute("href", SITE + path);
    for (const [hreflang, href] of [
      ["uk", "/ua"],
      ["en", "/en"],
      ["x-default", "/ua"],
    ]) {
      await expect(head.locator(`link[rel="alternate"][hreflang="${hreflang}"]`)).toHaveAttribute("href", SITE + href);
    }
    await expect(head.locator('meta[property="og:locale"]')).toHaveAttribute("content", ogLocale);
    await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

    // The cover is served as it is linked: no detour through the locale proxy.
    const image = await head.locator('meta[property="og:image"]').getAttribute("content");
    expect(image).toMatch(new RegExp(`^${SITE}/`));
    const response = await request.get(image!.slice(SITE.length), { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    await expect(head.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
  });
}

test("there is no cover for an unknown language", async ({ request, isMobile }) => {
  test.skip(isMobile, "Not a page.");
  // The proxy lets cover addresses through untouched, so the image itself
  // must turn away a segment that is not a locale.
  expect((await request.get("/ua/opengraph-image", { maxRedirects: 0 })).status()).toBe(404);
});

test("robots.txt points at the sitemap, which lists both languages", async ({ request, isMobile }) => {
  test.skip(isMobile, "Not a page.");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(`<loc>${SITE}/ua</loc>`);
  expect(sitemap).toContain(`<loc>${SITE}/en</loc>`);
  expect(sitemap).toContain(`hreflang="en" href="${SITE}/en"`);
});
