import type { CSSProperties } from "react";

/** Inside a light box on a dark page (a speech bubble, a yellow panel) the
 * page's text tokens would be light on light. This points them, and the focus
 * ring, at the box's own ink. */
export function inkOn(ink: string, paper: string): CSSProperties {
  return {
    "--ink": ink,
    "--muted": `color-mix(in srgb, ${ink} 74%, ${paper})`,
    "--line": `color-mix(in srgb, ${ink} 22%, transparent)`,
    "--line-strong": ink,
    "--accent-ink": "var(--bubble-accent)",
    "--focus": ink,
    color: ink,
  } as CSSProperties;
}
