"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Lock } from "lucide-react";

import { Sfx } from "@/components/comic/Sfx";
import type { Project } from "@/data/projects";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/use-reduced-motion";

import { TiltCard, TiltLayer } from "./TiltCard";

export type GalleryItem = Project & { title: string; desc: string; role: string; result: string };

export type GalleryLabels = {
  filters: string;
  all: string;
  commercial: string;
  personal: string;
  figure: string;
  role: string;
  result: string;
  live: string;
  private: string;
  sfx: string;
};

type Filter = "all" | Project["kind"];

const EASE = [0.23, 1, 0.32, 1] as const;

const CHIP =
  "cursor-pointer rounded-md border-2 px-4 py-2 font-display text-sm font-black uppercase italic transition-[background-color,color,border-color,box-shadow] duration-200 ease-out";

const LIVE =
  "inline-flex items-center gap-2 border-[3px] border-on-accent bg-accent px-4 py-2 font-display text-xs font-black text-on-accent uppercase italic shadow-[4px_4px_0_var(--pop)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--pop)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_var(--pop)]";

/** A screenshot printed in Ben-Day dots until you point at the card. */
function Shot({ src }: { src: string }) {
  return (
    <div className="relative h-44 overflow-hidden border-[3px] border-line-strong">
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
        className="object-cover object-top contrast-110 saturate-150"
      />
      <div
        aria-hidden
        className="dots absolute inset-0 opacity-70 mix-blend-multiply transition-opacity duration-300 ease-out [--dot:rgb(0_0_0/0.55)] group-hover/card:opacity-0"
      />
    </div>
  );
}

function Card({ item, index, labels }: { item: GalleryItem; index: number; labels: GalleryLabels }) {
  return (
    <TiltCard>
      <div className="group/card relative flex h-full flex-col gap-4 border-[3px] border-line-strong p-4 transition-shadow duration-200 ease-out transform-3d *:transform-3d hover:shadow-[8px_8px_0_var(--pop)]">
        <TiltLayer depth={70}>
          <Shot src={item.img} />
        </TiltLayer>

        <p className="-mt-1 flex justify-between text-[10px] tracking-[0.16em] text-muted uppercase">
          <span>
            {labels.figure} {String(index + 1).padStart(2, "0")}
          </span>
          <span className="tabular-nums">{item.year}</span>
        </p>

        <TiltLayer as="h3" depth={45} className="font-display text-2xl leading-[0.95] font-black uppercase italic">
          {item.title}
        </TiltLayer>
        <TiltLayer as="p" depth={35} className="text-sm leading-relaxed text-muted">
          {item.desc}
        </TiltLayer>
        <TiltLayer depth={25}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t border-line pt-3 text-sm">
            <dt className="pt-0.5 text-[10px] tracking-[0.14em] text-muted uppercase">{labels.role}</dt>
            <dd>{item.role}</dd>
            <dt className="pt-0.5 text-[10px] tracking-[0.14em] text-muted uppercase">{labels.result}</dt>
            <dd>{item.result}</dd>
          </dl>
        </TiltLayer>
        <TiltLayer depth={20}>
          <p className="text-[11px] leading-relaxed text-muted">{item.stack.join(" · ")}</p>
        </TiltLayer>

        <div className="mt-auto">
          {item.link ? (
            <TiltLayer
              as="a"
              depth={20}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${labels.live}: ${item.title}`}
              className={LIVE}
            >
              {labels.live}
              <ArrowUpRight aria-hidden className="size-3.5 shrink-0" strokeWidth={3} />
            </TiltLayer>
          ) : (
            <TiltLayer depth={20} className="inline-flex items-center gap-2 text-[11px] tracking-[0.14em] text-muted uppercase">
              <Lock aria-hidden className="size-3.5 shrink-0" strokeWidth={2.5} />
              {labels.private}
            </TiltLayer>
          )}
        </div>
      </div>
    </TiltCard>
  );
}

/** The project gallery: a filter (the swarm draws a ring round the active
 * chip, following the chip's own corners) and comic panels for the cards.
 * Cards that stay shift into place when the filter changes; with reduced
 * motion they just appear. */
export function Gallery({ items, labels }: { items: GalleryItem[]; labels: GalleryLabels }) {
  const [filter, setFilter] = useState<Filter>("all");
  const reduceMotion = useReducedMotion();
  const shown = items.filter((item) => filter === "all" || item.kind === filter);
  const chips: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: labels.all, count: items.length },
    { key: "commercial", label: labels.commercial, count: items.filter((item) => item.kind === "commercial").length },
    { key: "personal", label: labels.personal, count: items.filter((item) => item.kind === "personal").length },
  ];

  return (
    // On a phone the sound effect gets a line of its own under the chips, so
    // the cards follow closer there.
    <div className="flex flex-col gap-8 sm:gap-12">
      <div
        data-swarm-filters
        role="group"
        aria-label={labels.filters}
        className="flex flex-wrap items-center gap-x-7 gap-y-3"
      >
        <div className="flex flex-wrap gap-3">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              data-swarm-filter={chip.key}
              aria-pressed={filter === chip.key}
              onClick={() => setFilter(chip.key)}
              className={cn(
                CHIP,
                filter === chip.key
                  ? "border-on-accent bg-accent text-on-accent shadow-[3px_3px_0_var(--pop)]"
                  : "border-line-strong hover:bg-raise"
              )}
            >
              {chip.label}
              <span className="ml-2 tabular-nums opacity-60">{chip.count}</span>
            </button>
          ))}
        </div>
        {/* What a filter click sounds like. */}
        <Sfx className="rotate-6">{labels.sfx}</Sfx>
      </div>

      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* No entrance animation for the first render: the cards are in the
            server HTML, visible without JavaScript. */}
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((item) => (
            <motion.li
              key={item.key}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="h-full"
            >
              <Card item={item} index={items.indexOf(item)} labels={labels} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
