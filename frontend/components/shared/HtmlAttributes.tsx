"use client";

import { useEffect } from "react";

/**
 * Sets `<html lang="…" dir="…">` from the locale layout. Next.js App Router
 * keeps `<html>` in the root layout (locale-agnostic), so we update it on the
 * client once the locale layout mounts. This is fine for SEO crawlers that
 * render JS, and avoids the dual-html-element workaround.
 */
export default function HtmlAttributes({
  lang,
  dir,
}: {
  lang: string;
  dir: "rtl" | "ltr";
}) {
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = dir;
  }, [lang, dir]);
  return null;
}
