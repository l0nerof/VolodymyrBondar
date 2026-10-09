"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";

import { HOME, distanceKm, hoursFromHome, isHome, visitorPlace } from "@/components/swarm/visitor";
import { cn } from "@/lib/utils";

const noop = () => () => {};

/** Under the globe: how far away the visitor is and how many hours apart,
 * guessed from the browser's time zone (nothing leaves the page). The swarm
 * draws the matching arc on the globe. Only the browser knows the zone, so
 * the server renders nothing here. */
export function VisitorLine({ className }: { className?: string }) {
  const t = useTranslations("Visitor");
  const locale = useLocale();

  const line = useSyncExternalStore(
    noop,
    () => {
      if (isHome()) return t("home");
      const hours = hoursFromHome();
      const offset =
        hours === 0
          ? t("same")
          : t(hours < 0 ? "behind" : "ahead", { hours: Math.abs(hours) });
      const place = visitorPlace();
      if (!place) return t("unknown", { offset });
      const km = Math.round(distanceKm(place, HOME) / 10) * 10;
      return t("place", { place: locale === "en" ? place.en : place.ua, km, offset });
    },
    () => null
  );
  if (!line) return null;

  return (
    <p className={cn("flex items-start gap-2 leading-relaxed", className)}>
      {/* A box one line tall centres the dot on the first line, wrapped or not. */}
      <span aria-hidden className="flex h-[1lh] shrink-0 items-center">
        <span className="size-1.5 rounded-full bg-accent-2" />
      </span>
      {line}
    </p>
  );
}
