"use client";

import { createContext, useContext, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Large screens with a mouse or pen, and no wish for reduced motion. */
const CAN_TILT = "(hover: hover) and (pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)";

const Lifted = createContext(false);

/** A card that leans towards the pointer while its layers rise to different
 * depths (TiltLayer). Touch screens, small screens and reduced motion get a
 * flat card. The lean is set on the element directly, so moving the pointer
 * never re-renders the card. */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lifted, setLifted] = useState(false);

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || event.pointerType === "touch" || !window.matchMedia(CAN_TILT).matches) return;
    const box = el.getBoundingClientRect();
    const x = (event.clientX - box.left - box.width / 2) / 25;
    const y = (event.clientY - box.top - box.height / 2) / 25;
    el.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    if (!lifted) setLifted(true);
  }

  function onPointerLeave() {
    if (ref.current) ref.current.style.transform = "";
    setLifted(false);
  }

  return (
    <Lifted.Provider value={lifted}>
      <div className="h-full [perspective:1000px]">
        <div
          ref={ref}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className={cn("h-full transition-transform duration-200 ease-linear transform-3d", className)}
        >
          {children}
        </div>
      </div>
    </Lifted.Provider>
  );
}

/** A layer of a TiltCard that rises by `depth` px while the card leans. Its
 * transition also covers `translate` and the shadow, so a pop button inside
 * keeps its press without a transition of its own (one would replace this
 * and make the lean jump). */
export function TiltLayer({
  as: Tag = "div",
  depth,
  className,
  children,
  ...rest
}: {
  as?: "div" | "h3" | "p" | "a";
  depth: number;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLElement>, "className" | "children" | "style">) {
  const lifted = useContext(Lifted);
  return (
    <Tag
      className={cn("transition-[transform,translate,box-shadow] duration-200 ease-linear", className)}
      style={lifted ? { transform: `translateZ(${depth}px)` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
