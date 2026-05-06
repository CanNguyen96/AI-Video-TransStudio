import Link from "next/link";
import { Video } from "@/types/video";
import StatusBadge from "@/components/ui/StatusBadge";
import { videoEndpoints } from "@/lib/api";

interface VideoCardProps {
  video: Video;
  index: number;
  deletingId: string | null;
  onDelete: (id: string) => void;
  formatSize: (bytes: number) => string;
  formatDate: (dateStr: string) => string;
}

export default function VideoCard({
  video, index, deletingId, onDelete, formatSize, formatDate,
}: VideoCardProps) {
  return (
    <div
      id={`video-card-${video._id}`}
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] group animate-fade-in-up"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        animationDelay: `${index * 0.05}s`,
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden bg-black">
        <img
          src={videoEndpoints.thumbnail(video._id)}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = "none";
            const fallback = el.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        {/* Fallback placeholder */}
        <div
          className="absolute inset-0 items-center justify-center"
          style={{
            display: "none",
            background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.1))",
          }}
        >
          <span className="text-5xl">🎬</span>
        </div>

        {/* Hover play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)" }}
        >
          <Link
            href={`/watch/${video._id}`}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white transition-all hover:scale-110 shadow-xl"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", boxShadow: "0 0 24px rgba(139,92,246,0.6)" }}
          >
            ▶
          </Link>
        </div>

        {/* Duration badge */}
        {video.duration && (
          <div
            className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs font-mono font-bold"
            style={{ background: "rgba(0,0,0,0.8)", color: "#fff" }}
          >
            {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, "0")}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm line-clamp-1 flex-1" style={{ color: "var(--text-primary)" }}>
            {video.title}
          </h3>
          <StatusBadge status={video.status} />
        </div>

        <div className="flex items-center justify-between text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          <span>{formatSize(video.fileSize)}</span>
          <span>{formatDate(video.createdAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/watch/${video._id}`}
            id={`btn-watch-${video._id}`}
            className="flex-1 py-2 rounded-lg text-xs font-semibold text-white text-center transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}
          >
            ▶ Xem
          </Link>
          <button
            id={`btn-delete-${video._id}`}
            onClick={() => onDelete(video._id)}
            disabled={deletingId === video._id}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}
          >
            {deletingId === video._id ? "..." : "🗑️"}
          </button>
        </div>
      </div>
    </div>
  );
}
