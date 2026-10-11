import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // BCP 47 codes: Intl formats numbers, dates and plurals by them, and "ua"
  // is not a language (Ukrainian is "uk"), so Intl fell back to the browser's
  // or the server's own language.
  locales: ["uk", "en"],
  defaultLocale: "uk",
  // The Ukrainian pages keep their /ua addresses.
  localePrefix: { mode: "always", prefixes: { uk: "/ua" } },
  // The page's metadata lists the languages (layout.tsx), with production
  // addresses. The proxy's own Link header disagreed on x-default ("/") and
  // named whatever host served the request, preview deployments included.
  alternateLinks: false,
});
