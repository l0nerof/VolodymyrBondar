"use client";

import { useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import DarkModeToggle from "./DarkModeToogle";
import LanguageToggle from "./LanguageToggle";
import { useTranslations } from "next-intl";
import { FaAddressCard, FaCode, FaHome, FaPhone } from "react-icons/fa";

function NavBar({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(true);
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
    {
      name: t("contact"),
      link: "#contact",
      icon: <FaPhone className="size-5" />,
    },
  ];

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    // Check if current is not undefined and is a number
    if (typeof current === "number") {
      let direction = current! - scrollYProgress.getPrevious()!;

      if (scrollYProgress.get() < 0.05) {
        setVisible(true);
      } else {
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "flex max-w-fit fixed top-10 inset-x-0 mx-auto border border-transparent dark:border-white/20 rounded-lg dark:bg-black-100 bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-5000 px-7 py-2 items-center justify-center gap-4",
          className
        )}
      >
        {navItems.map((navItem: any, idx: number) => (
          <Link
            key={`link=${idx}`}
            href={navItem.link}
            className={cn(
              "relative dark:text-white items-center flex text-black-100 dark:hover:text-neutral-500 hover:text-neutral-500 transition duration-300"
            )}
          >
            <span className="block sm:hidden">{navItem.icon}</span>
            <span className="hidden sm:block text-sm">{navItem.name}</span>
          </Link>
        ))}

        <DarkModeToggle />
        <LanguageToggle />
      </motion.div>
    </AnimatePresence>
  );
}
export default NavBar;
