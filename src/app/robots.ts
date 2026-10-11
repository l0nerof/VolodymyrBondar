import type { MetadataRoute } from "next";

import { SITE_URL } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
  };
}
