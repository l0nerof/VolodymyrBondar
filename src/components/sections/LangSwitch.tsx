"use client";

import { Link, usePathname } from "@/navigation";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { locale: "ua", lang: "uk" },
  { locale: "en", lang: "en" },
] as const;

/** UA / EN: the same page in the other language. */
export function LangSwitch({ locale, label }: { locale: string; label: string }) {
  const pathname = usePathname();

  return (
    <span role="group" aria-label={label} className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em]">
      {LANGUAGES.map((language, index) => (
        <span key={language.locale} className="inline-flex items-center gap-1.5">
          {index > 0 && (
            <span aria-hidden className="opacity-40">
              /
            </span>
          )}
          <Link
            href={pathname}
            locale={language.locale}
            lang={language.lang}
            hrefLang={language.lang}
            aria-current={locale === language.locale ? "true" : undefined}
            className={cn(
              "py-2 transition-colors duration-150",
              locale === language.locale ? "text-ink" : "text-muted hover:text-ink"
            )}
          >
            {language.locale.toUpperCase()}
          </Link>
        </span>
      ))}
    </span>
  );
}
