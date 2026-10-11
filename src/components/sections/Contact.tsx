import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { FaGithub, FaLinkedin, FaTelegram } from "react-icons/fa";

import { Bubble } from "@/components/comic/Bubble";
import { Caption } from "@/components/comic/Caption";
import { SectionHead } from "@/components/comic/SectionHead";
import { Sfx } from "@/components/comic/Sfx";
import { popButton } from "@/components/comic/buttons";
import { CHANNELS, EMAIL, RESUME_URL } from "@/data/contact";

import { EmailCopy } from "./EmailCopy";
import { HomeClock } from "./HomeClock";

const OPEN_TO = ["fullTime", "partTime", "freelance"] as const;

const CHANNEL_ICONS = { Telegram: FaTelegram, LinkedIn: FaLinkedin, GitHub: FaGithub } as const;

/** The ways to get in touch, said in a speech bubble: the address (a click
 * copies it), the channels and the resume. */
async function Reach() {
  const t = await getTranslations("Contact");

  return (
    <div className="flex flex-col">
      <Caption>{t("fastest")}</Caption>
      <EmailCopy
        email={EMAIL}
        labels={{ copy: t("copy"), copied: t("copied") }}
        // Sized so the address fits one line in the bubble on a desktop.
        emailClassName="mt-4 block font-display text-[clamp(1.05rem,2.4vw,1.75rem)] leading-tight font-black wrap-break-word italic underline decoration-accent-2 decoration-4 underline-offset-[6px] transition-colors duration-200 ease-out hover:text-accent-ink"
        buttonClassName="mt-4 self-start text-sm font-bold uppercase underline decoration-2 underline-offset-4 transition-colors duration-200 ease-out hover:text-accent-ink hover:decoration-accent-2"
      />

      <Caption className="mt-10">{t("or")}</Caption>
      <ul className="mt-3 border-t-2 border-line-strong">
        {CHANNELS.map(({ name, href, handle }) => {
          const Icon = CHANNEL_ICONS[name as keyof typeof CHANNEL_ICONS];
          return (
            <li key={name}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 border-b-2 border-line-strong py-3.5 transition-colors duration-150 ease-out hover:text-accent-ink"
              >
                <Icon aria-hidden className="size-4 shrink-0 fill-current opacity-70" />
                <span className="font-medium">{name}</span>
                <span className="truncate text-xs opacity-70">{handle}</span>
                <ArrowUpRight
                  aria-hidden
                  strokeWidth={2.5}
                  className="ml-auto size-4 shrink-0 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </li>
          );
        })}
      </ul>

      <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className={`mt-8 self-start ${popButton.accent}`}>
        {t("resume")}
        <ArrowUpRight aria-hidden className="size-4 shrink-0" strokeWidth={3} />
      </a>
      <p className="mt-4 max-w-md text-xs leading-relaxed text-muted">{t("reachOut")}</p>
    </div>
  );
}

/** Chapter 6, the last page: the kinds of work on offer, the status, the
 * clock the swarm draws (behind the see-through panel), and how to get in
 * touch. */
export async function Contact() {
  const t = await getTranslations("Contact");
  const hero = await getTranslations("Hero");
  const comic = await getTranslations("Comic");

  return (
    <section id="contact" className="mb-24">
      <SectionHead chapter={comic("chapter", { number: 6, title: t("chapter") })} title={t("title")} />

      {/* In one column the DING! hangs in the gap above the bubble: the gap
          is wide enough that it clears the panel above. */}
      <div className="grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div className="border-[3px] border-line-strong p-7 sm:p-10">
          <p className="max-w-lg leading-relaxed text-muted">{t("body")}</p>

          <div className="mt-8">
            <Caption>{t("openTo")}</Caption>
            <ul className="mt-3 flex flex-wrap gap-2">
              {OPEN_TO.map((key) => (
                <li
                  key={key}
                  className="border-2 border-on-accent bg-bubble px-3 py-1 font-display text-[12px] font-black text-bubble-ink uppercase italic odd:-rotate-1 even:rotate-1"
                >
                  {t(`openToItems.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-8 inline-flex items-center gap-2.5 text-sm text-muted">
            <span aria-hidden className="size-3 rounded-full border-2 border-on-accent bg-accent" />
            {hero("status")} · {t("respond")}
          </p>

          <div className="mt-10 border-t border-line pt-8">
            <HomeClock label={t("time")} />
          </div>
        </div>

        <div className="relative self-start">
          {/* Hangs off the bubble's corner, but stays on screen: one column
              puts the bubble 16px (24px from sm) from the edge. */}
          <Sfx tone="yellow" className="absolute -top-10 -left-1 z-10 -rotate-12 sm:-left-4 lg:-left-6">
            {t("sfx")}
          </Sfx>
          <Bubble tail="right" className="p-7 sm:p-9">
            <Reach />
          </Bubble>
        </div>
      </div>

      <div className="mt-10 text-right">
        <Caption className="rotate-1 text-sm">{t("toBeContinued")}</Caption>
      </div>
    </section>
  );
}
