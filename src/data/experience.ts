export type RoleKey = "panenco" | "developsToday" | "bettorFaster";

export type Role = {
  key: RoleKey;
  company: string;
  /** "YYYY-MM", or "YYYY" when the month is not given. */
  start: string;
  /** Same format; null for the current role. */
  end: string | null;
};

/** Newest first, the order a reader wants. Titles and descriptions are in
 * messages (Experience.roles). */
export const ROLES: Role[] = [
  { key: "panenco", company: "Panenco", start: "2026-03", end: null },
  { key: "developsToday", company: "DevelopsToday", start: "2025-11", end: "2026-03" },
  { key: "bettorFaster", company: "BettorFaster", start: "2024-03", end: "2025-11" },
];

function parse(value: string) {
  const [year, month] = value.split("-").map(Number);
  return { year, month: month || null };
}

/** Whole years since `start`; a start without a month counts from January. */
export function yearsSince(start: string, now = new Date()): number {
  const { year, month } = parse(start);
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - (month ?? 1));
  return Math.max(0, Math.floor(months / 12));
}

/** Years in web development, counted from the first role. */
export function yearsInWeb(now = new Date()): number {
  const first = ROLES.reduce((earliest, role) => (role.start < earliest ? role.start : earliest), ROLES[0].start);
  return yearsSince(first, now);
}

/** "2024", or with a month "бер. 2024" / "Mar 2024". The year suffix
 * Ukrainian dates carry ("2024 р.") is dropped: a period badge reads better
 * without it. */
export function formatMonth(value: string, locale: string): string {
  const { year, month } = parse(value);
  if (!month) return String(year);
  return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: "UTC" })
    .formatToParts(new Date(Date.UTC(year, month - 1, 1)))
    .filter((part) => part.type === "month" || part.type === "year" || (part.type === "literal" && part.value === " "))
    .map((part) => part.value)
    .join("");
}
