import { cn } from "@/lib/utils";

/** A panel with a yellow glint that travels round its edge, for the current
 * role. The glint rides a rounded path (CSS motion path, so no script and no
 * per-frame work) inside a 1px frame around the panel, which is all that
 * shows of it. The frame sits outside the panel (-m-px), so the panel lines
 * up with its plain neighbours to the pixel. Without motion-path support, or
 * with reduced motion, the panel is simply framed. */
export function MovingBorder({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="relative -m-px overflow-hidden p-px">
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 hidden size-20 bg-[radial-gradient(var(--accent)_40%,transparent_60%)] opacity-80 [offset-anchor:center] [offset-path:inset(0_round_30%)] [offset-rotate:0deg] motion-safe:animate-border-run motion-safe:supports-[offset-path:inset(0)]:block"
      />
      <div className={cn("relative border-[3px] border-line-strong bg-paper", className)}>{children}</div>
    </div>
  );
}
