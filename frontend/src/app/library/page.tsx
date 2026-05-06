"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import LibraryHeader from "@/components/library/LibraryHeader";
import VideoGrid from "@/components/library/VideoGrid";
import EmptyState from "@/components/ui/EmptyState";
import { Video } from "@/types/video";
import { videoEndpoints } from "@/lib/api";

const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const formatDate  = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

export default function LibraryPage() {
  const [videos, setVideos]       = useState<Video[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVideos = async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(videoEndpoints.list());
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
      const res = await fetch(videoEndpoints.delete(id), { method: "DELETE" });
      if (res.ok) setVideos((prev) => prev.filter((v) => v._id !== id));
    } catch {
      alert("Xóa thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen pt-16" style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-12">

        <LibraryHeader videoCount={videos.length} />

        {/* Error state */}
        {error && !loading && (
          <div
            className="p-6 rounded-2xl text-center"
            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            <p className="mb-4" style={{ color: "#fca5a5" }}>⚠️ {error}</p>
            <button
              onClick={fetchVideos}
              className="px-4 py-2 rounded-lg text-sm font-medium glass"
              style={{ color: "var(--text-secondary)" }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && videos.length === 0 && (
          <EmptyState
            title="Chưa có video nào"
            description="Upload video đầu tiên của bạn để bắt đầu"
            ctaLabel="🚀 Upload ngay"
            ctaHref="/upload"
          />
        )}

        {/* Video grid */}
        {!error && (
          <VideoGrid
            videos={videos}
            loading={loading}
            deletingId={deletingId}
            onDelete={handleDelete}
            formatSize={formatSize}
            formatDate={formatDate}
          />
        )}
      </div>
    </main>
  );
}
