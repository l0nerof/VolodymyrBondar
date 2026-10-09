import { cn } from "@/lib/utils";

import { inkOn } from "./ink";

/** A comic panel: a 3px frame the swarm shows through. A `solid` panel is
 * filled yellow with a hard shadow, and the swarm stays behind it. */
export function Panel({
  children,
  className,
  solid = false,
}: {
  children: React.ReactNode;
  className?: string;
  solid?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative border-[3px] p-6 sm:p-8",
        solid ? "border-on-accent bg-accent shadow-[6px_6px_0_var(--pop)]" : "border-line-strong",
        className
      )}
      style={solid ? inkOn("var(--on-accent)", "var(--accent)") : undefined}
    >
      {children}
    </div>
  );
}
