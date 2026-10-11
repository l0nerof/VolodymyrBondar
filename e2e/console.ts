import type { Page } from "@playwright/test";

/** Collects console errors and warnings (hydration mismatches among them)
 * and uncaught exceptions while a test runs. */
export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`exception: ${error.message}`));
  return problems;
}
