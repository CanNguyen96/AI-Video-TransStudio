interface UploadSuccessProps {
  onWatch: () => void;
  onLibrary: () => void;
}

export default function UploadSuccess({ onWatch, onLibrary }: UploadSuccessProps) {
  return (
    <div
      className="p-5 rounded-xl mb-6 animate-scale-in"
      style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}
    >
      <p className="font-semibold mb-3" style={{ color: "#6ee7b7" }}>
        🎉 Upload thành công!
      </p>
      <div className="flex gap-3">
        <button
          onClick={onWatch}
          id="btn-watch-now"
          className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}
        >
          ▶ Xem ngay
        </button>
        <button
          onClick={onLibrary}
          id="btn-go-library"
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80 glass"
          style={{ color: "var(--text-secondary)" }}
        >
          📁 Thư viện
        </button>
      </div>
    </div>
  );
}
