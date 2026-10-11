import { describe, expect, it } from "vitest";

import { formatMonth, yearsSince } from "./experience";

describe("yearsSince", () => {
  it("counts down to the half year, as a resume does", () => {
    expect(yearsSince("2024-03", new Date(2026, 7, 31))).toBe(2); // 2 years 5 months
    expect(yearsSince("2024-03", new Date(2026, 8, 1))).toBe(2.5); // 2 years 6 months
    expect(yearsSince("2024-03", new Date(2026, 9, 10))).toBe(2.5); // 2 years 7 months
    expect(yearsSince("2024-03", new Date(2027, 2, 1))).toBe(3);
  });

  it("counts a year without a month from January", () => {
    expect(yearsSince("2020", new Date(2025, 11, 31))).toBe(5.5);
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
