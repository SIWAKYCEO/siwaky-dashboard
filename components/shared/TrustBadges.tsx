"use client";

import { BadgeCheck, Leaf, RotateCcw, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

const ITEMS = [
  { key: "halal",    Icon: BadgeCheck },
  { key: "natural",  Icon: Leaf },
  { key: "shipping", Icon: Truck },
  { key: "refund",   Icon: RotateCcw },
] as const;

export default function TrustBadges({
  variant = "row",
  className = "",
}: {
  variant?: "row" | "grid";
  className?: string;
}) {
  const t = useTranslations("trust");

  const wrapper =
    variant === "row"
      ? "flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
      : "grid grid-cols-2 gap-3 sm:grid-cols-4";

  return (
    <ul className={`${wrapper} ${className}`}>
      {ITEMS.map(({ key, Icon }) => (
        <li
          key={key}
          className="flex items-center gap-2 text-sm text-white/80"
        >
          <Icon className="size-4 text-brand-gold" />
          <span>{t(key)}</span>
        </li>
      ))}
    </ul>
  );
}
