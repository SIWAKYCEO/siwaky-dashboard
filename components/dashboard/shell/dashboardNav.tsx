import { BarChart2, Globe2, List, LayoutDashboard, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavEntry = {
  id: string;
  label: string;
  subtitle: string;
  Icon: LucideIcon;
  href?: string;
};

export const dashboardNavEntries: DashboardNavEntry[] = [
  { id: "pulse",     label: "Orders dashboard",  subtitle: "Overview & KPIs",      Icon: LayoutDashboard },
  { id: "live-view", label: "Live Globe",         subtitle: "Orders in real time",  Icon: Globe2 },
  { id: "live",      label: "Orders list",        subtitle: "All orders",           Icon: List },
  { id: "profit",    label: "Profit Calculator",  subtitle: "Earnings & ROI",       Icon: BarChart2 },
  { id: "reviews",   label: "Reviews",            subtitle: "Customer feedback",    Icon: Star, href: "/dashboard/reviews" },
];

export function scrollToDashboardSection(sectionId: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(sectionId);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
