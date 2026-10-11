type Hint = { key: string; does: string };

const KEY = "border-2 border-bubble-line bg-bubble px-1.5 py-0.5 font-sans text-[10px] font-bold text-bubble-ink not-italic";

function Row({ hints, className }: { hints: Hint[]; className: string }) {
  return (
    <span className={`flex-wrap justify-center gap-x-5 gap-y-2 ${className}`}>
      {hints.map((hint) => (
        // On the baseline: centring the key's box put its letters 1.3px
        // below the words beside it.
        <span key={hint.key} className="inline-flex items-baseline gap-2">
          <kbd className={KEY}>{hint.key}</kbd>
          {hint.does}
        </span>
      ))}
    </span>
  );
}

/** What the name in dots reacts to, one input per line: pointer devices see
 * cursor / click / type, touch screens see tap. While the visitor types, the
 * swarm sets data-typing and the line explains how to get the name back.
 * Hidden with reduced motion, where the swarm holds still. */
export function SwarmHints({ pointer, touch, typing }: { pointer: Hint[]; touch: Hint[]; typing: string }) {
  return (
    <p
      data-swarm-hint
      data-typing="false"
      className="group text-center text-[11px] tracking-[0.14em] text-muted uppercase motion-reduce:hidden"
    >
      <Row hints={pointer} className="flex group-data-[typing=true]:hidden [@media(pointer:coarse)]:hidden" />
      <Row hints={touch} className="hidden group-data-[typing=true]:hidden [@media(pointer:coarse)]:flex" />
      <span className="hidden group-data-[typing=true]:inline">{typing}</span>
    </p>
  );
}
