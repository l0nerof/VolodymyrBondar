import type { Metadata } from "next";
import { type Locale, NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { fontVariables } from "@/components/comic/fonts";
import { Footer } from "@/components/sections/Footer";
import { Header } from "@/components/sections/Header";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { SITE_URL } from "@/data/site";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/navigation";

import "./globals.css";

/** The page in each language points at the other, so search engines show
 * the right one; link previews get the cover (opengraph-image.tsx). */
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const home = (other: Locale) => getPathname({ locale: other, href: "/" });

  return {
    metadataBase: new URL(SITE_URL),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: home(locale),
      languages: { uk: home("uk"), en: home("en"), "x-default": home(routing.defaultLocale) },
    },
    openGraph: {
      type: "website",
      siteName: t("name"),
      title: t("title"),
      description: t("description"),
      url: home(locale),
      locale: locale === "uk" ? "uk_UA" : "en_US",
      alternateLocale: locale === "uk" ? "en_US" : "uk_UA",
    },
    twitter: { card: "summary_large_image" },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Static rendering for both locales.
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations("Navigation");

  return (
    <html
      lang={locale}
      className={`${fontVariables} scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      {/* A column the height of the screen: on a short page (the 404) the
          footer sits at the bottom instead of right under the content. */}
      <body className="flex min-h-svh flex-col">
        {/* Client components get their words from the server as props. Only
            two read messages: the error page (Next renders it) and the
            visitor line, whose numbers only exist in the browser. */}
        <NextIntlClientProvider messages={{ Error: messages.Error, Visitor: messages.Visitor }}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <a
              href="#main"
              className="sr-only border-2 border-on-accent bg-accent px-3 py-2 text-sm font-bold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
            >
              {t("skip")}
            </a>
            <Header />
            <main id="main" className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 sm:px-6">
              {children}
            </main>
            <Footer />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
