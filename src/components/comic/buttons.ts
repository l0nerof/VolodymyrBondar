// Comic buttons are pressed into the page: the hard shadow grows as a button
// lifts and shrinks as it is pushed onto it. Tailwind v4 moves elements with
// the `translate` property, not `transform`, so the transition has to name
// it; when it named only transform the button jumped while its shadow eased.
const POP =
  "inline-flex items-center gap-2 border-[3px] px-6 py-3 font-display text-sm font-black uppercase italic shadow-[5px_5px_0_var(--pop)] transition-[translate,box-shadow,background-color] duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--pop)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_var(--pop)]";

/** Class names for the two Comic buttons: yellow, and white like a bubble. */
export const popButton = {
  accent: `${POP} border-on-accent bg-accent text-on-accent`,
  bubble: `${POP} border-bubble-line bg-bubble text-bubble-ink`,
} as const;
