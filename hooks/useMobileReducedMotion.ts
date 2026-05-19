"use client";
import { useEffect, useState } from "react";

/** Returns true on mobile (≤768px) or when prefers-reduced-motion is set. */
export function useMobileReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(
      "(max-width: 768px), (prefers-reduced-motion: reduce)",
    );
    setReduce(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}
