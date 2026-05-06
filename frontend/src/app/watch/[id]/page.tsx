"use client";

import { useEffect, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoInfoPanel from "@/components/watch/VideoInfoPanel";
import SubtitleDownloads from "@/components/watch/SubtitleDownloads";
import AiPanel from "@/components/watch/AiPanel";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { useSubtitles } from "@/hooks/useSubtitles";
import { useVideoPolling } from "@/hooks/useVideoPolling";
import { Video } from "@/types/video";
import { videoEndpoints } from "@/lib/api";

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();

  const [video, setVideo]   = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  // ─── Hooks ──────────────────────────────────────────────────────────────────
  const player   = useVideoPlayer();
  const subtitles = useSubtitles(id, player.currentTime);

  const onCompleted = useCallback(() => {
    subtitles.loadSubtitleFile("bilingual");
    subtitles.setSubtitleMode("bilingual");
  }, [subtitles]);

  const polling = useVideoPolling(id, setVideo as (u: (v: Video | null) => Video | null) => void, onCompleted);

  // ─── Fetch video ─────────────────────────────────────────────────────────────
  const fetchVideo = useCallback(async () => {
    try {
      const res  = await fetch(videoEndpoints.detail(id));
      const data = await res.json();
      if (data.success) setVideo(data.data);
      else setError(data.message || "Video không tồn tại");
    } catch { setError("Không thể kết nối tới server"); }
    finally  { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchVideo(); }, [fetchVideo]);

  // Auto-load subtitle & polling khi status thay đổi
  useEffect(() => {
    if (video?.status === "completed" && video.subtitles?.length) {
      onCompleted();
    }
    if (video?.status === "processing") polling.startPolling();
    return () => polling.stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.status]);

  // ─── Computed ────────────────────────────────────────────────────────────────
  const isProcessing = polling.transcribing || video?.status === "processing";
  const hasSubtitles = video?.status === "completed" && !!video.subtitles?.length;

  // ─── Loading / Error states ──────────────────────────────────────────────────
  if (loading) return (
    <main className="min-h-screen pt-16" style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
          <p style={{ color: "var(--text-secondary)" }}>Đang tải...</p>
        </div>
      </div>
    </main>
  );

  if (error || !video) return (
    <main className="min-h-screen pt-16" style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="text-5xl">😕</div>
        <p style={{ color: "var(--text-secondary)" }}>{error || "Không tìm thấy video"}</p>
        <Link href="/library" className="px-4 py-2 rounded-lg text-sm glass" style={{ color: "var(--text-secondary)" }}>
          ← Quay lại thư viện
        </Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen pt-16" style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
          <Link href="/library" className="hover:text-purple-400 transition-colors">Thư viện</Link>
          <span>/</span>
          <span style={{ color: "var(--text-secondary)" }}>{video.title}</span>
        </div>

        {/* Video Player */}
        <VideoPlayer
          videoId={id}
          videoRef={player.videoRef}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          volume={player.volume}
          isMuted={player.isMuted}
          isFullscreen={player.isFullscreen}
          showControls={player.showControls}
          progressPct={player.progressPct}
          subtitleMode={subtitles.subtitleMode}
          activeSub={subtitles.activeSub}
          hasSubtitles={hasSubtitles}
          isProcessing={isProcessing}
          fmt={player.fmt}
          onTogglePlay={player.togglePlay}
          onSeek={player.handleSeek}
          onVolume={player.handleVolume}
          onToggleMute={player.toggleMute}
          onToggleFullscreen={player.toggleFullscreen}
          onMouseMove={player.handleMouseMove}
          onModeChange={subtitles.handleModeChange}
          setIsPlaying={player.setIsPlaying}
          setCurrentTime={player.setCurrentTime}
          setDuration={player.setDuration}
          setShowControls={player.setShowControls}
        />

        {/* Info + AI Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <VideoInfoPanel video={video} fmtMB={player.fmtMB} fmtDate={player.fmtDate} />
            {hasSubtitles && <SubtitleDownloads video={video} videoId={id} />}
          </div>

          <AiPanel
            targetLang={subtitles.targetLang}
            showLangPicker={subtitles.showLangPicker}
            isProcessing={isProcessing}
            hasSubtitles={hasSubtitles}
            languages={subtitles.LANGUAGES}
            setTargetLang={subtitles.setTargetLang}
            setShowLangPicker={subtitles.setShowLangPicker}
            onTranscribe={() => polling.handleTranscribe(subtitles.targetLang, isProcessing)}
          />
        </div>
      </div>
    </main>
  );
}
