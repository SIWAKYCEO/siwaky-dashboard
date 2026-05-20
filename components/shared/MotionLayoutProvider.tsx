"use client";
import { LayoutGroup } from "framer-motion";
import type { ReactNode } from "react";

export default function MotionLayoutProvider({ children }: { children: ReactNode }) {
  return <LayoutGroup id="root-layout">{children}</LayoutGroup>;
}
