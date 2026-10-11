import { describe, expect, it } from "vitest";

import { routing } from "./routing";

describe("routing", () => {
  // "ua" passed here unnoticed: Intl quietly fell back to the browser's or
  // the server's language, so Ukrainian pages could get English plurals and
  // number formats.
  it("names every locale by a language Intl has data for", () => {
    const locales = [...routing.locales];
    expect(Intl.PluralRules.supportedLocalesOf(locales)).toEqual(locales);
    expect(Intl.NumberFormat.supportedLocalesOf(locales)).toEqual(locales);
  });

  it("keeps the Ukrainian pages at /ua", () => {
    expect(routing.localePrefix).toEqual({ mode: "always", prefixes: { uk: "/ua" } });
  });
});
