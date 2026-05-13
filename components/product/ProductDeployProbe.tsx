"use client";

import { useEffect } from "react";

/** Verify production deploys in DevTools → Console. */
export default function ProductDeployProbe() {
  useEffect(() => {
    console.log("SIWAKY VERSION 2.0");
  }, []);

  return null;
}
