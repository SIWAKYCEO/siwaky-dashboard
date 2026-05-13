"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import Logo from "@/components/shared/Logo";
import { useCartStore } from "@/store/cartStore";

const NAV = [
  { href: "",         key: "home" },
  { href: "/product", key: "product" },
  { href: "/about",   key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export default function Header() {
  const t = useTranslations("nav");
  const params = useParams<{ locale: string }>();
  const pathname = usePathname();
  const locale = params?.locale ?? "ar";
  const openCart = useCartStore((s) => s.open);
  const totalQty = useCartStore((s) => s.totalQty());
  const thankYouRoute = pathname?.includes("/thank-you");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* close drawers on navigation */
  useEffect(() => {
    setMobileOpen(false);
    if (pathname?.includes("/thank-you")) {
      useCartStore.getState().clearCart();
      useCartStore.getState().closeCheckout();
    }
  }, [pathname]);

  /* lock body scroll while drawer is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);


  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled ? "glass-dark" : "bg-transparent"
        }`}
      >
        <div className="container-luxury flex h-16 items-center justify-between md:h-20">
          <Link href={`/${locale}`} aria-label="SIWAKY home" className="shrink-0">
            <Logo size="lg" />
          </Link>

          {/* desktop nav */}
          <nav className="hidden gap-8 md:flex">
            {NAV.map((item) => {
              const href = `/${locale}${item.href}`;
              const active =
                pathname === href || (item.href === "" && pathname === `/${locale}`);
              return (
                <Link
                  key={item.key}
                  href={href}
                  className={`relative text-base transition-colors ${
                    active ? "text-brand-goldLight" : "text-white/80 hover:text-white"
                  }`}
                >
                  {t(item.key)}
                  {active && (
                    <span className="absolute -bottom-1.5 start-0 end-0 mx-auto block h-px w-8 bg-brand-gold" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* desktop flag switcher */}
          <div className="hidden md:flex items-center gap-1.5">
            {[
              { loc: "ar", flag: "🇸🇦" },
              { loc: "en", flag: "🇬🇧" },
            ].map(({ loc, flag }) => {
              const isActive = locale === loc;
              const href = pathname?.replace(`/${locale}`, `/${loc}`) || `/${loc}`;
              return (
                <Link
                  key={loc}
                  href={href}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-lg transition-all duration-200 ${
                    isActive
                      ? "ring-2 ring-brand-gold ring-offset-1 ring-offset-brand-dark scale-110"
                      : "opacity-50 hover:opacity-90 hover:scale-105"
                  }`}
                  aria-label={loc === "ar" ? "العربية" : "English"}
                >
                  {flag}
                </Link>
              );
            })}
          </div>

            <button
              type="button"
              onClick={() => {
                if (!thankYouRoute) openCart();
              }}
              disabled={thankYouRoute}
              aria-disabled={thankYouRoute}
              aria-label={t("cart")}
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border text-white/90 transition-colors ${
                thankYouRoute
                  ? "cursor-not-allowed border-white/[0.06] opacity-35"
                  : "border-white/10 hover:border-brand-gold/60 hover:text-brand-goldLight"
              }`}
            >
              <ShoppingBag className="size-5" />
              {totalQty > 0 && (
                <span className="absolute -top-1 -end-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1 text-[11px] font-bold text-brand-dark">
                  {totalQty}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-label={t("menu")}
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/90 transition-colors hover:border-brand-gold/60 hover:text-brand-goldLight md:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <X className="size-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Menu className="size-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer portal ─────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
              aria-hidden
            />

            {/* drawer panel — slides from the left */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#0a0a0a] shadow-2xl md:hidden"
              style={{ borderRight: "1px solid rgba(212,175,55,0.15)" }}
            >
              {/* drawer header */}
              <div className="flex h-16 items-center justify-between px-6 border-b border-white/5">
                <Logo size="sm" />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 hover:border-brand-gold/50 hover:text-brand-goldLight transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* gold divider */}
              <div className="h-px bg-gradient-to-r from-brand-gold/40 via-brand-goldLight/20 to-transparent" />

              {/* nav links */}
              <nav className="flex flex-col gap-1 px-4 py-6">
                {NAV.map((item, i) => {
                  const href = `/${locale}${item.href}`;
                  const active =
                    pathname === href || (item.href === "" && pathname === `/${locale}`);
                  return (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + i * 0.06, duration: 0.3 }}
                    >
                      <Link
                        href={href}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-all ${
                          active
                            ? "bg-brand-gold/10 text-brand-goldLight"
                            : "text-white/75 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {active && (
                          <span className="inline-block h-4 w-0.5 rounded-full bg-brand-gold" />
                        )}
                        {t(item.key)}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* spacer */}
              <div className="flex-1" />

              {/* language switcher at bottom */}
              <div className="px-4 pb-8 pt-4 border-t border-white/5">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center justify-center gap-3"
                >
                  {[
                    { loc: "ar", flag: "🇸🇦", label: "العربية" },
                    { loc: "en", flag: "🇬🇧", label: "English" },
                  ].map(({ loc, flag, label }) => {
                    const isActive = locale === loc;
                    const href = pathname?.replace(`/${locale}`, `/${loc}`) || `/${loc}`;
                    return (
                      <Link
                        key={loc}
                        href={href}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 ${
                          isActive
                            ? "bg-brand-gold/10 ring-1 ring-brand-gold/50 text-brand-goldLight"
                            : "text-white/50 hover:text-white/80 hover:bg-white/5"
                        }`}
                      >
                        <span className="text-xl">{flag}</span>
                        <span className="text-xs tracking-wide">{label}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
