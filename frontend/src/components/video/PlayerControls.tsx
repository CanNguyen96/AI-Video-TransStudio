import { SubtitleMode } from "@/types/video";

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  progressPct: number;
  hasSubtitles: boolean;
  subtitleMode: SubtitleMode;
  showControls: boolean;
  fmt: (sec: number) => string;
  onTogglePlay: () => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVolume: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onModeChange: (mode: SubtitleMode) => void;
}

export default function PlayerControls({
  isPlaying, currentTime, duration, volume, isMuted,
  isFullscreen, progressPct, hasSubtitles, subtitleMode,
  showControls, fmt,
  onTogglePlay, onSeek, onVolume, onToggleMute,
  onToggleFullscreen, onModeChange,
}: PlayerControlsProps) {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
        showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{
        background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
        padding: "32px 16px 14px",
      }}
    >
      {/* Seekbar */}
      <div className="mb-3">
        <input
          id="video-seekbar"
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={onSeek}
          className="w-full h-1 rounded-full cursor-pointer appearance-none"
          style={{
            background: `linear-gradient(to right, #8b5cf6 ${progressPct}%, rgba(255,255,255,0.2) ${progressPct}%)`,
            accentColor: "#8b5cf6",
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Left: play, volume, time */}
        <div className="flex items-center gap-3">
          <button
            id="btn-play-pause"
            onClick={onTogglePlay}
            className="text-white hover:text-purple-400 transition-colors text-xl w-8 h-8 flex items-center justify-center"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-mute"
              onClick={onToggleMute}
              className="text-white hover:text-purple-400 transition-colors"
            >
              {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={onVolume}
              className="w-20 h-1 rounded-full cursor-pointer"
              style={{ accentColor: "#8b5cf6" }}
            />
          </div>

          <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            {fmt(currentTime)} / {fmt(duration)}
          </span>
        </div>

        {/* Right: subtitle toggle, fullscreen */}
        <div className="flex items-center gap-3">
          {hasSubtitles && (
            <div
              className="flex items-center gap-1 rounded-lg overflow-hidden"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              {(["off", "translated", "bilingual"] as SubtitleMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  className="px-2 py-1 text-xs transition-all"
                  style={{
                    background: subtitleMode === m ? "rgba(139,92,246,0.8)" : "transparent",
                    color: subtitleMode === m ? "#fff" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {m === "off" ? "Tắt" : m === "translated" ? "Dịch" : "Song ngữ"}
                </button>
              ))}
            </div>
          )}

          <button
            id="btn-fullscreen"
            onClick={onToggleFullscreen}
            className="text-white hover:text-purple-400 transition-colors"
          >
            {isFullscreen ? "🗗" : "⛶"}
          </button>
        </div>
      </div>
    </div>
  );
}
