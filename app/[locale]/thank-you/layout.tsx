import type { ReactNode } from "react";

import SiteChrome from "@/components/layout/SiteChrome";

export default function ThankYouChromeLayout({ children }: { children: ReactNode }) {
  return <SiteChrome showCart={false}>{children}</SiteChrome>;
}
