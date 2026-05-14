"use client";

import { useEffect } from "react";

import { track } from "@/lib/pixels";

/**
 * Fires `ViewContent` for the product page. Lives inside its own component so
 * the parent page can remain a Server Component.
 */
export default function ProductViewedTracker() {
  useEffect(() => {
    const id = setTimeout(() => {
      track("ViewContent", {
        content_type: "product",
        content_ids: ["siwaky-box"],
        value: 245,
        currency: "SAR",
      });
    }, 2500);
    return () => clearTimeout(id);
  }, []);
  return null;
}
