import { getTranslations } from "next-intl/server";

import { Bubble } from "@/components/comic/Bubble";
import { Burst } from "@/components/comic/Burst";
import { Caption } from "@/components/comic/Caption";
import { Sfx } from "@/components/comic/Sfx";
import { SocialIcons } from "@/components/comic/SocialIcons";
import { popButton } from "@/components/comic/buttons";
import { yearsInWeb } from "@/data/experience";
import { kyivUtcOffset } from "@/lib/kyiv";

import { KyivOffset } from "./KyivOffset";
import { RotatingLine } from "./RotatingLine";
import { SwarmHints } from "./SwarmHints";

const BUILDS = ["interfaces", "apis", "tooling", "architecture"] as const;
const HINTS_POINTER = ["cursor", "click", "type"] as const;

/** The cover of issue #1: the status as a sticker, the name in cover
 * lettering, the role in a caption box and the pitch in a speech bubble. */
export async function Hero() {
  const t = await getTranslations("Hero");

  return (
    <section id="hero" className="relative pt-29 pb-20">
      <div className="flex items-start justify-between gap-4">
        <Caption className="-rotate-1">
          {t("issue")} · <KyivOffset atBuild={kyivUtcOffset()} />
        </Caption>
        {/* Sized so the longest wording (Ukrainian) sits inside the spikes on
            a phone and on a desktop; checked by measuring the text box. */}
        <Burst
          className="size-36 shrink-0 rotate-6 sm:size-52"
          textClassName="font-display text-[10px] font-black uppercase italic sm:text-[13px]"
        >
          {t("status")}!
        </Burst>
      </div>

      {/* The swarm prints the name in dots: it reads where the browser put
          each word ([data-swarm-word]) and then turns the text transparent,
          so the heading stays real text for screen readers, for selection
          and without WebGL. Capitals are typed, not text-transform, because
          the swarm draws the characters as written; the label keeps screen
          readers from spelling the capitals out. */}
      <h1
        data-swarm-name
        aria-label="Volodymyr Bondar"
        className="mt-4 text-center font-display text-[clamp(3rem,12.5vw,10rem)] leading-[0.9] font-black tracking-[-0.02em] italic transition-colors duration-1000 data-[swarm-ready=true]:text-transparent data-[swarm-ready=true]:selection:text-transparent"
      >
        <span className="block">
          <span data-swarm-word>VOLODYMYR</span>
        </span>
        <span className="block">
          <span data-swarm-word>BONDAR</span>
        </span>
      </h1>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <SwarmHints
          pointer={HINTS_POINTER.map((key) => ({ key: t(`hints.${key}.key`), does: t(`hints.${key}.does`) }))}
          touch={[{ key: t("hints.tap.key"), does: t("hints.tap.does") }]}
          typing={t("hints.typing")}
        />
        {/* What a click does, as the sound it would make. */}
        <Sfx className="-rotate-6 motion-reduce:hidden">{t("sfx")}</Sfx>
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <div>
          <p className="inline-block -rotate-1 border-[3px] border-on-accent bg-accent px-4 py-2 font-display text-[clamp(1.2rem,2.3vw,1.8rem)] leading-tight font-black text-on-accent uppercase italic shadow-[6px_6px_0_var(--pop)]">
            {t("role")}
          </p>
          <p className="mt-7 text-xl font-semibold">
            <RotatingLine items={BUILDS.map((key) => t(`builds.${key}`))} />
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <a href="#projects" className={popButton.accent}>
              {t("work")} <span aria-hidden>→</span>
            </a>
            <a href="#contact" className={popButton.bubble}>
              {t("contact")}
            </a>
          </div>
        </div>

        <div className="self-start lg:mt-3">
          <Bubble>
            <p className="text-lg leading-relaxed">{t("pitch", { years: yearsInWeb() })}</p>
          </Bubble>
          <SocialIcons className="mt-7" />
        </div>
      </div>
    </section>
  );
}
