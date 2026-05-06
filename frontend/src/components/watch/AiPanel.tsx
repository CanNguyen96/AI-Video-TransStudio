"use client";

import Link from "next/link";

interface AiPanelProps {
  targetLang: string;
  showLangPicker: boolean;
  isProcessing: boolean;
  hasSubtitles: boolean;
  languages: string[];
  setTargetLang: (lang: string) => void;
  setShowLangPicker: (v: boolean) => void;
  onTranscribe: () => void;
}

export default function AiPanel({
  targetLang, showLangPicker, isProcessing, hasSubtitles,
  languages, setTargetLang, setShowLangPicker, onTranscribe,
}: AiPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Language picker */}
      <div className="relative">
        <button
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="w-full px-4 py-3 rounded-xl text-sm text-left flex items-center justify-between transition-all glass"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>
            🌐 Dịch sang:{" "}
            <strong style={{ color: "var(--text-primary)" }}>{targetLang}</strong>
          </span>
          <span style={{ fontSize: "10px" }}>{showLangPicker ? "▲" : "▼"}</span>
        </button>

        {showLangPicker && (
          <div
            className="absolute z-20 top-full left-0 right-0 mt-1 rounded-xl overflow-hidden glass-strong"
            style={{ border: "1px solid var(--border-accent)" }}
          >
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => { setTargetLang(lang); setShowLangPicker(false); }}
                className="w-full px-4 py-2.5 text-sm text-left transition-all hover:bg-purple-500/10"
                style={{
                  color: lang === targetLang ? "var(--accent-purple)" : "var(--text-secondary)",
                }}
              >
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
        onClick={onTranscribe}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all"
        style={{
          background: isProcessing
            ? "rgba(139,92,246,0.3)"
            : "linear-gradient(135deg, #8b5cf6, #3b82f6)",
          boxShadow: isProcessing ? "none" : "0 0 20px rgba(139,92,246,0.35)",
          cursor: isProcessing ? "not-allowed" : "pointer",
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
        <div
          className="p-3 rounded-xl text-xs"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
            color: "#fcd34d",
          }}
        >
          <p className="font-medium mb-1">Pipeline đang chạy:</p>
          <div className="flex flex-col gap-1" style={{ color: "rgba(252,211,77,0.7)" }}>
            <span>🎵 FFmpeg đang tách audio...</span>
            <span>🤖 Gemini AI đang phân tích...</span>
            <span>📝 Đang tạo file .srt...</span>
          </div>
          <p className="mt-2" style={{ color: "rgba(252,211,77,0.5)" }}>
            Tự động cập nhật sau 3 giây một lần
          </p>
        </div>
      )}

      <Link
        href="/library"
        id="btn-back-library"
        className="w-full py-3 rounded-xl font-semibold text-sm text-center transition-all hover:opacity-80 glass"
        style={{ color: "var(--text-secondary)" }}
      >
        ← Quay lại thư viện
      </Link>
    </div>
  );
}
