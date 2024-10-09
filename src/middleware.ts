import createMiddleware from "next-intl/middleware";
import { locales, pathnames } from "./i18n";

export default createMiddleware({
  // A list of all locales that are supported
  defaultLocale: "ua",
  locales,
  pathnames,
  // localeDetection: false,
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    "/",
    "/(ua|en)/:path*",
    "/((?!api|_next|_vercel|public|images|icons|.*\\..*).*)",
  ],
};
