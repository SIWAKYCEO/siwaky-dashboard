"use client";

export function PremiumSkeleton() {
  return (
    <div className="space-y-10 pb-28">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key -- skeleton slots
          <div key={`sk-met-${i}`} className="h-[158px] rounded-[1.25rem] bg-white/[0.04] p-px backdrop-blur-sm">
            <div className="h-full rounded-[calc(1.25rem-1px)] bg-gradient-to-br from-white/[0.04] to-transparent motion-safe:animate-pulse motion-reduce:animate-none">
              <div className="p-6">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="mt-5 h-8 w-[55%] rounded-lg bg-white/12" />
                <div className="mt-6 h-2.5 w-full rounded-full bg-white/8" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="relative h-[300px] overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.03] lg:col-span-7 motion-safe:animate-pulse md:h-[324px]">
          <span className="absolute inset-x-14 top-24 h-[1px] bg-gradient-to-r from-transparent via-[#c9a962]/25 to-transparent" />
          <span className="absolute bottom-20 left-[12%] right-[10%] h-px bg-white/[0.05]" />
        </div>
        <div className="grid gap-3 lg:col-span-5">
          {[0, 1].map((i) => (
            // eslint-disable-next-line react/no-array-index-key -- skeleton slots
            <div key={`sk-g-${i}`} className="h-[152px] rounded-2xl border border-white/[0.06] bg-white/[0.03] motion-safe:animate-pulse" />
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-[min(380px,60vh)] rounded-3xl border border-white/[0.06] bg-white/[0.03] motion-safe:animate-pulse" />
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key -- skeleton slots
            <div key={`sk-p-${i}`} className="h-[84px] rounded-2xl border border-white/[0.06] bg-white/[0.03] motion-safe:animate-pulse" />
          ))}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:gap-14">
        <div className="space-y-0">
          {Array.from({ length: 7 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key -- skeleton slots
            <div key={`sk-a-${i}`} className="mb-6 h-[96px] rounded-3xl border border-white/[0.06] bg-white/[0.03] motion-safe:animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key -- skeleton slots
            <div key={`sk-o-${i}`} className="h-[132px] rounded-2xl border border-white/[0.06] bg-white/[0.03] motion-safe:animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
