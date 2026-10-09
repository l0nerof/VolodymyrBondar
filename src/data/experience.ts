export type RoleKey = "panenco" | "developsToday" | "bettorFaster" | "assistant" | "freelance";

export type Role = {
  key: RoleKey;
  company: string | null;
  /** "YYYY-MM". */
  start: string;
  /** "YYYY-MM", or null for the current role. */
  end: string | null;
};

// PLACEHOLDER dates: the years come from the prototype and the months are
// unknown. Replace them with the real ones before this reaches main.
/** Newest first, the order a reader wants. */
export const ROLES: Role[] = [
  { key: "panenco", company: "Panenco", start: "2025-01", end: null },
  { key: "developsToday", company: "DevelopsToday", start: "2024-01", end: "2025-01" },
  { key: "bettorFaster", company: "BettorFaster", start: "2023-01", end: "2024-01" },
  { key: "assistant", company: null, start: "2022-01", end: "2023-01" },
  { key: "freelance", company: null, start: "2020-01", end: "2022-01" },
];

/** Whole years since `start` ("YYYY-MM"). */
export function yearsSince(start: string, now = new Date()): number {
  const [year, month] = start.split("-").map(Number);
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  return Math.max(0, Math.floor(months / 12));
}

/** Years in web development, counted from the first role. */
export function yearsInWeb(now = new Date()): number {
  const first = ROLES.reduce((earliest, role) => (role.start < earliest ? role.start : earliest), ROLES[0].start);
  return yearsSince(first, now);
}
