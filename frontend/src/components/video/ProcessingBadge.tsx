export default function ProcessingBadge() {
  return (
    <div
      className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
      style={{
        background: "rgba(245,158,11,0.15)",
        border: "1px solid rgba(245,158,11,0.4)",
        color: "#f59e0b",
      }}
    >
      <div className="w-3 h-3 rounded-full border border-amber-400 border-t-transparent animate-spin" />
      AI đang xử lý...
    </div>
  );
}
