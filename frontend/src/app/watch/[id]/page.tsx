"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Subtitle { language: string; srtPath: string; label?: string; }
interface Segment  { start: number; end: number; original: string; translated: string; }
interface Video {
  _id: string; title: string; originalName: string; fileName: string;
  fileSize: number; mimeType: string; status: string; duration: number | null;
  createdAt: string; subtitles: Subtitle[]; segments: Segment[];
  errorMessage?: string;
}

type SubtitleMode = "off" | "translated" | "bilingual";

// Parse SRT text → [{start,end,text}]
function parseSrt(srt: string): { start: number; end: number; text: string }[] {
  const blocks = srt.trim().split(/\n\s*\n/);
  return blocks.flatMap((block) => {
    const lines = block.trim().split("\n");
    if (lines.length < 3) return [];
    const timeLine = lines[1];
    const match = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    );
    if (!match) return [];
    const toSec = (h: string, m: string, s: string, ms: string) =>
      +h * 3600 + +m * 60 + +s + +ms / 1000;
    return [{
      start: toSec(match[1], match[2], match[3], match[4]),
      end:   toSec(match[5], match[6], match[7], match[8]),
      text:  lines.slice(2).join("\n"),
    }];
  });
}

export default function WatchPage() {
  const params = useParams();
  const id = params.id as string;
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video state
  const [video, setVideo]           = useState<Video | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  // Player state
  const [isPlaying, setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]     = useState(0);
  const [volume, setVolume]         = useState(1);
  const [isMuted, setIsMuted]       = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // AI Subtitle state
  const [transcribing, setTranscribing]   = useState(false);
  const [subtitleMode, setSubtitleMode]   = useState<SubtitleMode>("off");
  const [parsedSubs, setParsedSubs]       = useState<{ start: number; end: number; text: string }[]>([]);
  const [activeSub, setActiveSub]         = useState<string>("");
  const [targetLang, setTargetLang]       = useState("Vietnamese");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const [burnDownloading, setBurnDownloading] = useState<Record<string, "idle" | "rendering" | "done" | "error">>({});

  const LANGUAGES = ["Vietnamese", "English", "Japanese", "Korean", "Chinese", "French", "Spanish"];

  // ─── Fetch video ────────────────────────────────────────────────────────────
  const fetchVideo = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/videos/${id}`);
      const data = await res.json();
      if (data.success) setVideo(data.data);
      else setError(data.message || "Video không tồn tại");
    } catch { setError("Không thể kết nối tới server"); }
    finally  { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchVideo(); }, [fetchVideo]);

  // ─── Auto-load subtitles nếu video đã có sẵn (completed) ──────────────────
  useEffect(() => {
    if (video?.status === "completed" && video.subtitles?.length) {
      loadSubtitleFile("bilingual");
      setSubtitleMode("bilingual");
    }
    if (video?.status === "processing") {
      startPolling();
    }
    return () => clearInterval(pollingRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.status]);

  // ─── Polling khi backend đang xử lý ─────────────────────────────────────
  const startPolling = () => {
    clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API_URL}/videos/${id}`);
        const data = await res.json();
        if (data.success) {
          const v: Video = data.data;
          setVideo(v);
          if (v.status === "completed" || v.status === "error") {
            clearInterval(pollingRef.current);
            setTranscribing(false);
            if (v.status === "completed") {
              loadSubtitleFile("bilingual");
              setSubtitleMode("bilingual");
            }
          }
        }
      } catch { /* ignore */ }
    }, 3000);
  };

  // ─── Fullscreen change listener ────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ─── Load SRT file từ backend ────────────────────────────────────────────
  const loadSubtitleFile = async (lang: string) => {
    try {
      const res = await fetch(`${API_URL}/videos/${id}/subtitles/${lang}`);
      if (!res.ok) return;
      const text = await res.text();
      setParsedSubs(parseSrt(text));
    } catch { /* ignore */ }
  };

  // ─── Trigger AI transcription ─────────────────────────────────────────────
  const handleTranscribe = async () => {
    if (transcribing || video?.status === "processing") return;
    setTranscribing(true);
    try {
      await fetch(`${API_URL}/videos/${id}/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: targetLang }),
      });
      setVideo((v) => v ? { ...v, status: "processing" } : v);
      startPolling();
    } catch {
      setTranscribing(false);
      alert("Không thể kết nối server. Hãy thử lại!");
    }
  };

  // ─── Switch subtitle mode ─────────────────────────────────────────────────
  const handleModeChange = async (mode: SubtitleMode) => {
    setSubtitleMode(mode);
    if (mode === "off") { setParsedSubs([]); return; }
    const lang = mode === "bilingual" ? "bilingual" : "vietnamese";
    await loadSubtitleFile(lang);
  };

  // ─── Active subtitle from currentTime ─────────────────────────────────────
  useEffect(() => {
    if (!parsedSubs.length) { setActiveSub(""); return; }
    const found = parsedSubs.find((s) => currentTime >= s.start && currentTime <= s.end);
    setActiveSub(found?.text ?? "");
  }, [currentTime, parsedSubs]);

  // ─── Player controls ──────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    v.paused ? v.play() : v.pause();
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (videoRef.current) { videoRef.current.currentTime = t; setCurrentTime(t); }
  };
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value); setVolume(v);
    if (videoRef.current) { videoRef.current.volume = v; setIsMuted(v === 0); }
  };
  const toggleMute = () => {
    const v = videoRef.current; if (!v) return;
    v.muted = !v.muted; setIsMuted(v.muted);
  };
  const toggleFullscreen = () => {
    const c = document.getElementById("video-container"); if (!c) return;
    document.fullscreenElement ? document.exitFullscreen() : c.requestFullscreen();
  };
  const handleMouseMove = () => {
    setShowControls(true); clearTimeout(controlsTimer.current);
    if (isPlaying) controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  const fmt = (sec: number) => `${Math.floor(sec/60)}:${Math.floor(sec%60).toString().padStart(2,"0")}`;
  const fmtMB = (b: number) => `${(b/(1024*1024)).toFixed(1)} MB`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("vi-VN",{day:"2-digit",month:"long",year:"numeric"});
  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  const isProcessing = transcribing || video?.status === "processing";
  const hasSubtitles = video?.subtitles && video.subtitles.length > 0;
  const statusColor  = video?.status === "completed" ? "#22c55e" : video?.status === "error" ? "#ef4444" : video?.status === "processing" ? "#f59e0b" : "var(--text-muted)";

  // ─── Loading / error ──────────────────────────────────────────────────────
  if (loading) return (
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

        {/* ── Video Player ─────────────────────────────────────────────────── */}
        <div
          id="video-container"
          className="relative rounded-2xl overflow-hidden mb-8"
          style={{ background: "#000", boxShadow: "0 0 60px rgba(0,0,0,0.8)", aspectRatio: "16/9" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          <video
            ref={videoRef}
            id="main-video-player"
            className="w-full h-full object-contain"
            src={`${API_URL}/videos/${id}/stream`}
            onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
            onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => { setIsPlaying(false); setShowControls(true); }}
            onClick={togglePlay}
          />

          {/* Play overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl text-white transition-all hover:scale-110"
                style={{ background: "rgba(139,92,246,0.85)", boxShadow: "0 0 40px rgba(139,92,246,0.5)" }}>
                ▶
              </div>
            </div>
          )}

          {/* ── Subtitle overlay ──────────────────────────────────────────── */}
          {subtitleMode !== "off" && activeSub && (
            <div
              className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none px-8"
              style={{ zIndex: 10 }}
            >
              <div
                className="text-center rounded-lg px-4 py-2 max-w-3xl"
                style={{
                  background: "rgba(0,0,0,0.75)",
                  backdropFilter: "blur(4px)",
                  fontSize: "clamp(14px, 2.2vw, 20px)",
                  lineHeight: 1.5,
                  color: "#fff",
                  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                  whiteSpace: "pre-line",
                }}
              >
                {subtitleMode === "bilingual"
                  ? activeSub.split("\n").map((line, i) => (
                      <div key={i} style={{ color: i === 0 ? "rgba(255,255,255,0.65)" : "#fff", fontSize: i === 0 ? "0.88em" : "1em" }}>
                        {line}
                      </div>
                    ))
                  : activeSub}
              </div>
            </div>
          )}

          {/* ── Processing spinner overlay ────────────────────────────────── */}
          {isProcessing && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b" }}>
              <div className="w-3 h-3 rounded-full border border-amber-400 border-t-transparent animate-spin" />
              AI đang xử lý...
            </div>
          )}

          {/* Custom Controls */}
          <div
            className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.9))", padding: "32px 16px 14px" }}
          >
            {/* Seekbar */}
            <div className="mb-3">
              <input id="video-seekbar" type="range" min={0} max={duration || 100} step={0.1} value={currentTime}
                onChange={handleSeek} className="w-full h-1 rounded-full cursor-pointer appearance-none"
                style={{ background: `linear-gradient(to right, #8b5cf6 ${progressPct}%, rgba(255,255,255,0.2) ${progressPct}%)`, accentColor: "#8b5cf6" }}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button id="btn-play-pause" onClick={togglePlay} className="text-white hover:text-purple-400 transition-colors text-xl w-8 h-8 flex items-center justify-center">
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <div className="flex items-center gap-2">
                  <button id="btn-mute" onClick={toggleMute} className="text-white hover:text-purple-400 transition-colors">
                    {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                  </button>
                  <input type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume}
                    onChange={handleVolume} className="w-20 h-1 rounded-full cursor-pointer" style={{ accentColor: "#8b5cf6" }} />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {fmt(currentTime)} / {fmt(duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Subtitle mode toggle (only when subtitles exist) */}
                {hasSubtitles && (
                  <div className="flex items-center gap-1 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                    {(["off","translated","bilingual"] as SubtitleMode[]).map((m) => (
                      <button key={m} onClick={() => handleModeChange(m)}
                        className="px-2 py-1 text-xs transition-all"
                        style={{
                          background: subtitleMode === m ? "rgba(139,92,246,0.8)" : "transparent",
                          color: subtitleMode === m ? "#fff" : "rgba(255,255,255,0.6)",
                        }}>
                        {m === "off" ? "Tắt" : m === "translated" ? "Dịch" : "Song ngữ"}
                      </button>
                    ))}
                  </div>
                )}
                <button id="btn-fullscreen" onClick={toggleFullscreen} className="text-white hover:text-purple-400 transition-colors">
                  {isFullscreen ? "🗗" : "⛶"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Info + AI Panel ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Video info */}
          <div className="md:col-span-2">
            <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{video.title}</h1>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              {fmtDate(video.createdAt)} · {fmtMB(video.fileSize)} · {video.mimeType.split("/")[1].toUpperCase()}
            </p>

            {/* Status badge */}
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: "var(--text-muted)" }}>Trạng thái phụ đề:</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                {video.status === "completed" ? "✅ Hoàn thành"
                  : video.status === "processing" ? "⚙️ Đang xử lý..."
                  : video.status === "error" ? "❌ Lỗi"
                  : "⬜ Chưa có phụ đề"}
              </span>
            </div>

            {/* Error message */}
            {video.status === "error" && video.errorMessage && (
              <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                ❌ {video.errorMessage}
              </div>
            )}

            {/* Subtitle info khi đã có */}
            {hasSubtitles && (
              <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <p className="text-sm font-medium mb-3" style={{ color: "#86efac" }}>🎉 Phụ đề đã sẵn sàng</p>

                {/* Tải SRT */}
                <p className="text-xs mb-2" style={{ color: "rgba(134,239,172,0.6)" }}>📄 Tải file phụ đề (.srt):</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {video.subtitles.map((sub) => (
                    <a key={sub.language}
                      href={`${API_URL}/videos/${id}/subtitles/${sub.language}/download`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                      style={{ background: "rgba(34,197,94,0.15)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }}>
                      ⬇ Tải SRT {sub.label || sub.language}
                    </a>
                  ))}
                </div>

                {/* Tải Video đã burn subtitle */}
                <p className="text-xs mb-2" style={{ color: "rgba(139,92,246,0.8)" }}>🎬 Tải video đã gắn phụ đề:</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { lang: "vietnamese", label: "Phụ đề Việt" },
                    { lang: "bilingual",  label: "Song ngữ" },
                  ] as const).map(({ lang, label }) => {
                    const state = burnDownloading[lang] ?? "idle";
                    const isRendering = state === "rendering";
                    const isDone     = state === "done";
                    const isError    = state === "error";

                    const handleBurnDownload = async () => {
                      if (isRendering) return;
                      setBurnDownloading((prev) => ({ ...prev, [lang]: "rendering" }));
                      try {
                        const res = await fetch(`${API_URL}/videos/${id}/download-burned?lang=${lang}`);
                        if (!res.ok) throw new Error(await res.text());
                        const blob = await res.blob();
                        const url  = URL.createObjectURL(blob);
                        const a    = document.createElement("a");
                        a.href     = url;
                        a.download = `${video.title}_${label}.mp4`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setBurnDownloading((prev) => ({ ...prev, [lang]: "done" }));
                        setTimeout(() => setBurnDownloading((prev) => ({ ...prev, [lang]: "idle" })), 4000);
                      } catch {
                        setBurnDownloading((prev) => ({ ...prev, [lang]: "error" }));
                        setTimeout(() => setBurnDownloading((prev) => ({ ...prev, [lang]: "idle" })), 4000);
                      }
                    };

                    return (
                      <button
                        key={lang}
                        onClick={handleBurnDownload}
                        disabled={isRendering}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: isError    ? "rgba(239,68,68,0.15)"
                                    : isDone     ? "rgba(34,197,94,0.15)"
                                    : isRendering? "rgba(245,158,11,0.15)"
                                    :              "rgba(139,92,246,0.15)",
                          color: isError    ? "#fca5a5"
                               : isDone     ? "#86efac"
                               : isRendering? "#fcd34d"
                               :              "#c4b5fd",
                          border: `1px solid ${
                            isError    ? "rgba(239,68,68,0.3)"
                          : isDone     ? "rgba(34,197,94,0.3)"
                          : isRendering? "rgba(245,158,11,0.3)"
                          :              "rgba(139,92,246,0.3)"
                          }`,
                          cursor: isRendering ? "not-allowed" : "pointer",
                          opacity: isRendering ? 0.8 : 1,
                        }}
                      >
                        {isRendering ? (
                          <><span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin inline-block" /> Đang render...</>
                        ) : isDone ? (
                          <>✅ Đã tải xong!</>
                        ) : isError ? (
                          <>❌ Thất bại, thử lại</>
                        ) : (
                          <>🎬 Video + {label}</>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                  ⚠️ Render video có thể mất 1-3 phút tuỳ độ dài video
                </p>
              </div>
            )}
          </div>

          {/* AI Panel */}
          <div className="flex flex-col gap-3">
            {/* Language picker */}
            <div className="relative">
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="w-full px-4 py-3 rounded-xl text-sm text-left flex items-center justify-between transition-all glass"
                style={{ color: "var(--text-secondary)" }}
              >
                <span>🌐 Dịch sang: <strong style={{ color: "var(--text-primary)" }}>{targetLang}</strong></span>
                <span style={{ fontSize: "10px" }}>{showLangPicker ? "▲" : "▼"}</span>
              </button>
              {showLangPicker && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-xl overflow-hidden glass-strong"
                  style={{ border: "1px solid var(--border-accent)" }}>
                  {LANGUAGES.map((lang) => (
                    <button key={lang} onClick={() => { setTargetLang(lang); setShowLangPicker(false); }}
                      className="w-full px-4 py-2.5 text-sm text-left transition-all hover:bg-purple-500/10"
                      style={{ color: lang === targetLang ? "var(--accent-purple)" : "var(--text-secondary)" }}>
                      {lang === targetLang ? "✓ " : "  "}{lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Transcribe button */}
            <button
              id="btn-create-subtitle"
              disabled={isProcessing}
              onClick={handleTranscribe}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all relative overflow-hidden"
              style={{
                background: isProcessing
                  ? "rgba(139,92,246,0.3)"
                  : "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                boxShadow: isProcessing ? "none" : "0 0 20px rgba(139,92,246,0.35)",
                cursor: isProcessing ? "not-allowed" : "pointer",
                transform: isProcessing ? "none" : undefined,
              }}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                <span>{hasSubtitles ? "🔄 Tạo lại phụ đề" : "🤖 Tạo phụ đề AI"}</span>
              )}
            </button>

            {/* Processing progress hint */}
            {isProcessing && (
              <div className="p-3 rounded-xl text-xs" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#fcd34d" }}>
                <p className="font-medium mb-1">Pipeline đang chạy:</p>
                <div className="flex flex-col gap-1" style={{ color: "rgba(252,211,77,0.7)" }}>
                  <span>🎵 FFmpeg đang tách audio...</span>
                  <span>🤖 Gemini AI đang phân tích...</span>
                  <span>📝 Đang tạo file .srt...</span>
                </div>
                <p className="mt-2" style={{ color: "rgba(252,211,77,0.5)" }}>Tự động cập nhật sau 3 giây một lần</p>
              </div>
            )}

            <Link href="/library" id="btn-back-library"
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
