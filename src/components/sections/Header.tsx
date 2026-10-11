import { getLocale, getTranslations } from "next-intl/server";

import { EditionToggle } from "@/components/comic/EditionToggle";
import { getPathname } from "@/navigation";

import { Contents } from "./Contents";
import { LangSwitch } from "./LangSwitch";

const SECTIONS = [
  { id: "about", key: "about" },
  { id: "projects", key: "projects" },
  { id: "work-experience", key: "experience" },
  { id: "contact", key: "contact" },
] as const;

/** The fixed header: the "V.B." mark, the sections, the night/day switch and
 * the language. Below `lg` the sections move into the Contents panel. */
export async function Header() {
  const locale = await getLocale();
  const t = await getTranslations("Navigation");
  const edition = await getTranslations("Edition");
  // The home page's address ("/ua" or "/en") in front of each anchor: on the
  // home page the links scroll, from the 404 page they lead home.
  const home = getPathname({ locale, href: "/" });
  const links = SECTIONS.map(({ id, key }) => ({ href: `${home}#${id}`, label: t(key) }));

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b-[3px] border-line-strong bg-paper">
      {/* Tighter gaps and padding below `sm`: with the Contents button the
          row has to fit a 320px phone in English too, whose labels are wider
          (NIGHT / DAY / CONTENTS). */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-6 sm:px-6">
        <a
          href={`${home}#hero`}
          aria-label={`V.B. · ${t("home")}`}
          className="font-sfx text-2xl text-accent [paint-order:stroke_fill] [-webkit-text-stroke:5px_var(--on-accent)]"
        >
          V.B.
        </a>
        <div className="flex items-center gap-2 sm:gap-6">
          <nav aria-label={t("main")} className="hidden lg:block">
            <ul className="flex items-center gap-6 text-[13px] font-bold tracking-[0.04em] uppercase">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="py-2 transition-colors duration-150 hover:text-accent-ink">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <EditionToggle labels={{ group: edition("label"), night: edition("night"), day: edition("day") }} />
          <LangSwitch locale={locale} label={t("language")} />
          <Contents label={t("contents")} links={links} className="lg:hidden" />
        </div>
      </div>
    </header>
  );
}
