import type { LucideIcon } from "lucide-react";
import { Globe2, LayoutDashboard, MapPin, Package, RadioTower } from "lucide-react";

export type DashboardNavEntry = {
  id: string;
  label: string;
  subtitle: string;
  Icon: LucideIcon;
};

export const dashboardNavEntries: DashboardNavEntry[] = [
  {
    id: "pulse",
    label: "Orders dashboard",
    subtitle: "Overview & KPIs",
    Icon: LayoutDashboard,
  },
  {
    id: "live-view",
    label: "Live Gulf map",
    subtitle: "Orders in real time",
    Icon: Globe2,
  },
  {
    id: "regions",
    label: "Orders by city",
    subtitle: "Regional mix",
    Icon: MapPin,
  },
  {
    id: "catalog",
    label: "Products",
    subtitle: "Best sellers",
    Icon: Package,
  },
  {
    id: "live",
    label: "Activity & orders",
    subtitle: "Timeline + list",
    Icon: RadioTower,
  },
];

export function scrollToDashboardSection(sectionId: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(sectionId);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
