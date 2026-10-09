import { afterEach, describe, expect, it, vi } from "vitest";

import { HOME, distanceKm, hoursFromHome, isHome, visitorPlace } from "./visitor";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("visitor", () => {
  it("measures great-circle distances from Kyiv", () => {
    const london = visitorPlace("Europe/London");
    expect(london).not.toBeNull();
    expect(distanceKm(london!, HOME)).toBeGreaterThan(2110);
    expect(distanceKm(london!, HOME)).toBeLessThan(2150);
  });

  it("knows Kyiv under both spellings and nothing for unknown zones", () => {
    expect(isHome("Europe/Kyiv")).toBe(true);
    expect(isHome("Europe/Kiev")).toBe(true);
    expect(isHome("Europe/Warsaw")).toBe(false);
    expect(visitorPlace("Antarctica/Troll")).toBeNull();
  });

  it("counts the hours between the visitor's clock and Ukraine's", () => {
    vi.stubEnv("TZ", "America/New_York");
    expect(hoursFromHome(new Date("2026-01-15T12:00:00Z"))).toBe(-7);
    expect(hoursFromHome(new Date("2026-07-15T12:00:00Z"))).toBe(-7);

    vi.stubEnv("TZ", "Europe/London");
    expect(hoursFromHome(new Date("2026-10-09T12:00:00Z"))).toBe(-2);

    vi.stubEnv("TZ", "Asia/Kolkata");
    expect(hoursFromHome(new Date("2026-01-15T12:00:00Z"))).toBe(3.5);
  });
});
