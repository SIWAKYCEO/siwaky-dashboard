import { BarChart2, Globe2, LayoutDashboard, List, MapPin, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavEntry = {
  id: string;
  label: string;
  subtitle: string;
  Icon: LucideIcon;
};

export const dashboardNavEntries: DashboardNavEntry[] = [
  { id: "pulse",     label: "Orders dashboard",  subtitle: "Overview & KPIs",      Icon: LayoutDashboard },
  { id: "live-view", label: "Live Gulf map",      subtitle: "Orders in real time",  Icon: Globe2 },
  { id: "regions",   label: "Orders by city",     subtitle: "Regional mix",          Icon: MapPin },
  { id: "live",      label: "Orders list",        subtitle: "All orders",            Icon: List },
  { id: "profit",    label: "Profit Calculator",  subtitle: "Earnings & ROI",        Icon: BarChart2 },
  { id: "reviews",   label: "Reviews",            subtitle: "Customer feedback",     Icon: Star },
];

export function scrollToDashboardSection(sectionId: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(sectionId);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
