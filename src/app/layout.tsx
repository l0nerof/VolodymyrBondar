import { Inter } from "next/font/google";
import type { Metadata } from "next";

import Header from "@/components/header/Header";

import "./globals.css";

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
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-black-100 text-white overflow-hidden`}
      >
        <div className="max-w-7xl mx-auto relative">
          <Header />

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
