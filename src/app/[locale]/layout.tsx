import { Inter } from "next/font/google";
import type { Metadata } from "next";

import "./globals.css";

import { ThemeProvider } from "@/components/ui/ThemeProvider";
import Footer from "@/components/Footer/Footer";
import NavBar from "@/components/ui/NavBar";
import { useTranslations } from "next-intl";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Volodymyr Bondar - Front-end Developer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = useTranslations("Navigation");

  const navItems = [
    {
      name: t("home"),
      link: "#hero",
    },
    {
      name: t("about"),
      link: "#about",
    },
    {
      name: t("projects"),
      link: "#projects",
    },
    // {
    //   name: t("workExperience"),
    //   link: "#work-experience",
    // },
    // {
    //   name: t("approach"),
    //   link: "#approach",
    // },
    {
      name: t("contact"),
      link: "#contact",
    },
  ];

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.className} dark:bg-black-100 dark:text-white text-black-100 bg-white`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="max-w-7xl mx-auto relative">
            <NavBar navItems={navItems} />

            <main>{children}</main>

            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
