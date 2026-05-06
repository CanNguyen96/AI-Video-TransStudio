import Link from "next/link";

interface LibraryHeaderProps {
  videoCount: number;
}

export default function LibraryHeader({ videoCount }: LibraryHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-10">
      <div>
        <h1 className="text-4xl font-black mb-2">
          <span className="gradient-text">Thư viện</span>
          <span style={{ color: "var(--text-primary)" }}> Video</span>
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          {videoCount > 0 ? `${videoCount} video` : "Chưa có video nào"}
        </p>
      </div>
      <Link
        href="/upload"
        id="library-upload-btn"
        className="px-5 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 hover:opacity-90"
        style={{
          background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
          boxShadow: "0 0 20px rgba(139,92,246,0.3)",
        }}
      >
        + Upload mới
      </Link>
    </div>
  );
}
