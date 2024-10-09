import { getRequestConfig } from "next-intl/server";
import { Pathnames } from "next-intl/routing";
import { notFound } from "next/navigation";

// Can be imported from a shared config
export const locales = ["ua", "en"] as const;

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

export const pathnames = {
  "/": "/",
} satisfies Pathnames<typeof locales>;
