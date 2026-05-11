"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { v4 as uuid } from "uuid";
import { z } from "zod";

import { createOrder } from "@/lib/api";
import { track } from "@/lib/pixels";
import { useCartStore } from "@/store/cartStore";

const PHONE_RE = /^(05|5)(5|0|3|6|4|9|1|8|7)[0-9]{7}$/;

function NameField({
  label,
  placeholder,
  error,
  registerProps,
  inputRef,
}: {
  label: string;
  placeholder: string;
  error?: string;
  registerProps: UseFormRegisterReturn;
  inputRef: (el: HTMLInputElement | null) => void;
}) {
  const { ref: rhfRef, ...rest } = registerProps;
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-white/85">{label} *</span>
      <input
        type="text"
        placeholder={placeholder}
        autoComplete="name"
        className="input-luxury"
        {...rest}
        ref={(el) => {
          rhfRef(el);
          inputRef(el);
        }}
      />
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </label>
  );
}

const schema = z.object({
  name: z.string().trim().min(3, "name"),
  phone: z.string().trim().regex(PHONE_RE, "phone"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutPopup({ open, onClose }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const source = useCartStore((s) => s.source);
  const campaign = useCartStore((s) => s.campaign);
  const clear = useCartStore((s) => s.clear);

  const [serverError, setServerError] = useState<string | null>(null);
  const initialFocus = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      setServerError(null);
      setTimeout(() => initialFocus.current?.focus(), 200);
    } else {
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const onSubmit = async (values: FormValues) => {
    if (items.length === 0) return;
    const cartItem = items[0];
    const eventId = uuid();

    const res = await createOrder({
      name: values.name,
      phone: values.phone,
      offer: cartItem.offerId,
      quantity: cartItem.quantity,
      price_sar: cartItem.price * cartItem.quantity,
      source,
      campaign,
      event_id: eventId,
    });

    if (!res.ok) {
      const code = res.code;
      if (code === "geo_blocked") setServerError(t("checkout.errors.geo"));
      else if (code === "invalid_phone") setServerError(t("checkout.errors.phone"));
      else if (code === "invalid_name") setServerError(t("checkout.errors.name"));
      else setServerError(t("checkout.errors.generic"));
      return;
    }

    track("Purchase", {
      event_id: res.data.event_id ?? eventId,
      value: res.data.price_sar,
      currency: "SAR",
      content_ids: [cartItem.offerId],
      contents: [{ id: cartItem.offerId, quantity: cartItem.quantity, item_price: cartItem.price }],
      content_type: "product",
    });

    clear();
    router.push(`/${locale}/thank-you?order=${encodeURIComponent(res.data.order_id)}`);
  };

  const current = items[0];

  return (
    <AnimatePresence>
      {open && current && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-[61] w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="relative overflow-hidden rounded-2xl border border-brand-gold/30 bg-brand-dark shadow-goldStrong">
              <header className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <h2 className="font-display text-xl text-white">{t("checkout.title")}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/5"
                  aria-label="إغلاق"
                >
                  <X className="size-5" />
                </button>
              </header>

              <div className="max-h-[80vh] overflow-y-auto px-5 py-5">
                <div className="rounded-xl border border-white/5 bg-brand-dark2/60 p-4 text-sm">
                  <p className="text-brand-goldLight">{t("checkout.summary")}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-white/85">
                      سواكي — {t(`product.offers.${current.offerId}.title`)}
                    </span>
                    <span className="font-serif text-base text-white">
                      {current.price * current.quantity} {t("common.currency")}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-white/60">
                    <span>🚚 {t("checkout.shipping")}</span>
                    <span className="text-emerald-300">{t("checkout.shippingFree")}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-white/85">{t("checkout.total")}</span>
                    <span className="font-serif text-lg text-brand-goldLight">
                      {total} {t("common.currency")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-emerald-300">{t("checkout.payment")}</p>
                </div>

                <p className="mt-4 text-sm text-white/70">{t("checkout.socialProof")}</p>
                <p className="mt-2 inline-flex">
                  <span className="scarcity-pill">{t("checkout.scarcity")}</span>
                </p>

                <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <NameField
                    label={t("checkout.name")}
                    placeholder={t("checkout.namePh")}
                    error={errors.name ? t("checkout.errors.name") : undefined}
                    registerProps={register("name")}
                    inputRef={(el) => {
                      initialFocus.current = el;
                    }}
                  />

                  <label className="block">
                    <span className="mb-1.5 block text-sm text-white/85">
                      {t("checkout.phone")} *  (+966)
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder={t("checkout.phonePh")}
                      autoComplete="tel"
                      className="input-luxury"
                      {...register("phone")}
                    />
                    <p className="mt-1 text-xs text-white/50">{t("checkout.phoneHint")}</p>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-300">{t("checkout.errors.phone")}</p>
                    )}
                  </label>

                  {serverError && (
                    <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      {serverError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full text-base"
                  >
                    {isSubmitting ? t("checkout.submitting") : t("checkout.submit")}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
