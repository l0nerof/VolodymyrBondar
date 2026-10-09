import { describe, expect, it } from "vitest";

import { formatMonth, yearsSince } from "./experience";

describe("yearsSince", () => {
  it("counts whole years only", () => {
    expect(yearsSince("2020-05", new Date(2026, 3, 30))).toBe(5);
    expect(yearsSince("2020-05", new Date(2026, 4, 1))).toBe(6);
    expect(yearsSince("2020-05", new Date(2026, 11, 31))).toBe(6);
  });

  it("counts a year without a month from January", () => {
    expect(yearsSince("2020", new Date(2025, 11, 31))).toBe(5);
    expect(yearsSince("2020", new Date(2026, 0, 1))).toBe(6);
  });

  it("is never negative", () => {
    expect(yearsSince("2030-01", new Date(2026, 0, 1))).toBe(0);
  });
});

describe("formatMonth", () => {
  it("shows a month in each language, without the Ukrainian year suffix", () => {
    expect(formatMonth("2024-03", "uk")).toBe("бер. 2024");
    expect(formatMonth("2024-03", "en")).toBe("Mar 2024");
  });

  it("shows a bare year as it is", () => {
    expect(formatMonth("2024", "uk")).toBe("2024");
  });
});
