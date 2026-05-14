"use client";

import {
  type RefCallback,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Options = {
  onRefresh: () => Promise<void>;
  thresholdPx?: number;
  maxPullPx?: number;
};

export function usePullToRefresh({
  onRefresh,
  thresholdPx = 72,
  maxPullPx = 120,
}: Options): {
  bindScrollRef: RefCallback<HTMLDivElement>;
  pullPx: number;
  refreshing: boolean;
} {
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const [pullPx, setPullPx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  const refreshingRef = useRef(false);

  const startYRef = useRef(0);
  const armedRef = useRef(false);
  const draggingRef = useRef(false);
  const pullAmtRef = useRef(0);

  const bindScrollRef = useCallback<RefCallback<HTMLDivElement>>((node) => {
    setSurface(node);
  }, []);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    if (!surface) return;

    const onTouchStart = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      armedRef.current = surface.scrollTop <= 1;
      if (!armedRef.current) return;
      draggingRef.current = true;
      startYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current || !armedRef.current || !e.touches[0]) return;
      if (surface.scrollTop > 2) {
        draggingRef.current = false;
        armedRef.current = false;
        pullAmtRef.current = 0;
        setPullPx(0);
        return;
      }
      const y = e.touches[0].clientY;
      const dy = y - startYRef.current;
      if (dy > 0 && surface.scrollTop <= 1) {
        e.preventDefault();
        const rubber = Math.min(dy * 0.42, maxPullPx);
        pullAmtRef.current = rubber;
        setPullPx(rubber);
      } else if (dy <= 0) {
        pullAmtRef.current = 0;
        setPullPx(0);
      }
    };

    const onTouchEnd = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;

      const p = pullAmtRef.current;
      pullAmtRef.current = 0;
      armedRef.current = false;
      setPullPx(0);

      if (p < thresholdPx) return;

      void (async () => {
        if (refreshingRef.current) return;
        refreshingRef.current = true;
        setRefreshing(true);
        try {
          await refreshRef.current();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
        }
      })();
    };

    surface.addEventListener("touchstart", onTouchStart, { passive: true });
    surface.addEventListener("touchmove", onTouchMove, { passive: false });
    surface.addEventListener("touchend", onTouchEnd, { passive: true });
    surface.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      surface.removeEventListener("touchstart", onTouchStart);
      surface.removeEventListener("touchmove", onTouchMove);
      surface.removeEventListener("touchend", onTouchEnd);
      surface.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [surface, thresholdPx, maxPullPx]);

  return { bindScrollRef, pullPx, refreshing };
}
