import type { ReactNode } from "react";

import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import PageTransition from "@/components/shared/PageTransition";
import ScrollProgress from "@/components/shared/ScrollProgress";
import SocialProofTicker from "@/components/shared/SocialProofTicker";
// SplashScreen is rendered in app/[locale]/layout.tsx
import WhatsappFab from "@/components/shared/WhatsappFab";

function showSocialProofTicker(): boolean {
  if (process.env.NEXT_PUBLIC_SHOW_SOCIAL_PROOF_TICKER === "true") return true;
  if (process.env.NEXT_PUBLIC_SHOW_SOCIAL_PROOF_TICKER === "false") return false;
  return process.env.NODE_ENV !== "production";
}

type Props = {
  children: ReactNode;
  showCart?: boolean;
};

export default function SiteChrome({ children, showCart = true }: Props) {
  const withCart = showCart !== false;
  return (
    <>
      <ScrollProgress />
      <Header />
      <main className="relative z-20">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      {withCart ? <CartDrawer /> : null}
      {showSocialProofTicker() ? <SocialProofTicker /> : null}
      <WhatsappFab />
    </>
  );
}
