import { cn } from "@/lib/utils";

import { inkOn } from "./ink";

/** A speech bubble with its tail on the top edge. */
export function Bubble({
  children,
  className,
  tail = "left",
}: {
  children: React.ReactNode;
  className?: string;
  tail?: "left" | "right";
}) {
  return (
    <div
      className={cn("relative rounded-[28px] border-[3px] border-bubble-line bg-bubble px-6 py-5", className)}
      style={inkOn("var(--bubble-ink)", "var(--bubble)")}
    >
      {/* The tail's base overlaps the bubble's border, so they read as one line. */}
      <svg
        aria-hidden
        viewBox="0 0 34 24"
        className={cn("absolute -top-[21px] h-6 w-[34px]", tail === "left" ? "left-10" : "right-10")}
      >
        <path
          d="M3 24 L14 2 L31 24"
          className="fill-bubble stroke-bubble-line"
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </div>
  );
}
