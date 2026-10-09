import { Caption } from "./Caption";

/** A chapter caption over cover lettering: a hard offset shadow, and the
 * highlighted part in yellow. The yellow gets a black outline only by day
 * (--title-stroke), where yellow on cream needs one. */
export function SectionHead({
  chapter,
  title,
  highlight,
  as: Heading = "h2",
}: {
  chapter: string;
  title: string;
  highlight?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-12 sm:mb-14">
      <Caption className="-rotate-1">{chapter}</Caption>
      <Heading className="mt-5 max-w-5xl font-display text-[clamp(2.4rem,6.4vw,5.4rem)] leading-[0.92] font-black tracking-[0.005em] text-balance uppercase italic [text-shadow:0.06em_0.06em_0_var(--title-shadow)]">
        {title}
        {highlight && (
          <span className="text-accent [paint-order:stroke_fill] [-webkit-text-stroke:var(--title-stroke)]">
            {highlight}
          </span>
        )}
      </Heading>
    </div>
  );
}
