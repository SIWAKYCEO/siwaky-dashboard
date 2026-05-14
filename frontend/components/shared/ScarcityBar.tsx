"use client";

import { useEffect, useState } from "react";

interface Props {
  initial?: number;
  label?: (n: number) => string;
  /** Decrement every `everyMs` while mounted to suggest live demand. */
  everyMs?: number;
  /** Never go below this number. */
  floor?: number;
}

export default function ScarcityBar({
  initial = 12,
  label = (n: number) => `🔴 ${n}`,
  everyMs = 18_000,
  floor = 3,
}: Props) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => (c > floor ? c - 1 : c));
    }, everyMs);
    return () => clearInterval(id);
  }, [everyMs, floor]);

  return <span className="scarcity-pill">{label(count)}</span>;
}
