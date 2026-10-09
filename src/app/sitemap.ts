import type { MetadataRoute } from "next";
import type { Locale } from "next-intl";

import { SITE_URL } from "@/data/site";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/navigation";

/** One page in two languages, /ua and /en, each naming the other. */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (locale: Locale) => new URL(getPathname({ locale, href: "/" }), SITE_URL).href;
  const languages = Object.fromEntries(routing.locales.map((locale) => [locale, url(locale)]));

  return routing.locales.map((locale) => ({ url: url(locale), alternates: { languages } }));
}
