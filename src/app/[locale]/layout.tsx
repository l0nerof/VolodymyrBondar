import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { fontVariables } from "@/components/comic/fonts";
import { Footer } from "@/components/sections/Footer";
import { Header } from "@/components/sections/Header";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { routing } from "@/i18n/routing";

import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Volodymyr Bondar - Front-end Developer",
};

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
      <body>
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
            <main id="main" className="mx-auto max-w-7xl px-4 sm:px-6">
              {children}
            </main>
            <Footer />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
