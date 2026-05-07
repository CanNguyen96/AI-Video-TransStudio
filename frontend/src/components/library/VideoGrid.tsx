import { Video } from "@/types/video";
import VideoCard from "./VideoCard";

interface VideoGridProps {
  videos: Video[];
  loading: boolean;
  token: string | null;
  deletingId: string | null;
  onDelete: (id: string) => void;
  formatSize: (bytes: number) => string;
  formatDate: (dateStr: string) => string;
}

export default function VideoGrid({
  videos, loading, token, deletingId, onDelete, formatSize, formatDate,
}: VideoGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden animate-pulse"
            style={{ background: "var(--bg-card)", height: "220px" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video, i) => (
        <VideoCard
          key={video._id}
          video={video}
          index={i}
          token={token}
          deletingId={deletingId}
          onDelete={onDelete}
          formatSize={formatSize}
          formatDate={formatDate}
        />
      ))}
    </div>
  );
}
