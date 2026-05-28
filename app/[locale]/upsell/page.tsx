"use client";

import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { checkoutOrderPostAbsoluteUrl } from "@/lib/checkout/order-post-url";

const PHONE_RE = /^(05|5)(5|0|3|6|4|9|1|8|7)[0-9]{7}$/;

type FromId = "box-1" | "box-2";

function sourceFromId(from: FromId): string {
  return from === "box-2" ? "upsell-box2" : "upsell-box1";
}

export default function UpsellPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const priceRaw = parseInt(searchParams.get("price") ?? "", 10);
  const price = Number.isFinite(priceRaw) && priceRaw > 0 ? priceRaw : 150;
  const fromRaw = searchParams.get("from");
  const from: FromId = fromRaw === "box-2" ? "box-2" : "box-1";
  const savedRaw = parseInt(searchParams.get("saved") ?? "", 10);
  const saved = Number.isFinite(savedRaw) && savedRaw > 0 ? savedRaw : 95;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const n = sessionStorage.getItem("sw_order_name") ?? "";
      const p = sessionStorage.getItem("sw_order_phone") ?? "";
      if (n) setName(n);
      if (p) setPhone(p);
    } catch {
      // sessionStorage blocked — fields stay empty
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 3) {
      setError("الرجاء إدخال اسمك الكامل");
      nameRef.current?.focus();
      return;
    }
    if (!PHONE_RE.test(trimmedPhone)) {
      setError("الرجاء إدخال رقم جوال سعودي صحيح");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: trimmedName,
      phone: trimmedPhone,
      offer: "box-1" as const,
      quantity: 1,
      price_sar: price,
      product: "SIWAKY Box x1 — Upsell",
      sku: "SIWAKY12",
      source: sourceFromId(from),
      campaign: "thankyou-page-upsell",
      city: "",
    };

    try {
      const postUrl = checkoutOrderPostAbsoluteUrl();
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const code = data?.error ?? data?.detail?.error ?? "server_error";
        if (code === "geo_blocked") setError("الطلب غير متاح في منطقتك");
        else if (code === "invalid_phone") setError("رقم الجوال غير صحيح");
        else if (code === "invalid_name") setError("الاسم غير صحيح");
        else setError("حدث خطأ، الرجاء المحاولة مجدداً");
        setSubmitting(false);
        return;
      }

      router.push(`/${locale}/thank-you`);
    } catch {
      setError("تعذّر الاتصال بالخادم، تحقق من الإنترنت وأعد المحاولة");
      setSubmitting(false);
    }
  };

  return (
    <section
      dir="rtl"
      lang="ar"
      className="flex min-h-screen flex-col items-center bg-[#28282A] px-4 pb-16 pt-8"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_85%_45%_at_50%_-10%,rgba(201,168,76,0.13),transparent_58%)]" aria-hidden />

      <div className="relative z-[2] w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/logo-siwaky.svg"
            alt="SIWAKY"
            width={120}
            height={44}
            priority
          />
        </div>

        {/* Product image */}
        <div className="flex justify-center">
          <div className="relative overflow-hidden rounded-2xl border border-brand-gold/25 shadow-[0_0_48px_-16px_rgba(201,168,76,0.35)]">
            <Image
              src="/images/product.jpg"
              alt="SIWAKY Box"
              width={320}
              height={320}
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="mt-7 text-center font-display text-2xl font-bold leading-snug text-white md:text-3xl">
          أضف علبة إضافية بسعر استثنائي
        </h1>

        {/* Pricing */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <span className="text-lg text-white/45 line-through">245 ر.س</span>
          <span className="font-display text-6xl font-bold text-brand-goldLight">
            {price} ر.س
          </span>
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-400/[0.1] px-4 py-1.5 text-sm font-semibold text-emerald-300">
            وفّرت {saved} ر.س 🎉
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/85">الاسم *</span>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك الكامل"
              autoComplete="name"
              className="input-luxury"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm text-white/85">رقم الجوال * (+966)</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              autoComplete="tel"
              className="input-luxury"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full justify-center text-base"
          >
            {submitting ? "جاري إرسال الطلب…" : `أكمل الطلب — ${price} ر.س`}
          </button>

          <p className="text-center text-xs text-white/40">
            الدفع عند الاستلام · علبة واحدة إضافية
          </p>
        </form>
      </div>
    </section>
  );
}
