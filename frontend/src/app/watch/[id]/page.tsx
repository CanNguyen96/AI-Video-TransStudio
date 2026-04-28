"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  status: string;
  duration: number | null;
  createdAt: string;
}

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetchVideo();
  }, [id]);

  const fetchVideo = async () => {
    try {
      const res = await fetch(`${API_URL}/videos/${id}`);
      const data = await res.json();
      if (data.success) setVideo(data.data);
      else setError(data.message || "Video không tồn tại");
    } catch {
      setError("Không thể kết nối tới server");
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (videoRef.current) { videoRef.current.currentTime = t; setCurrentTime(t); }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) { videoRef.current.volume = v; setIsMuted(v === 0); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const container = document.getElementById("video-container");
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimerRef.current);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });

  if (loading) {
    return (
      <main className="min-h-screen pt-16" style={{ background: "var(--bg-primary)" }}>
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p style={{ color: "var(--text-secondary)" }}>Đang tải...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !video) {
    return (
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
  }

  const streamUrl = `${API_URL}/videos/${id}/stream`;
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

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
        <div
          id="video-container"
          className="relative rounded-2xl overflow-hidden group mb-8"
          style={{ background: "#000", boxShadow: "0 0 60px rgba(0,0,0,0.8)", aspectRatio: "16/9" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          <video
            ref={videoRef}
            id="main-video-player"
            className="w-full h-full object-contain"
            src={streamUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => { setIsPlaying(false); setShowControls(true); }}
            onClick={togglePlay}
          />

          {/* Play overlay */}
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={togglePlay}
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl text-white transition-all hover:scale-110"
                style={{ background: "rgba(139,92,246,0.85)", boxShadow: "0 0 40px rgba(139,92,246,0.5)" }}>
                ▶
              </div>
            </div>
          )}

          {/* Custom Controls */}
          <div
            className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.85))", padding: "20px 16px 16px" }}
          >
            {/* Progress bar */}
            <div className="mb-3 group/progress">
              <input
                id="video-seekbar"
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 rounded-full cursor-pointer appearance-none"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
                  accentColor: "#8b5cf6",
                }}
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button id="btn-play-pause" onClick={togglePlay} className="text-white hover:text-purple-400 transition-colors text-xl w-8 h-8 flex items-center justify-center">
                  {isPlaying ? "⏸" : "▶"}
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button id="btn-mute" onClick={toggleMute} className="text-white hover:text-purple-400 transition-colors">
                    {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolume}
                    className="w-20 h-1 rounded-full cursor-pointer"
                    style={{ accentColor: "#8b5cf6" }}
                  />
                </div>

                {/* Time */}
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Fullscreen */}
                <button id="btn-fullscreen" onClick={toggleFullscreen} className="text-white hover:text-purple-400 transition-colors">
                  {isFullscreen ? "🗗" : "⛶"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              {video.title}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {formatDate(video.createdAt)} · {formatSize(video.fileSize)} · {video.mimeType.split("/")[1].toUpperCase()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              id="btn-create-subtitle"
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", boxShadow: "0 0 20px rgba(139,92,246,0.3)" }}
              onClick={() => alert("Tính năng AI tạo phụ đề sẽ có ở Giai đoạn 2! 🚀")}
            >
              🤖 Tạo phụ đề AI
            </button>
            <Link href="/library"
              id="btn-back-library"
              className="w-full py-3 rounded-xl font-semibold text-sm text-center transition-all hover:opacity-80 glass"
              style={{ color: "var(--text-secondary)" }}>
              ← Quay lại thư viện
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
