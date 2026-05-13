"use client";

import { useEffect } from "react";

/**
 * Verify production deploys in DevTools → Console.
 * `next.config.js` uses `compiler.removeConsole` in production — `console.warn` is kept (see exclude list).
 */
export default function ProductDeployProbe() {
  useEffect(() => {
    const build = process.env.NEXT_PUBLIC_APP_BUILD_ID ?? "local-dev";
    console.warn("[SIWAKY PDP] build:", build);
    document.documentElement.dataset.siwakyBuild = build;
  }, []);

  return null;
}
