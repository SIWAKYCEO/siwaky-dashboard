"use client";

import { Award, Facebook, Instagram, Mail } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import HalalCertDownload from "@/components/shared/HalalCertDownload";
import Logo from "@/components/shared/Logo";

export default function Footer() {
  const t = useTranslations();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  return (
    <footer className="mt-24 border-t border-white/5 bg-brand-dark2/80 pb-12 pt-16">
      <div className="container-luxury">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo size="lg" />
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
              {t("about.body")}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Mail className="size-4 text-brand-gold" />
              <a
                href="mailto:siwaky.assistance@gmail.com"
                className="text-sm text-white/80 hover:text-brand-goldLight"
              >
                siwaky.assistance@gmail.com
              </a>
            </div>

            {/* Halal cert badge */}
            <HalalCertDownload className="mt-6 inline-flex items-center gap-2.5 rounded-xl border border-brand-gold/40 bg-brand-gold/8 px-4 py-2.5 text-sm text-brand-goldLight transition-all duration-200 hover:border-brand-gold/70 hover:bg-brand-gold/15 hover:shadow-gold">
              <Award className="size-4 shrink-0 text-brand-gold" />
              <span>{t("footer.certificate")}</span>
            </HalalCertDownload>
          </div>

          <div className="md:col-span-2">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-goldLight">
              {t("footer.links")}
            </h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <Link href={`/${locale}`} className="hover:text-brand-goldLight">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/product`} className="hover:text-brand-goldLight">
                  {t("nav.product")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="hover:text-brand-goldLight">
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-brand-goldLight">
                  {t("nav.contact")}
                </Link>
              </li>
              <li>
                <HalalCertDownload className="hover:text-brand-goldLight">
                  {t("footer.certificate")}
                </HalalCertDownload>
              </li>
            </ul>
          </div>

          <nav className="md:col-span-2" aria-label={t("footer.legal")}>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-goldLight">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <Link href={`/${locale}/privacy-policy`} className="hover:text-brand-goldLight">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="hover:text-brand-goldLight">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/shipping`} className="hover:text-brand-goldLight">
                  {t("footer.shipping")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/returns`} className="hover:text-brand-goldLight">
                  {t("footer.returns")}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="md:col-span-3">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-goldLight">
              {t("footer.follow")}
            </h4>
            <div className="flex items-center gap-3">
              <a
                href="https://www.tiktok.com/@siwaky.com?_r=1&_t=ZN-96UQGARtPWw"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 hover:border-brand-gold/60 hover:text-brand-goldLight"
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M16.6 5.82A6.43 6.43 0 0 1 14.92 2H11.7v13.42a2.78 2.78 0 0 1-5.05 1.61 2.78 2.78 0 0 1 3.93-3.84V9.86a6 6 0 1 0 5.32 5.96V9.4a8.71 8.71 0 0 0 4.7 1.4V7.57a4.85 4.85 0 0 1-4-1.75Z"
                  />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/siwakyworld?igsh=MXRjMzJlajA2cjM5ag%3D%3D"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 hover:border-brand-gold/60 hover:text-brand-goldLight"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61578656887420"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 hover:border-brand-gold/60 hover:text-brand-goldLight"
              >
                <Facebook className="size-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs text-white/50 md:flex-row">
          <p>{t("footer.rights")}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 md:justify-end">
            <Link href={`/${locale}/privacy-policy`} className="hover:text-brand-goldLight">
              {t("footer.privacy")}
            </Link>
            <span className="opacity-40" aria-hidden>
              ·
            </span>
            <Link href={`/${locale}/terms`} className="hover:text-brand-goldLight">
              {t("footer.terms")}
            </Link>
            <span className="opacity-40" aria-hidden>
              ·
            </span>
            <Link href={`/${locale}/shipping`} className="hover:text-brand-goldLight">
              {t("footer.shipping")}
            </Link>
            <span className="opacity-40" aria-hidden>
              ·
            </span>
            <Link href={`/${locale}/returns`} className="hover:text-brand-goldLight">
              {t("footer.returns")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
