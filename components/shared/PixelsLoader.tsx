"use client";

import { useEffect } from "react";

import { deferPixels } from "@/lib/pixels";
import { getUtm } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

export default function PixelsLoader() {
  const setAttribution = useCartStore((s) => s.setAttribution);

  useEffect(() => {
    deferPixels();
    setAttribution(getUtm());
  }, [setAttribution]);

  return null;
}
