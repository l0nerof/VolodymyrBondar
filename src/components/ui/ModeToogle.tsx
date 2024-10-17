"use client";

import { FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/Button";
import { useState } from "react";

export function ModeToggle() {
  const { setTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  function handleToggle() {
    if (isDarkMode) setTheme("dark");
    else setTheme("light");

    setIsDarkMode((prev) => !prev);
  }

  return (
    <Button variant="outline" size="icon" onClick={handleToggle}>
      <FaSun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <FaMoon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
