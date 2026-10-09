import { cn } from "@/lib/utils";

/** A starburst outline, slightly uneven like a hand-drawn one. Fixed numbers,
 * so the server and the client draw the same shape. */
function burstShape(spikes = 13, inner = 0.72) {
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 ? inner : 0.9 + (((i * 37) % 7) / 6) * 0.1;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    points.push(`${(50 + Math.cos(a) * 50 * r).toFixed(1)}% ${(50 + Math.sin(a) * 50 * r).toFixed(1)}%`);
  }
  return `polygon(${points.join(",")})`;
}

const BURST = burstShape();

/** A sticker: yellow with black lettering, or red with white. `floating`
 * stickers are placed by the caller (absolute); the rest sit in the flow. */
export function Burst({
  children,
  className,
  tone = "yellow",
  floating = false,
  textClassName,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "yellow" | "red";
  floating?: boolean;
  /** Type for the lettering. It is set on the lettering box itself: a smaller
   * font on an inner span still got the box's 16px line height, and the lines
   * grew past the spikes. */
  textClassName?: string;
}) {
  return (
    <span className={cn(floating ? "absolute" : "relative", "inline-grid place-items-center", className)}>
      <span aria-hidden className="absolute inset-0 bg-on-accent" style={{ clipPath: BURST }} />
      <span
        aria-hidden
        className={cn("absolute inset-[4px]", tone === "yellow" ? "bg-accent" : "bg-accent-2")}
        style={{ clipPath: BURST }}
      />
      <span
        // The lettering has to stay inside the circle the spikes' inner
        // corners draw (72% of the size), so the lines are kept to ~62%.
        className={cn(
          "relative max-w-[62%] text-center leading-[1.05] text-balance",
          tone === "yellow" ? "text-on-accent" : "text-white",
          textClassName
        )}
      >
        {children}
      </span>
    </span>
  );
}
