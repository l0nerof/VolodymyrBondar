import { getTranslations } from "next-intl/server";

import { Caption } from "@/components/comic/Caption";
import { SocialIcons } from "@/components/comic/SocialIcons";

/** The end of the issue: copyright and the socials, nothing else. */
export async function Footer() {
  const t = await getTranslations("Footer");
  const comic = await getTranslations("Comic");

  return (
    <footer className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col gap-6 border-t-[3px] border-line-strong pt-6 pb-16 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Caption className="-rotate-1">{comic("theEnd")}</Caption>
          {/* A string, so the year is not grouped as "2 026". */}
          <p className="text-sm">{t("copyright", { year: String(new Date().getFullYear()) })}</p>
        </div>
        <SocialIcons />
      </div>
    </footer>
  );
}
