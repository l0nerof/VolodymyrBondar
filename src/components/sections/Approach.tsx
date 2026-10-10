import { getTranslations } from "next-intl/server";

import { SectionHead } from "@/components/comic/SectionHead";

// Each phase keeps its own colour, always on (no hover gate): the band, its
// Ben-Day shading and the big number. The swarm's dust takes the same three
// colours behind the cards (data-swarm-field="tint").
const PHASES = [
  { key: "plan", band: "bg-tone-1", number: "text-tone-1", dots: "[--dot:var(--tone-1)]" },
  { key: "build", band: "bg-tone-2", number: "text-tone-2", dots: "[--dot:var(--tone-2)]" },
  { key: "launch", band: "bg-tone-3", number: "text-tone-3", dots: "[--dot:var(--tone-3)]" },
] as const;

/** Chapter 5: the way of working, in three numbered phases. */
export async function Approach() {
  const t = await getTranslations("Approach");
  const comic = await getTranslations("Comic");

  return (
    <section id="approach" className="mb-28">
      <SectionHead
        chapter={comic("chapter", { number: 5, title: t("chapter") })}
        title={t("title")}
        highlight={t("highlight")}
      />

      <ol className="grid gap-5 lg:grid-cols-3">
        {PHASES.map(({ key, band, number, dots }, index) => (
          <li key={key} className="relative overflow-hidden border-[3px] border-line-strong p-8">
            <div
              aria-hidden
              className={`dots absolute inset-x-0 top-0 h-16 [mask-image:linear-gradient(to_bottom,black,transparent)] ${dots}`}
            />
            <div aria-hidden className={`absolute inset-x-0 top-0 h-1.5 ${band}`} />
            <span
              aria-hidden
              className={`relative block font-display text-7xl leading-none font-black italic [paint-order:stroke_fill] [-webkit-text-stroke:0.07em_var(--on-accent)] ${number}`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="relative mt-6 font-display text-xl leading-tight font-black uppercase italic">
              {t(`phases.${key}.title`)}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t(`phases.${key}.desc`)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
