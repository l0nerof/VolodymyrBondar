import { cn } from "@/lib/utils";

/** The narrator's yellow box. */
export function Caption({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-block w-fit border-2 border-on-accent bg-accent px-2.5 py-1 font-sans text-[12px] font-bold uppercase tracking-[0.06em] text-on-accent",
        className
      )}
    >
      {children}
    </p>
  );
}
