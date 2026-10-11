"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // next-themes renders an inline <script> that sets the theme class before
  // the first paint. On the client that script never runs and React warns
  // about it after a client-side navigation; typing it text/plain there
  // keeps the server copy working and silences the warning (see Next's
  // "preventing flash before hydration" guide). next-themes already marks
  // the element with suppressHydrationWarning.
  const scriptProps = { type: typeof window === "undefined" ? "text/javascript" : "text/plain" };

  return (
    <NextThemesProvider scriptProps={scriptProps} {...props}>
      {children}
    </NextThemesProvider>
  );
}
