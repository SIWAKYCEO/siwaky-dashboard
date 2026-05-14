"use client";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export default function WhatsappFab() {
  if (!WHATSAPP_NUMBER) return null;
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp"
      className="fixed end-4 bottom-24 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg md:bottom-6 md:end-6"
    >
      <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
        <path
          fill="currentColor"
          d="M19.11 17.21c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.61.13-.18.26-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.13-1.15-.42-2.19-1.35-.81-.72-1.36-1.61-1.52-1.88-.16-.27-.02-.41.12-.54.12-.12.27-.32.4-.48.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.48-.07-.13-.61-1.46-.83-2-.22-.53-.45-.46-.61-.47l-.52-.01c-.18 0-.48.07-.74.34-.25.27-.97.95-.97 2.31s1 2.68 1.14 2.86c.13.18 1.96 3 4.76 4.21.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.6-.66 1.83-1.29.23-.63.23-1.17.16-1.29-.07-.11-.25-.18-.52-.31ZM16 4C9.37 4 4 9.37 4 16c0 2.12.55 4.11 1.52 5.83L4 28l6.31-1.5A11.9 11.9 0 0 0 16 28c6.63 0 12-5.37 12-12S22.63 4 16 4Zm0 22a9.94 9.94 0 0 1-5.06-1.39l-.36-.21-3.74.89.89-3.65-.24-.38A9.92 9.92 0 0 1 6 16c0-5.51 4.49-10 10-10s10 4.49 10 10-4.49 10-10 10Z"
        />
      </svg>
    </a>
  );
}
