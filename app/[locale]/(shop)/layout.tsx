import type { ReactNode } from "react";

import SiteChrome from "@/components/layout/SiteChrome";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <SiteChrome showCart={true}>{children}</SiteChrome>;
}
