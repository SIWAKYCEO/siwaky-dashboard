"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Star, Trash2, CheckCircle2, XCircle, X, RefreshCw } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ReviewStatus = "pending" | "approved" | "rejected";

interface Review {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  image_url: string | null;
  approved: boolean;
  status?: ReviewStatus;
  created_at: string;
}

type FilterKey = "all" | ReviewStatus;

// ── Helpers ───────────────────────────────────────────────────────────────────

const FRONTEND_STORE = process.env.NEXT_PUBLIC_FRONTEND_STORE_URL?.trim() || "https://siwaky.com";

function getStatus(r: Review): ReviewStatus {
  if (r.status === "rejected") return "rejected";
  if (r.status === "approved" || r.approved) return "approved";
  return "pending";
}

function buildImageUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${FRONTEND_STORE}${url}`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-[14px] ${n <= rating ? "fill-[#c9a84c] text-[#c9a84c]" : "fill-transparent text-white/20"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function PhotoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="size-5" />
      </button>
      <img
        src={url}
        alt="Review photo"
        className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = ((name || "?")[0]).toUpperCase();
  return (
    <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#1e1e22] text-xl font-bold text-white/35">
      {initial}
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",      label: "الكل" },
  { key: "pending",  label: "بانتظار الموافقة" },
  { key: "approved", label: "معتمد" },
  { key: "rejected", label: "مرفوض" },
];

function FilterBar({
  active, counts, onChange,
}: { active: FilterKey; counts: Record<FilterKey, number>; onChange: (k: FilterKey) => void }) {
  return (
    <div className="flex flex-wrap gap-2" dir="rtl">
      {FILTERS.map(({ key, label }) => {
        const isActive = active === key;
        const count    = counts[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-dashSans text-[12px] font-semibold transition-all ${
              isActive
                ? "border-[#c9a84c]/60 bg-[#c9a84c]/12 text-[#c9a84c]"
                : "border-white/[0.09] bg-black/25 text-white/55 hover:border-white/20 hover:text-white/80"
            }`}
          >
            {label}
            {count > 0 && (
              <span
                className={`min-w-[18px] rounded-full px-1.5 py-0 text-center text-[10px] font-bold leading-5 ${
                  isActive ? "bg-[#c9a84c] text-black" : "bg-white/10 text-white/70"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  onApprove,
  onReject,
  onDelete,
  busy,
}: {
  review: Review;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [photoModal, setPhotoModal] = useState<string | null>(null);
  const imgSrc = buildImageUrl(review.image_url);
  const status = getStatus(review);

  const statusBadge = {
    pending:  { label: "بانتظار الموافقة", cls: "text-amber-300 bg-amber-500/10 border-amber-400/20" },
    approved: { label: "معتمد",            cls: "text-emerald-300 bg-emerald-500/10 border-emerald-400/20" },
    rejected: { label: "مرفوض",           cls: "text-rose-300 bg-rose-500/10 border-rose-400/20" },
  }[status];

  return (
    <>
      {photoModal && <PhotoModal url={photoModal} onClose={() => setPhotoModal(null)} />}

      <div
        className="relative rounded-2xl border border-white/[0.07] bg-[#1c1c1e] p-4 transition-opacity"
        style={{ opacity: busy ? 0.5 : 1 }}
        dir="rtl"
      >
        {/* Status badge */}
        <span className={`absolute left-4 top-4 rounded-full border px-2.5 py-1 font-dashSans text-[10px] font-bold uppercase tracking-[0.18em] ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>

        <div className="mt-6 flex gap-4">
          {/* Photo / avatar */}
          {imgSrc ? (
            <button
              type="button"
              onClick={() => setPhotoModal(imgSrc)}
              className="shrink-0 overflow-hidden rounded-xl border border-white/[0.08] transition-opacity hover:opacity-80"
              title="عرض الصورة الكاملة"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc} alt={review.name} className="size-20 object-cover" />
            </button>
          ) : (
            <Avatar name={review.name} />
          )}

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Header row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <StarRow rating={review.rating} />
              <span className="font-dashSans text-[13px] font-semibold text-white/90">{review.name}</span>
              {review.city && (
                <span className="font-dashSans text-[12px] text-white/45">{review.city}</span>
              )}
              <span className="font-dashSans text-[11px] text-white/30">{fmtDate(review.created_at)}</span>
            </div>

            {/* Text */}
            <p className="mt-2 font-dashSans text-[13px] leading-relaxed text-white/72">
              {review.text}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={busy || status === "approved"}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 font-dashSans text-[12px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircle2 className="size-[15px]" strokeWidth={2} />
            اعتماد
          </button>

          <button
            type="button"
            onClick={onReject}
            disabled={busy || status === "rejected"}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 font-dashSans text-[12px] font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <XCircle className="size-[15px]" strokeWidth={2} />
            رفض
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2 font-dashSans text-[12px] font-semibold text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/75 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="size-[14px]" strokeWidth={2} />
            حذف
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ReviewsManager() {
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState<FilterKey>("pending");
  const [busyId, setBusyId]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/dashboard/reviews", { credentials: "include" });
      if (res.status === 401) { setError("غير مصرح — سجّل الدخول مجدداً"); return; }
      const data = (await res.json()) as Review[];
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setError("تعذّر تحميل التقييمات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo<Record<FilterKey, number>>(() => ({
    all:      reviews.length,
    pending:  reviews.filter((r) => getStatus(r) === "pending").length,
    approved: reviews.filter((r) => getStatus(r) === "approved").length,
    rejected: reviews.filter((r) => getStatus(r) === "rejected").length,
  }), [reviews]);

  const visible = useMemo(
    () => filter === "all" ? reviews : reviews.filter((r) => getStatus(r) === filter),
    [reviews, filter],
  );

  const patch = async (id: string, body: { approved: boolean; status: ReviewStatus }) => {
    setBusyId(id);
    try {
      await fetch(`/api/dashboard/reviews/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, ...body } : r));
    } finally {
      setBusyId(null);
    }
  };

  const del = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/dashboard/reviews/${id}`, { method: "DELETE", credentials: "include" });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-dashDisplay text-xl font-semibold text-white sm:text-2xl">
          إدارة التقييمات
        </h2>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-black/30 px-3.5 py-2 font-dashSans text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65 transition-colors hover:border-white/20 hover:text-white/85 disabled:opacity-40"
        >
          <RefreshCw className={`size-[14px] ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} />
          تحديث
        </button>
      </div>

      {/* Filter bar */}
      <FilterBar active={filter} counts={counts} onChange={setFilter} />

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-5 py-4 font-dashSans text-[13px] text-rose-200">
          {error}
        </p>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#1a1a1c] py-14 text-center">
          <span className="text-4xl">
            {filter === "pending" ? "✅" : "🌿"}
          </span>
          <p className="mt-4 font-dashSans text-[14px] text-white/50">
            {filter === "pending"
              ? "لا توجد تقييمات بانتظار الموافقة"
              : reviews.length === 0
                ? "لم يصل أي تقييم بعد 🌿"
                : `لا توجد تقييمات في هذا التصنيف`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              busy={busyId === r.id}
              onApprove={() => void patch(r.id, { approved: true,  status: "approved" })}
              onReject ={() => void patch(r.id, { approved: false, status: "rejected" })}
              onDelete ={() => void del(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
