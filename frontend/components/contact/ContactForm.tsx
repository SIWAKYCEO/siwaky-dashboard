"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email().or(z.literal("")),
  phone: z.string().min(6).or(z.literal("")),
  message: z.string().min(10),
});

type Values = z.infer<typeof schema>;

export default function ContactForm() {
  const t = useTranslations("contact");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    // Contact form is a "best-effort" mailto fallback for v1.
    const subject = encodeURIComponent(t("mailtoSubject", { name: values.name }));
    const body = encodeURIComponent(
      t("mailtoBody", {
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message,
      }),
    );
    window.location.href = `mailto:siwaky.assistance@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-white/5 bg-brand-dark2/60 p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/85">{t("name")}</span>
          <input type="text" className="input-luxury" {...register("name")} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/85">{t("email")}</span>
          <input type="email" className="input-luxury" {...register("email")} />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm text-white/85">{t("phone")}</span>
          <input type="tel" className="input-luxury" {...register("phone")} />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm text-white/85">{t("message")}</span>
          <textarea rows={5} className="input-luxury" {...register("message")} />
        </label>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary mt-5 w-full md:w-auto">
        {t("submit")}
      </button>

      {sent && (
        <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {t("success")}
        </p>
      )}
    </form>
  );
}
