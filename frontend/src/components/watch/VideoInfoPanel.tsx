import { Video } from "@/types/video";
import { statusConfig } from "@/components/ui/StatusBadge";

interface VideoInfoPanelProps {
  video: Video;
  fmtMB: (b: number) => string;
  fmtDate: (d: string) => string;
}

export default function VideoInfoPanel({ video, fmtMB, fmtDate }: VideoInfoPanelProps) {
  const statusCfg = statusConfig[video.status as keyof typeof statusConfig];
  const statusColor = statusCfg?.color ?? "var(--text-muted)";

  const hasSubtitles =
    video.status === "completed" && video.subtitles && video.subtitles.length > 0;

  return (
    <div className="md:col-span-2">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        {video.title}
      </h1>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        {fmtDate(video.createdAt)} · {fmtMB(video.fileSize)} ·{" "}
        {video.mimeType.split("/")[1].toUpperCase()}
      </p>

      {/* Status badge */}
      <div className="flex items-center gap-2 text-sm">
        <span style={{ color: "var(--text-muted)" }}>Trạng thái phụ đề:</span>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: `${statusColor}20`,
            color: statusColor,
            border: `1px solid ${statusColor}40`,
          }}
        >
          {video.status === "completed"
            ? "✅ Hoàn thành"
            : video.status === "processing"
            ? "⚙️ Đang xử lý..."
            : video.status === "error"
            ? "❌ Lỗi"
            : "⬜ Chưa có phụ đề"}
        </span>
      </div>

      {/* Error message */}
      {video.status === "error" && video.errorMessage && (
        <div
          className="mt-3 p-3 rounded-lg text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
          }}
        >
          ❌ {video.errorMessage}
        </div>
      )}

      {/* Subtitle ready notice */}
      {hasSubtitles && (
        <p className="mt-4 text-sm font-medium" style={{ color: "#86efac" }}>
          🎉 Phụ đề đã sẵn sàng — xem bảng tải xuống bên dưới
        </p>
      )}
    </div>
  );
}
