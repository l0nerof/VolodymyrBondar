import { describe, expect, it } from "vitest";

import { kyivUtcOffset, offsetMinutes } from "./kyiv";

describe("offsetMinutes", () => {
  it("reads a zone's offset from UTC, including daylight saving", () => {
    expect(offsetMinutes("Europe/Kyiv", new Date("2026-01-15T12:00:00Z"))).toBe(120);
    expect(offsetMinutes("Europe/Kyiv", new Date("2026-07-15T12:00:00Z"))).toBe(180);
    expect(offsetMinutes("America/New_York", new Date("2026-01-15T12:00:00Z"))).toBe(-300);
    expect(offsetMinutes("Asia/Kolkata", new Date("2026-01-15T12:00:00Z"))).toBe(330);
  });

  it("stays exact after :30 seconds", () => {
    expect(offsetMinutes("Europe/Kyiv", new Date("2026-01-15T12:00:45Z"))).toBe(120);
  });
});

describe("kyivUtcOffset", () => {
  it("follows Ukraine's clock changes", () => {
    expect(kyivUtcOffset(new Date("2026-01-15T12:00:00Z"))).toBe("UTC+2");
    expect(kyivUtcOffset(new Date("2026-07-15T12:00:00Z"))).toBe("UTC+3");
    // Summer time ends at 01:00 UTC on the last Sunday of October.
    expect(kyivUtcOffset(new Date("2026-10-25T00:59:00Z"))).toBe("UTC+3");
    expect(kyivUtcOffset(new Date("2026-10-25T01:00:00Z"))).toBe("UTC+2");
  });
});
