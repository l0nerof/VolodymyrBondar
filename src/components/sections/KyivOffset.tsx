"use client";

import { useSyncExternalStore } from "react";

import { kyivUtcOffset } from "@/lib/kyiv";

const noop = () => () => {};

/** Ukraine's UTC offset today: UTC+3 in summer, UTC+2 in winter. The page is
 * prerendered, so the server's value is the one from build time; if the
 * clocks have changed since, the client corrects it right after hydration. */
export function KyivOffset({ atBuild }: { atBuild: string }) {
  return useSyncExternalStore(noop, () => kyivUtcOffset(), () => atBuild);
}
