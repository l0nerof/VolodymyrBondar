"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string };

/** The section links on narrow screens: a "Contents" button that opens a
 * panel. Escape or a click outside closes it; so does following a link. */
export function Contents({ label, links, className }: { label: string; links: NavLink[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="cursor-pointer border-2 border-line-strong px-1.5 py-1 font-display text-[11px] font-black uppercase italic transition-colors duration-150 not-aria-expanded:hover:bg-accent/30 aria-expanded:bg-accent aria-expanded:text-on-accent sm:px-2.5"
      >
        {label}
      </button>
      <nav
        id={panelId}
        aria-label={label}
        hidden={!open}
        className="absolute top-full right-0 mt-4 w-56 border-[3px] border-line-strong bg-paper shadow-[6px_6px_0_var(--pop)]"
      >
        <ul>
          {links.map((link) => (
            <li key={link.href} className="border-b-2 border-line last:border-b-0">
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-5 py-3 font-display text-lg font-black uppercase italic transition-colors duration-150 hover:bg-raise"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
