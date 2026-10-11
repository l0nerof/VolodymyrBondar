import { getLocale, getTranslations } from "next-intl/server";

import { Burst } from "@/components/comic/Burst";
import { MovingBorder } from "@/components/comic/MovingBorder";
import { SectionHead } from "@/components/comic/SectionHead";
import { ROLES, formatMonth, type Role } from "@/data/experience";
import { cn } from "@/lib/utils";

/** One role across the panel: who and when on the left, what on the right.
 * The text sits in the middle of the panel; the title block stays at the
 * top, next to the rail's dot. */
function RoleBody({ role, period, title, desc }: { role: Role; period: string; title: string; desc: string }) {
  return (
    <div className="grid gap-x-10 p-6 sm:p-8 md:grid-cols-[1fr_1.25fr]">
      <div>
        <p className="inline-block bg-accent px-2 py-0.5 text-[12px] font-bold text-on-accent tabular-nums uppercase">
          {period}
        </p>
        <h3 className="mt-3 font-display text-2xl leading-tight font-black uppercase italic sm:text-[1.8rem]">{title}</h3>
        <p className="mt-1 font-semibold text-muted">{role.company}</p>
      </div>
      {/* The room for the current role's "Now!" sticker comes off its text,
          not off the whole panel, so the columns line up with the others'. */}
      <p className={cn("mt-3 leading-relaxed text-muted md:mt-0 md:self-center", role.end === null && "md:pr-20")}>
        {desc}
      </p>
    </div>
  );
}

/** Chapter 4: the career rail. The swarm runs a current up the rail and
 * rings the dots ([data-swarm-rail], [data-swarm-dot]); each dot is centred
 * in its own grid column so the current runs exactly along the line. */
export async function Experience() {
  const locale = await getLocale();
  const t = await getTranslations("Experience");
  const comic = await getTranslations("Comic");

  return (
    <section id="work-experience" className="mb-28">
      <SectionHead
        chapter={comic("chapter", { number: 4, title: t("chapter") })}
        title={t("title")}
        highlight={t("highlight")}
      />

      <ol data-swarm-rail className="mt-4">
        {ROLES.map((role, index) => {
          const current = role.end === null;
          const isLast = index === ROLES.length - 1;
          const period = `${formatMonth(role.start, locale)} — ${role.end ? formatMonth(role.end, locale) : t("present")}`;
          const body = (
            <RoleBody role={role} period={period} title={t(`roles.${role.key}.title`)} desc={t(`roles.${role.key}.desc`)} />
          );

          return (
            <li
              key={role.key}
              className="grid grid-cols-[1.75rem_1fr] gap-x-3 [--dot-y:34px] sm:grid-cols-[2.5rem_1fr] sm:gap-x-6 sm:[--dot-y:42px]"
            >
              <div className="relative flex justify-center">
                <span
                  aria-hidden
                  className="absolute top-0 w-[3px] bg-line-strong"
                  style={{ height: isLast ? "calc(var(--dot-y) + 6px)" : "100%" }}
                />
                <span
                  aria-hidden
                  data-swarm-dot
                  data-current={current ? "true" : undefined}
                  className={cn(
                    "absolute size-3 rounded-full border-[3px] border-line-strong",
                    current ? "bg-accent" : "bg-paper"
                  )}
                  style={{ top: "calc(var(--dot-y) - 6px)" }}
                />
              </div>

              <div className={cn("relative", !isLast && "pb-10")}>
                {current && (
                  // White on red is 4.4:1 by day and 3.6:1 at night: enough for
                  // the 21px bold lettering as large text. On a phone the card
                  // is narrow, so the sticker shrinks to 15px lettering and sits
                  // half above the card, clear of the period badge; there it is
                  // decoration only, repeating the badge's "present", and screen
                  // readers skip it. Turned 12°, the sticker's box grows ~10px
                  // on each side; at -right-4 it ran past a phone's edge and the
                  // page scrolled sideways, so it hangs that far out only where
                  // the centred layout leaves a margin for it (1320px and up,
                  // counting a 15px scrollbar).
                  <Burst
                    tone="red"
                    floating
                    className="-top-12 -right-1 z-10 size-24 rotate-12 sm:-top-10 sm:size-32 min-[1320px]:-right-4"
                    textClassName="font-display text-[15px] font-black uppercase italic sm:text-[21px]"
                  >
                    <span aria-hidden>{t("now")}</span>
                  </Burst>
                )}
                {current ? <MovingBorder>{body}</MovingBorder> : <div className="border-[3px] border-line-strong">{body}</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
