import { RefObject } from "react";
import { SubtitleMode } from "@/types/video";
import { videoEndpoints } from "@/lib/api";
import SubtitleOverlay from "./SubtitleOverlay";
import ProcessingBadge from "./ProcessingBadge";
import PlayerControls from "./PlayerControls";

interface VideoPlayerProps {
  videoId: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  // Player state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  progressPct: number;
  // Subtitle state
  subtitleMode: SubtitleMode;
  activeSub: string;
  hasSubtitles: boolean;
  // Processing state
  isProcessing: boolean;
  // Formatters
  fmt: (sec: number) => string;
  // Handlers
  onTogglePlay: () => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVolume: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onMouseMove: () => void;
  onModeChange: (mode: SubtitleMode) => void;
  setIsPlaying: (v: boolean) => void;
  setCurrentTime: (v: number) => void;
  setDuration: (v: number) => void;
  setShowControls: (v: boolean) => void;
}

export default function VideoPlayer({
  videoId, videoRef,
  isPlaying, currentTime, duration, volume, isMuted,
  isFullscreen, showControls, progressPct,
  subtitleMode, activeSub, hasSubtitles,
  isProcessing, fmt,
  onTogglePlay, onSeek, onVolume, onToggleMute,
  onToggleFullscreen, onMouseMove, onModeChange,
  setIsPlaying, setCurrentTime, setDuration, setShowControls,
}: VideoPlayerProps) {
  return (
    <div
      id="video-container"
      className="relative rounded-2xl overflow-hidden mb-8"
      style={{ background: "#000", boxShadow: "0 0 60px rgba(0,0,0,0.8)", aspectRatio: "16/9" }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        id="main-video-player"
        className="w-full h-full object-contain"
        src={videoEndpoints.stream(videoId)}
        onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
        onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setShowControls(true); }}
        onClick={onTogglePlay}
      />

      {/* Play overlay (khi dừng) */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={onTogglePlay}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl text-white transition-all hover:scale-110"
            style={{ background: "rgba(139,92,246,0.85)", boxShadow: "0 0 40px rgba(139,92,246,0.5)" }}
          >
            ▶
          </div>
        </div>
      )}

      {/* Subtitle overlay */}
      <SubtitleOverlay subtitleMode={subtitleMode} activeSub={activeSub} />

      {/* Processing badge */}
      {isProcessing && <ProcessingBadge />}

      {/* Controls bar */}
      <PlayerControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        progressPct={progressPct}
        hasSubtitles={hasSubtitles}
        subtitleMode={subtitleMode}
        showControls={showControls}
        fmt={fmt}
        onTogglePlay={onTogglePlay}
        onSeek={onSeek}
        onVolume={onVolume}
        onToggleMute={onToggleMute}
        onToggleFullscreen={onToggleFullscreen}
        onModeChange={onModeChange}
      />
    </div>
  );
}
