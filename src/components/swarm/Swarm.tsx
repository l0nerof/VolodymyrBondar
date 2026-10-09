"use client";

// The only React part of the swarm: mount a fixed canvas behind the page and
// hand it to the engine. Everything else is plain DOM + WebGL, so a 60 fps
// loop never goes through React state.
import { useEffect, useRef } from "react";

import { startSwarm } from "./engine";

export function Swarm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startSwarm(canvas);
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 -z-1 size-full" />;
}
