/**
 * Loading UI for `/dashboard` — shown while the route segment loads or suspends.
 * https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-6 text-center"
      style={{ backgroundColor: "#28282a", color: "#f4f4f5" }}
      dir="ltr"
    >
      <div
        className="h-11 w-11 animate-spin rounded-full border-2 border-white/15 border-t-[#c9a962]"
        aria-hidden
      />
      <p className="text-[15px] font-medium text-white/85">Loading dashboard…</p>
      <p className="max-w-xs text-[13px] text-white/45">
        If this never finishes, open the browser console (F12) and check for errors or failed network requests.
      </p>
    </div>
  );
}
