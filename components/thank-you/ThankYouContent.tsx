"use client";

import { motion } from "framer-motion";
import { BadgeCheck, RotateCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { type OfferId } from "@/lib/offers";
import { SITE_URL } from "@/lib/seo/site";
import { formatSAR } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

import GoldConfetti from "./GoldConfetti";
import GoldParticles from "./GoldParticles";
import PremiumCheckmark from "./PremiumCheckmark";

function parseOfferId(raw: string | null): OfferId | undefined {
  if (raw === "box-1" || raw === "box-2" || raw === "box-3") return raw;
  return undefined;
}

function parseQty(raw: string | null): number {
  const n = parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseTotal(raw: string | null): number {
  const n = Number.parseFloat(raw ?? "");
  return Number.isFinite(n) && n > 0 ? n : 0;
}


const TRUST_ICONS_LUX = [ShieldCheck, BadgeCheck, RotateCcw] as const;

interface NextStep {
  icon: string;
  text: string;
}

const STEP_ICONS = ["📞", "📦", "🚚"];

export default function ThankYouContent() {
  const t = useTranslations("thankYou");
  const tOffer = useTranslations("product.offers");
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale ?? "ar") as "ar" | "en";
  const searchParams = useSearchParams();

  useEffect(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().closeCart();
    useCartStore.getState().closeCheckout();
  }, []);

  const orderId = searchParams.get("order");
  const qty = parseQty(searchParams.get("qty"));
  const total = parseTotal(searchParams.get("total"));
  const offerId = parseOfferId(searchParams.get("offer"));
  const hasSummary = offerId !== undefined && qty > 0 && total > 0;

  const shareSiteUrl = SITE_URL.replace(/\/$/, "");

  const waHref = useMemo(() => {
    const text = t("whatsappPrefill");
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [t]);

  const [linkCopied, setLinkCopied] = useState(false);
  const [orderCopied, setOrderCopied] = useState(false);

  const copySiteLink = async () => {
    try {
      await navigator.clipboard.writeText(shareSiteUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2200);
    } catch {
      setLinkCopied(false);
    }
  };

  const copyOrderId = async () => {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(orderId);
      setOrderCopied(true);
      setTimeout(() => setOrderCopied(false), 2200);
    } catch {
      setOrderCopied(false);
    }
  };

  const trustRows = t.raw("trust.items") as { icon?: string; text: string }[];
  const nextSteps: NextStep[] = [
    { icon: STEP_ICONS[0], text: t("step1") },
    { icon: STEP_ICONS[1], text: t("step2") },
    { icon: STEP_ICONS[2], text: t("step3") },
  ];

  return (
    <section dir="rtl" lang="ar" className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#28282A] pb-24 pt-12 md:pb-28 md:pt-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_50%_at_50%_-8%,rgba(201,168,76,0.14),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(26,26,26,0.25)_0%,transparent_38%,transparent_72%,rgba(26,26,26,0.35)_100%)]"
        aria-hidden
      />

      <GoldParticles />
      <GoldConfetti />

      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="container-luxury relative z-[3] mx-auto max-w-2xl"
      >
        {/* ── Hero ───────────────────────────────────────── */}
        <div className="text-center">
          <PremiumCheckmark />

          <motion.h1
            className="mt-10 font-display text-[2rem] font-bold leading-[1.2] tracking-tight text-white md:text-[2.65rem]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55 }}
          >
            {t("title")}
          </motion.h1>

          <motion.p
            className="mx-auto mt-4 max-w-md font-sans text-lg leading-relaxed text-white/75 md:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.45 }}
          >
            {t("sub")}
          </motion.p>

          <motion.div
            className="mx-auto mt-10 flex max-w-xs items-center gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.72, duration: 0.45 }}
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-gold/65 to-transparent" />
            <span className="ornament whitespace-nowrap px-1 text-xs uppercase tracking-[0.4em] text-brand-goldLight">
              SIWAKY
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-brand-gold/65 to-transparent" />
          </motion.div>
        </div>

        {/* ── Order summary ───────────────────────────────── */}
        <motion.div
          className="mx-auto mt-14 max-w-lg"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.3)] bg-[#28282A] px-6 py-7 shadow-[0_24px_56px_-26px_rgba(201,168,76,0.18)] md:px-8 md:py-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_-20%,rgba(201,168,76,0.06),transparent_55%)]" aria-hidden />

            <p className="relative text-center text-xs font-semibold uppercase tracking-[0.38em] text-brand-goldLight">
              {t("orderSummary")}
            </p>

            {hasSummary ? (
              <dl className="relative mt-7 space-y-4 border-t border-white/[0.07] pt-6 font-sans">
                <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-sm text-white/50">{t("productLabel")}</dt>
                  <dd className="text-lg font-medium text-white">
                    SIWAKY — {tOffer(`${offerId}.title`)}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-sm text-white/50">{t("qtyLabel")}</dt>
                  <dd className="text-lg tabular-nums text-brand-goldLight">{qty}</dd>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-sm font-medium text-brand-gold/90">{t("priceLabel")}</dt>
                  <dd className="text-2xl font-semibold tabular-nums text-white md:text-3xl">
                    {formatSAR(total, locale)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="relative mt-6 text-center font-sans text-sm leading-relaxed text-white/62">
                {t("summaryFallback")}
              </p>
            )}

            {orderId && (
              <div className="relative mt-6 flex flex-col items-center gap-3 border-t border-white/[0.06] pt-6">
                <p className="font-sans text-xs uppercase tracking-[0.25em] text-white/45">{t("orderIdLabel")}</p>
                <p className="break-all text-sm font-medium tracking-normal text-brand-goldLight/95">{orderId}</p>
                <button
                  type="button"
                  onClick={copyOrderId}
                  className="rounded-full border border-brand-gold/45 bg-brand-gold/[0.08] px-5 py-2 font-sans text-sm text-brand-goldLight transition-colors hover:bg-brand-gold/15"
                >
                  {orderCopied ? (
                    <span className="text-emerald-400">{t("copied")}</span>
                  ) : (
                    t("copyId")
                  )}
                </button>
              </div>
            )}

            <div className="relative mt-6 space-y-3 border-t border-white/[0.06] pt-6 font-sans text-sm leading-relaxed text-white/78">
              <p>{t("delivery")}</p>
              <p className="text-brand-goldLight/95">{t("payment")}</p>
            </div>
          </div>
        </motion.div>

        {/* ── What happens next ───────────────────────────── */}
        <motion.div
          className="mx-auto mt-16 max-w-xl"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-center font-display text-2xl text-white md:text-3xl">{t("whatsNext")}</h2>

          <div className="relative mx-auto mt-10 max-w-md md:max-w-none">
            <ol className="grid gap-8 md:grid-cols-3 md:gap-5">
              {nextSteps.map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  className="relative flex gap-4 md:flex-col md:items-center md:text-center"
                >
                  <span className="flex size-[3.25rem] shrink-0 items-center justify-center rounded-full border-2 border-brand-gold bg-[#28282A] font-display text-xl font-bold text-brand-goldLight shadow-[0_0_22px_-8px_rgba(201,168,76,0.65)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 pt-1 md:pt-4">
                    <p className="font-sans text-[0.9375rem] leading-7 text-white/82 md:text-[0.96875rem]">
                      <span className="me-2 inline-block">{step.icon}</span>
                      {step.text}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </motion.div>

        {/* ── Trust ───────────────────────────────────────── */}
        <motion.div
          className="mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-x-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          role="list"
        >
          {trustRows.map((row, i) => {
            const Icon = TRUST_ICONS_LUX[i] ?? BadgeCheck;
            return (
              <motion.div
                key={i}
                role="listitem"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2.5"
              >
                <Icon className="size-[1.35rem] shrink-0 text-brand-gold" strokeWidth={1.65} aria-hidden />
                <span className="font-sans text-sm leading-snug text-white/85">{row.text}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Share ───────────────────────────────────────── */}
        <motion.div
          className="mx-auto mt-16 max-w-lg rounded-2xl border border-brand-gold/25 bg-[#28282A]/95 px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(201,168,76,0.08)] backdrop-blur-sm"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-2xl text-white md:text-[1.85rem]">{t("shareTitle")}</h2>
          <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-7 text-white/72 md:text-[0.9375rem]">
            {t("shareSub")}
          </p>
          <div className="mx-auto mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_40px_-16px_rgba(37,211,102,0.85)] transition-transform hover:scale-[1.02] hover:brightness-105 sm:flex-none sm:min-w-[11rem]"
            >
              <svg className="size-[1.15rem]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.372a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {t("whatsapp")}
            </a>
            <button
              type="button"
              onClick={copySiteLink}
              className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full border-2 border-brand-gold bg-brand-gold/[0.06] px-7 py-3.5 font-sans text-sm font-semibold text-brand-goldLight shadow-[inset_0_1px_0_rgba(240,223,160,0.12)] transition-colors hover:bg-brand-gold/15 sm:flex-none sm:min-w-[11rem]"
            >
              {linkCopied ? (
                <span className="text-emerald-400">{t("copied")}</span>
              ) : (
                t("copyLink")
              )}
            </button>
          </div>
        </motion.div>

        {/* ── Final CTA ───────────────────────────────────── */}
        <motion.div
          className="mx-auto mt-16 max-w-md rounded-2xl border border-brand-gold/20 bg-[#28282A] px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(201,168,76,0.06)]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="font-sans text-white/65">{t("moreTitle")}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/${locale}/product`}
              className="btn-primary inline-flex min-w-[13rem] justify-center"
            >
              {t("orderAgain")}
            </Link>
            <Link href={`/${locale}`} className="btn-ghost-gold inline-flex min-w-[13rem] justify-center">
              {t("backHome")}
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
