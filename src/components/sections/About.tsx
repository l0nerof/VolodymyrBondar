import { getTranslations } from "next-intl/server";

import { Bubble } from "@/components/comic/Bubble";
import { Caption } from "@/components/comic/Caption";
import { Panel } from "@/components/comic/Panel";
import { SectionHead } from "@/components/comic/SectionHead";
import { ROLES, yearsInWeb } from "@/data/experience";
import { PROJECTS } from "@/data/projects";
import { STACK_GROUPS } from "@/data/stack";
import { kyivUtcOffset } from "@/lib/kyiv";

import { CountUp } from "./CountUp";
import { KyivOffset } from "./KyivOffset";
import { Stack } from "./Stack";
import { VisitorLine } from "./VisitorLine";

const CAPABILITIES = ["frontend", "apis", "legacy", "tooling"] as const;

/** A comic page of panels: what he does now (in his own words), the numbers,
 * the stack the swarm draws, where he is (the swarm's globe) and what he can
 * take on. The globe and the stack stage stay see-through for the swarm. */
export async function About() {
  const t = await getTranslations("About");
  const comic = await getTranslations("Comic");
  const stats = [
    { value: yearsInWeb(), suffix: "+", label: "years" },
    { value: PROJECTS.length, suffix: "", label: "projects" },
    { value: ROLES.length, suffix: "", label: "roles" },
  ] as const;

  return (
    <section id="about" className="my-24">
      <SectionHead chapter={comic("chapter", { number: 2, title: t("chapter") })} title={t("title")} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="overflow-hidden lg:col-span-2">
          <div
            aria-hidden
            className="dots pointer-events-none absolute inset-0 opacity-35 [--dot:var(--accent-2)] [mask-image:radial-gradient(circle_at_100%_100%,black,transparent_55%)]"
          />
          <Caption className="-rotate-1">{t("nowLabel")}</Caption>
          <Bubble className="mt-9 max-w-2xl">
            <p className="text-[clamp(1.1rem,1.9vw,1.4rem)] leading-snug font-semibold">{t("now")}</p>
          </Bubble>
        </Panel>

        <Panel solid>
          <dl className="grid h-full content-center gap-6">
            {stats.map((stat) => (
              // The term comes first for screen readers; the number shows first.
              <div key={stat.label} className="flex items-baseline gap-4">
                <dt className="order-last text-sm leading-tight font-bold uppercase">
                  {t(`stats.${stat.label}`, { count: stat.value })}
                </dt>
                <dd className="min-w-24 font-display text-[3.6rem] leading-[0.85] font-black tabular-nums italic [text-shadow:3px_3px_0_var(--accent-2)]">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel className="lg:col-span-2">
          <Caption className="rotate-1">{t("stack")}</Caption>
          <div className="mt-6">
            <Stack
              label={t("stack")}
              tabs={STACK_GROUPS.map((group) => ({ ...group, label: t(`stackGroups.${group.key}`) }))}
            />
          </div>
        </Panel>

        <Panel>
          <Caption className="-rotate-1">{t("whereLabel")}</Caption>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {t.rich("where", { offset: () => <KyivOffset atBuild={kyivUtcOffset()} /> })}
          </p>
          <VisitorLine className="mt-3 text-sm font-bold text-accent-ink" />
          {/* The swarm draws the globe here; drag spins it. */}
          <div
            data-swarm-globe
            aria-hidden
            className="mx-auto mt-4 aspect-square w-full max-w-60 cursor-grab touch-pan-y select-none data-[dragging=true]:cursor-grabbing"
          />
        </Panel>
      </div>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CAPABILITIES.map((key, index) => (
          <li key={key} className="border-[3px] border-line-strong p-6">
            <p
              aria-hidden
              className="font-display text-5xl leading-none font-black text-accent italic [paint-order:stroke_fill] [-webkit-text-stroke:0.08em_var(--on-accent)]"
            >
              {index + 1}
            </p>
            <h3 className="mt-4 font-display text-xl leading-tight font-black uppercase italic">
              {t(`capabilities.${key}.title`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t(`capabilities.${key}.body`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
