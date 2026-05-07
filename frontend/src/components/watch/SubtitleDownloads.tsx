"use client";

import { useState } from "react";
import { Video, BurnState } from "@/types/video";
import { videoEndpoints } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface SubtitleDownloadsProps {
  video: Video;
  videoId: string;
}

const burnOptions = [
  { lang: "vietnamese", label: "Phụ đề Việt" },
  { lang: "bilingual",  label: "Song ngữ" },
] as const;

export default function SubtitleDownloads({ video, videoId }: SubtitleDownloadsProps) {
  const [burnState, setBurnState] = useState<Record<string, BurnState>>({});
  const { token } = useAuth();

  // Tải SRT qua <a href> — cần token trong query string
  const srtDownloadUrl = (lang: string) =>
    token
      ? `${videoEndpoints.downloadSubtitle(videoId, lang)}?token=${token}`
      : videoEndpoints.downloadSubtitle(videoId, lang);

  const handleBurnDownload = async (lang: string, label: string) => {
    if (burnState[lang] === "rendering") return;
    setBurnState((prev) => ({ ...prev, [lang]: "rendering" }));
    try {
      const res = await fetch(videoEndpoints.downloadBurned(videoId, lang), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${video.title}_${label}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      setBurnState((prev) => ({ ...prev, [lang]: "done" }));
      setTimeout(() => setBurnState((prev) => ({ ...prev, [lang]: "idle" })), 4000);
    } catch {
      setBurnState((prev) => ({ ...prev, [lang]: "error" }));
      setTimeout(() => setBurnState((prev) => ({ ...prev, [lang]: "idle" })), 4000);
    }
  };

  return (
    <div
      className="mt-4 p-4 rounded-xl"
      style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}
    >
      <p className="text-sm font-medium mb-3" style={{ color: "#86efac" }}>
        🎉 Phụ đề đã sẵn sàng
      </p>

      {/* Tải SRT */}
      <p className="text-xs mb-2" style={{ color: "rgba(134,239,172,0.6)" }}>
        📄 Tải file phụ đề (.srt):
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {video.subtitles.map((sub) => (
          <a
            key={sub.language}
            href={srtDownloadUrl(sub.language)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
            style={{
              background: "rgba(34,197,94,0.15)",
              color: "#86efac",
              border: "1px solid rgba(34,197,94,0.3)",
            }}
          >
            ⬇ Tải SRT {sub.label || sub.language}
          </a>
        ))}
      </div>

      {/* Tải Video đã burn subtitle */}
      <p className="text-xs mb-2" style={{ color: "rgba(139,92,246,0.8)" }}>
        🎬 Tải video đã gắn phụ đề:
      </p>
      <div className="flex flex-wrap gap-2">
        {burnOptions.map(({ lang, label }) => {
          const state       = burnState[lang] ?? "idle";
          const isRendering = state === "rendering";
          const isDone      = state === "done";
          const isError     = state === "error";

          const bg     = isError ? "rgba(239,68,68,0.15)" : isDone ? "rgba(34,197,94,0.15)" : isRendering ? "rgba(245,158,11,0.15)" : "rgba(139,92,246,0.15)";
          const color  = isError ? "#fca5a5"  : isDone ? "#86efac" : isRendering ? "#fcd34d" : "#c4b5fd";
          const border = isError ? "rgba(239,68,68,0.3)" : isDone ? "rgba(34,197,94,0.3)" : isRendering ? "rgba(245,158,11,0.3)" : "rgba(139,92,246,0.3)";

          return (
            <button
              key={lang}
              onClick={() => handleBurnDownload(lang, label)}
              disabled={isRendering}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: bg, color, border: `1px solid ${border}`, cursor: isRendering ? "not-allowed" : "pointer", opacity: isRendering ? 0.8 : 1 }}
            >
              {isRendering ? (
                <><span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin inline-block" /> Đang render...</>
              ) : isDone ? <>✅ Đã tải xong!</>
                : isError ? <>❌ Thất bại, thử lại</>
                : <>🎬 Video + {label}</>}
            </button>
          );
        })}
      </div>
      <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
        ⚠️ Render video có thể mất 1-3 phút tuỳ độ dài video
      </p>
    </div>
  );
}
