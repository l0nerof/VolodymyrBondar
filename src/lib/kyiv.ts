/** Where the portfolio's owner lives and works. */
export const HOME_ZONE = "Europe/Kyiv";

/** Minutes `zone` is ahead of UTC at `at` (negative when behind). */
export function offsetMinutes(zone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  // The parts have no seconds, so compare with the start of the minute;
  // rounding the raw difference gave 119 instead of 120 after :30 seconds.
  const minuteStart = Math.floor(at.getTime() / 60000) * 60000;
  return (asUtc - minuteStart) / 60000;
}

/** Ukraine's offset as "UTC+2" (winter) or "UTC+3" (summer time). */
export function kyivUtcOffset(at = new Date()): string {
  const minutes = offsetMinutes(HOME_ZONE, at);
  const sign = minutes < 0 ? "−" : "+";
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  return `UTC${sign}${hours}${rest ? `:${String(rest).padStart(2, "0")}` : ""}`;
}
