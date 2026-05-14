"use client";

import { useLayoutEffect } from "react";

/**
 * Store root layout stays `lang="ar" dir="rtl"`. Flip before paint while on `/dashboard`
 * so flex/grid/charts don't inherit RTL quirks; restore on SPA exit.
 */
export function DashboardHtmlLock() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevDir = html.getAttribute("dir");
    const prevLang = html.getAttribute("lang");
    const prevOverflow = body.style.overflowX;

    html.setAttribute("dir", "ltr");
    html.setAttribute("lang", "en");
    body.style.overflowX = "hidden";

    return () => {
      if (prevDir == null) html.removeAttribute("dir");
      else html.setAttribute("dir", prevDir);
      if (prevLang == null) html.removeAttribute("lang");
      else html.setAttribute("lang", prevLang);
      body.style.overflowX = prevOverflow;
    };
  }, []);

  return null;
}
