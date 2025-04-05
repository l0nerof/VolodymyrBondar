"use client";

import { useLayoutEffect, useState } from "react";
import { useTheme } from "next-themes";
import { FaMoon, FaSun } from "react-icons/fa";
import { Button } from "@/components/ui/Button";

function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useLayoutEffect(() => {
    setIsDarkMode(theme === "dark");
  }, [theme]);

  function handleToggle() {
    const newTheme = isDarkMode ? "light" : "dark";
    setTheme(newTheme);
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className="dark:border-white/[0.2] border-black-100/[0.2]"
    >
      <FaSun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <FaMoon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default DarkModeToggle;
