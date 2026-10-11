import { cn } from "@/lib/utils";

/** A sound effect lettered in Kablammo. Decorative, so hidden from screen
 * readers. */
export function Sfx({
  children,
  className,
  tone = "red",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "red" | "yellow";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block font-sfx text-4xl select-none [paint-order:stroke_fill] [-webkit-text-stroke:6px_var(--on-accent)]",
        tone === "red" ? "text-accent-2" : "text-accent",
        className
      )}
    >
      {children}
    </span>
  );
}
