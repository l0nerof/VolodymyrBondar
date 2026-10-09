import { describe, expect, it } from "vitest";

import { yearsSince } from "./experience";

describe("yearsSince", () => {
  it("counts whole years only", () => {
    expect(yearsSince("2020-05", new Date(2026, 3, 30))).toBe(5);
    expect(yearsSince("2020-05", new Date(2026, 4, 1))).toBe(6);
    expect(yearsSince("2020-05", new Date(2026, 11, 31))).toBe(6);
  });

  it("is never negative", () => {
    expect(yearsSince("2030-01", new Date(2026, 0, 1))).toBe(0);
  });
});
