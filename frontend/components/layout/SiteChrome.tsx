import type { ReactNode } from "react";

import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import SocialProofTicker from "@/components/shared/SocialProofTicker";
import WhatsappFab from "@/components/shared/WhatsappFab";

/** “Live order” toast — reads like a dev indicator; hidden in production unless opted in. */
function showSocialProofTicker(): boolean {
  if (process.env.NEXT_PUBLIC_SHOW_SOCIAL_PROOF_TICKER === "true") return true;
  if (process.env.NEXT_PUBLIC_SHOW_SOCIAL_PROOF_TICKER === "false") return false;
  return process.env.NODE_ENV !== "production";
}

type Props = {
  children: ReactNode;
  /** Thank-you checkout completion: omit cart shell entirely (fixes stray empty-drawer SSR/hydrate). */
  showCart?: boolean;
};

export default function SiteChrome({ children, showCart = true }: Props) {
  const withCart = showCart !== false;
  return (
    <>
      <Header />
      <main className="relative z-20">{children}</main>
      <Footer />
      {withCart ? <CartDrawer /> : null}
      {showSocialProofTicker() ? <SocialProofTicker /> : null}
      <WhatsappFab />
    </>
  );
}
