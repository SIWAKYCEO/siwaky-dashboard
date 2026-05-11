"use client";

import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import Logo from "@/components/shared/Logo";
import { useCartStore } from "@/store/cartStore";

const NAV = [
  { href: "", key: "home" },
  { href: "/product", key: "product" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export default function Header() {
  const t = useTranslations("nav");
  const params = useParams<{ locale: string }>();
  const pathname = usePathname();
  const locale = params?.locale ?? "ar";
  const openCart = useCartStore((s) => s.open);
  const totalQty = useCartStore((s) => s.totalQty());
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const otherLocale = locale === "ar" ? "en" : "ar";
  const switchHref = pathname?.replace(`/${locale}`, `/${otherLocale}`) || `/${otherLocale}`;

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled ? "glass-dark" : "bg-transparent"
      }`}
    >
      <div className="container-luxury flex h-16 items-center justify-between md:h-20">
        <Link href={`/${locale}`} aria-label="SIWAKY home" className="shrink-0">
          <Logo size="lg" />
        </Link>

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
          <Link
            href={switchHref}
            className="hidden md:inline-flex rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-widest text-white/70 hover:border-brand-gold/60 hover:text-brand-goldLight transition-colors"
          >
            {t("switchLang")}
          </Link>

          <button
            type="button"
            onClick={openCart}
            aria-label={t("cart")}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/90 transition-colors hover:border-brand-gold/60 hover:text-brand-goldLight"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/90 md:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass-dark border-t border-white/5">
          <div className="container-luxury flex flex-col py-4">
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                className="py-3 text-lg text-white/90 hover:text-brand-goldLight"
              >
                {t(item.key)}
              </Link>
            ))}
            <Link
              href={switchHref}
              className="py-3 text-sm uppercase tracking-widest text-white/60"
            >
              {t("switchLang")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
