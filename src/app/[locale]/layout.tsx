import { Inter } from "next/font/google";
import type { Metadata } from "next";

import "./globals.css";

import { ThemeProvider } from "@/components/ui/ThemeProvider";
import Footer from "@/components/Footer/Footer";
import NavBar from "@/components/ui/NavBar";
import { FaHome } from "react-icons/fa";

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
  const navItems = [
    {
      name: "Home",
      link: "#hero",
      icon: <FaHome className="size-6 fill-white" />,
    },
    {
      name: "About",
      link: "#about",
      // icon: <IconUser className="h-4 w-4 text-neutral-500 dark:text-white" />,
    },
    {
      name: "Contact",
      link: "#contact",
      // icon: (
      //   <IconMessage className="h-4 w-4 text-neutral-500 dark:text-white" />
      // ),
    },
  ];

  return (
    <html lang="en">
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
