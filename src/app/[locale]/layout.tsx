import { Inter } from "next/font/google";
import type { Metadata } from "next";

import "./globals.css";

import { ThemeProvider } from "@/components/ui/ThemeProvider";
import Footer from "@/components/Footer/Footer";
import NavBar from "@/components/ui/NavBar";
import { useTranslations } from "next-intl";
import { FaAddressCard, FaCode, FaHome, FaPhone } from "react-icons/fa";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Volodymyr Bondar - Front-end Developer",
};

export default function RootLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const t = useTranslations("Navigation");

  const navItems = [
    {
      name: t("home"),
      link: "#hero",
      icon: <FaHome className="size-5" />,
    },
    {
      name: t("about"),
      link: "#about",
      icon: <FaAddressCard className="size-5" />,
    },
    {
      name: t("projects"),
      link: "#projects",
      icon: <FaCode className="size-5" />,
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
      icon: <FaPhone className="size-5" />,
    },
  ];

  return (
    <html lang={locale} className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.className} dark:bg-black-100 dark:text-white text-black-100 bg-white`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="max-w-7xl mx-auto px-2 md:px-0">
            <NavBar navItems={navItems} />

            <main>{children}</main>

            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
