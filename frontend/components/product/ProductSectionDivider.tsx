"use client";

import GoldOrnamentalDivider from "@/components/shared/GoldOrnamentalDivider";

/** Islamic-inspired geometric strip between luxury sections */
export default function ProductSectionDivider() {
  return (
    <div className="relative bg-[#28282A] py-4 md:py-5" aria-hidden>
      <svg
        className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-6 w-[min(100%,520px)] -translate-y-1/2 opacity-[0.22]"
        viewBox="0 0 520 24"
        fill="none"
      >
        <path
          stroke="#C9A84C"
          strokeWidth="0.75"
          d="M0 12h160 M360 12h160 M190 12l24-8 24 8 24-8 24 8 24-8 24 8"
        />
        <circle cx="260" cy="12" r="3" stroke="#C9A84C" strokeWidth="0.75" fill="none" />
      </svg>
      <GoldOrnamentalDivider className="relative py-1" />
    </div>
  );
}
