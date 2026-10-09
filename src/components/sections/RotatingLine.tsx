"use client";

import { useEffect, useState } from "react";

import { useReducedMotion } from "@/lib/use-reduced-motion";

const EVERY_MS = 2800;

/** A line that cycles through what he builds: the current phrase slides out
 * upwards, then the next one rises in.
 *
 * Every phrase also sits invisibly in the same grid cell, so the box keeps
 * the size of the longest one and the line never re-centres or jumps; the
 * phrases wrap, because at 320px the longest English one was wider than the
 * box. Server and client render the same markup (the first phrase); the
 * rotation starts after hydration, and not at all with reduced motion. */
export function RotatingLine({ items }: { items: string[] }) {
  const [shown, setShown] = useState({ index: 0, previous: -1 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setShown(({ index }) => ({ index: (index + 1) % items.length, previous: index }));
    }, EVERY_MS);
    return () => window.clearInterval(id);
  }, [items.length, reduceMotion]);

  const cell = "col-start-1 row-start-1 text-balance";

  return (
    <span className="relative grid overflow-hidden">
      {items.map((item) => (
        <span key={item} aria-hidden className={`invisible ${cell}`}>
          {item}
        </span>
      ))}
      {shown.previous >= 0 && (
        <span key={`out-${shown.index}`} aria-hidden className={`animate-line-out ${cell}`}>
          {items[shown.previous]}
        </span>
      )}
      <span key={`in-${shown.index}`} className={`${shown.previous >= 0 ? "animate-line-in" : ""} ${cell}`}>
        {items[shown.index]}
      </span>
    </span>
  );
}
