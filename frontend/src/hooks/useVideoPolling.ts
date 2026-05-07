"use client";

import { useRef, useState, useCallback } from "react";
import { Video } from "@/types/video";
import { videoEndpoints } from "@/lib/api";

/**
 * Quản lý:
 * - Trigger AI transcription
 * - Polling backend mỗi 3 giây khi đang processing
 * - Callbacks khi hoàn thành để page cập nhật subtitle
 */
export function useVideoPolling(
  videoId: string,
  setVideo: (updater: (v: Video | null) => Video | null) => void,
  onCompleted: () => void,
  token: string | null
) {
  const pollingRef   = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const [transcribing, setTranscribing] = useState(false);

  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const stopPolling = useCallback(() => {
    clearInterval(pollingRef.current);
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res  = await fetch(videoEndpoints.detail(videoId), { headers: authHeaders });
        const data = await res.json();
        if (!data.success) return;

        const v: Video = data.data;
        setVideo(() => v);

        if (v.status === "completed" || v.status === "error") {
          stopPolling();
          setTranscribing(false);
          if (v.status === "completed") onCompleted();
        }
      } catch { /* ignore network errors */ }
    }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, setVideo, onCompleted, stopPolling, token]);

  const handleTranscribe = useCallback(
    async (targetLang: string, isProcessing: boolean) => {
      if (isProcessing) return;
      setTranscribing(true);
      try {
        await fetch(videoEndpoints.transcribe(videoId), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({ language: targetLang }),
        });
        setVideo((v) => v ? { ...v, status: "processing" } : v);
        startPolling();
      } catch {
        setTranscribing(false);
        alert("Không thể kết nối server. Hãy thử lại!");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoId, setVideo, startPolling, token]
  );

  return {
    transcribing,
    startPolling,
    stopPolling,
    handleTranscribe,
  };
}
