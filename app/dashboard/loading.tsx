export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[100vh] flex-col items-center justify-center gap-4 px-6 text-center text-[15px]"
      style={{ backgroundColor: "#28282a", color: "#f4f4f5" }}
    >
      <div
        className="h-10 w-10 rounded-full border-2 border-transparent border-t-[#c9a962]"
        aria-hidden
        style={{ animation: "dash-spin 0.9s linear infinite" }}
      />
      <style>{`@keyframes dash-spin { to { transform: rotate(360deg); } }`}</style>
      <p className="text-white/80">Caricamento dashboard…</p>
      <p className="max-w-xs text-[13px] text-white/50">
        Se resta qui, JavaScript è disattivato o c’è un errore nella console del browser (F12).
      </p>
    </div>
  );
}
