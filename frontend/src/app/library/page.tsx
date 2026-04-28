"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Video {
  _id: string;
  title: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: "uploaded" | "processing" | "completed" | "error";
  duration: number | null;
  createdAt: string;
}

const statusConfig = {
  uploaded: { label: "Đã upload", color: "#60a5fa", bg: "rgba(59,130,246,0.15)" },
  processing: { label: "Đang xử lý", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  completed: { label: "Hoàn thành", color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  error: { label: "Lỗi", color: "#f87171", bg: "rgba(248,113,113,0.15)" },
};

export default function LibraryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVideos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/videos`);
      const data = await res.json();
      if (data.success) setVideos(data.data);
      else setError(data.message || "Không thể tải danh sách video");
    } catch {
      setError("Không thể kết nối tới server. Hãy chắc chắn backend đang chạy.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa video này?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/videos/${id}`, { method: "DELETE" });
      if (res.ok) setVideos((prev) => prev.filter((v) => v._id !== id));
    } catch {
      alert("Xóa thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <main className="min-h-screen pt-16" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black mb-2">
              <span className="gradient-text">Thư viện</span>
              <span style={{ color: "var(--text-primary)" }}> Video</span>
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              {videos.length > 0 ? `${videos.length} video` : "Chưa có video nào"}
            </p>
          </div>
          <Link
            href="/upload"
            id="library-upload-btn"
            className="px-5 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", boxShadow: "0 0 20px rgba(139,92,246,0.3)" }}
          >
            + Upload mới
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "var(--bg-card)", height: "220px" }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-6 rounded-2xl text-center" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <p className="mb-4" style={{ color: "#fca5a5" }}>⚠️ {error}</p>
            <button onClick={fetchVideos} className="px-4 py-2 rounded-lg text-sm font-medium glass" style={{ color: "var(--text-secondary)" }}>
              Thử lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-6 animate-float">🎬</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Chưa có video nào
            </h3>
            <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
              Upload video đầu tiên của bạn để bắt đầu
            </p>
            <Link href="/upload" className="px-6 py-3 rounded-xl font-semibold text-white inline-block transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}>
              🚀 Upload ngay
            </Link>
          </div>
        )}

        {/* Video grid */}
        {!loading && !error && videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, i) => {
              const s = statusConfig[video.status];
              return (
                <div
                  key={video._id}
                  id={`video-card-${video._id}`}
                  className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] group animate-fade-in-up"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", animationDelay: `${i * 0.05}s`, boxShadow: "var(--shadow-card)" }}
                >
                  {/* Thumbnail placeholder */}
                  <div className="relative h-40 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.08))" }}>
                    <div className="text-5xl">🎬</div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: "rgba(0,0,0,0.5)" }}>
                      <Link href={`/watch/${video._id}`}
                        className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white transition-all hover:scale-110"
                        style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}>
                        ▶
                      </Link>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm line-clamp-1 flex-1" style={{ color: "var(--text-primary)" }}>
                        {video.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                        style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                      <span>{formatSize(video.fileSize)}</span>
                      <span>{formatDate(video.createdAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/watch/${video._id}`}
                        id={`btn-watch-${video._id}`}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold text-white text-center transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}>
                        ▶ Xem
                      </Link>
                      <button
                        id={`btn-delete-${video._id}`}
                        onClick={() => handleDelete(video._id)}
                        disabled={deletingId === video._id}
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-40"
                        style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>
                        {deletingId === video._id ? "..." : "🗑️"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
