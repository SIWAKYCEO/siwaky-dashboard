import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, MapPin, Package, RadioTower } from "lucide-react";

export type DashboardNavEntry = {
  id: string;
  label: string;
  subtitle: string;
  Icon: LucideIcon;
};

export const dashboardNavEntries: DashboardNavEntry[] = [
  {
    id: "pulse",
    label: "Command pulse",
    subtitle: "KPI mosaic",
    Icon: LayoutDashboard,
  },
  {
    id: "regions",
    label: "Geo demand",
    subtitle: "Urban mix",
    Icon: MapPin,
  },
  {
    id: "catalog",
    label: "Product OS",
    subtitle: "Line cards",
    Icon: Package,
  },
  {
    id: "live",
    label: "Live ledger",
    subtitle: "Activity + inbox",
    Icon: RadioTower,
  },
];

export function scrollToDashboardSection(sectionId: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(sectionId);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
