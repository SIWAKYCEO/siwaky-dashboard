"use client";

import { useEffect, useRef } from "react";

type Options<T> = {
  enabled: boolean;
  intervalMs: number;
  pollWhenHidden?: boolean;
  fetcher: () => Promise<T>;
  onSuccess: (data: T) => void;
};

/** Lightweight polling — visibility-aware by default (saves battery / tabs). */
export function useOrdersPolling<T>({
  enabled,
  intervalMs,
  pollWhenHidden = false,
  fetcher,
  onSuccess,
}: Options<T>): void {
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);

  fetcherRef.current = fetcher;
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    let cancelled = false;

    const tick = async () => {
      if (!pollWhenHidden && typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      try {
        const data = await fetcherRef.current();
        if (!cancelled) onSuccessRef.current(data);
      } catch {
        /* keep existing dashboard — polling must not blank UI */
      }
    };

    const id = window.setInterval(() => void tick(), intervalMs);

    const visHandler = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", visHandler);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", visHandler);
    };
  }, [enabled, intervalMs, pollWhenHidden]);
}
