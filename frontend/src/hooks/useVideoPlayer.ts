"use client";

import { useRef, useState, useCallback, useEffect } from "react";

/**
 * Quản lý toàn bộ state và logic của HTML5 video player.
 */
export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Lắng nghe thay đổi fullscreen từ bất kỳ nguồn nào (phím F, nút ESC...)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      setCurrentTime(t);
    }
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      setIsMuted(v === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const c = document.getElementById("video-container");
    if (!c) return;
    document.fullscreenElement ? document.exitFullscreen() : c.requestFullscreen();
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    // Ẩn controls sau 3 giây nếu đang play
    controlsTimer.current = setTimeout(() => {
      setShowControls((playing) => {
        if (playing) return false;
        return true;
      });
    }, 3000);
  }, []);

  // Format helpers
  const fmt = (sec: number) =>
    `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, "0")}`;
  const fmtMB = (b: number) => `${(b / (1024 * 1024)).toFixed(1)} MB`;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return {
    videoRef,
    // State
    isPlaying, setIsPlaying,
    currentTime, setCurrentTime,
    duration, setDuration,
    volume, isMuted,
    isFullscreen,
    showControls, setShowControls,
    // Handlers
    togglePlay, handleSeek, handleVolume, toggleMute,
    toggleFullscreen, handleMouseMove,
    // Computed
    progressPct,
    // Formatters
    fmt, fmtMB, fmtDate,
  };
}
