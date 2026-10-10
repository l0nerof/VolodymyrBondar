import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import uk from "../../messages/uk.json";

describe("plurals", () => {
  it("declines hours in Ukrainian, fractions included", () => {
    const t = createTranslator({ locale: "uk", messages: uk, namespace: "Visitor" });
    expect(t("behind", { hours: 1 })).toBe("у вас на 1 годину раніше");
    expect(t("behind", { hours: 3 })).toBe("у вас на 3 години раніше");
    expect(t("behind", { hours: 7 })).toBe("у вас на 7 годин раніше");
    expect(t("ahead", { hours: 3.5 })).toBe("у вас на 3,5 години пізніше");
  });

  it("groups kilometres the way each language does", () => {
    const ukrainian = createTranslator({ locale: "uk", messages: uk, namespace: "Visitor" });
    const english = createTranslator({ locale: "en", messages: en, namespace: "Visitor" });
    // Ukrainian groups thousands with a no-break space.
    expect(ukrainian("place", { place: "Лондон", km: 2130, offset: "x" })).toBe(
      "Ваш пояс: Лондон · 2" + String.fromCharCode(0xa0) + "130 км · x"
    );
    expect(english("place", { place: "London", km: 2130, offset: "x" })).toBe("Your time zone: London · 2,130 km · x");
  });

  it("declines the About numbers", () => {
    const t = createTranslator({ locale: "uk", messages: uk, namespace: "About.stats" });
    expect(t("years", { count: 1 })).toBe("рік у вебі");
    expect(t("years", { count: 4 })).toBe("роки у вебі");
    expect(t("years", { count: 6 })).toBe("років у вебі");
    // Half years take the genitive: "2,5 року".
    expect(t("years", { count: 2.5 })).toBe("року у вебі");
    expect(t("projects", { count: 7 })).toBe("проєктів у портфоліо");
    expect(t("roles", { count: 5 })).toBe("команд і ролей");
  });

  it("writes half years in the cover's pitch the way each language does", () => {
    const ukrainian = createTranslator({ locale: "uk", messages: uk, namespace: "Hero" });
    const english = createTranslator({ locale: "en", messages: en, namespace: "Hero" });
    expect(ukrainian("pitch", { years: 2.5 })).toMatch(/^2,5 року у вебі\./);
    expect(english("pitch", { years: 2.5 })).toMatch(/^2\.5 years in web\./);
  });
});
