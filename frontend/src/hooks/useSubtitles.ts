"use client";

import { useState, useEffect, useCallback } from "react";
import { SubtitleMode } from "@/types/video";
import { videoEndpoints } from "@/lib/api";

export interface ParsedSub {
  start: number;
  end: number;
  text: string;
}

/** Parse SRT text → mảng [{start, end, text}] */
export function parseSrt(srt: string): ParsedSub[] {
  const blocks = srt.trim().split(/\n\s*\n/);
  return blocks.flatMap((block) => {
    const lines = block.trim().split("\n");
    if (lines.length < 3) return [];
    const match = lines[1].match(
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

export const LANGUAGES = [
  "Vietnamese", "English", "Japanese",
  "Korean", "Chinese", "French", "Spanish",
];

/**
 * Quản lý state subtitle: load SRT từ backend, parse, xác định sub active theo thời gian.
 */
export function useSubtitles(videoId: string, currentTime: number, token: string | null) {
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>("off");
  const [parsedSubs, setParsedSubs]     = useState<ParsedSub[]>([]);
  const [activeSub, setActiveSub]       = useState<string>("");
  const [targetLang, setTargetLang]     = useState("Vietnamese");
  const [showLangPicker, setShowLangPicker] = useState(false);

  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  /** Tải file SRT từ backend và parse */
  const loadSubtitleFile = useCallback(async (lang: string) => {
    try {
      const res = await fetch(videoEndpoints.subtitles(videoId, lang), { headers: authHeaders });
      if (!res.ok) return;
      const text = await res.text();
      setParsedSubs(parseSrt(text));
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, token]);

  /** Khi mode thay đổi: tải file mới hoặc xóa subs */
  const handleModeChange = useCallback(async (mode: SubtitleMode) => {
    setSubtitleMode(mode);
    if (mode === "off") { setParsedSubs([]); return; }
    const lang = mode === "bilingual" ? "bilingual" : "vietnamese";
    await loadSubtitleFile(lang);
  }, [loadSubtitleFile]);

  /** Cập nhật active sub theo currentTime */
  useEffect(() => {
    if (!parsedSubs.length) { setActiveSub(""); return; }
    const found = parsedSubs.find((s) => currentTime >= s.start && currentTime <= s.end);
    setActiveSub(found?.text ?? "");
  }, [currentTime, parsedSubs]);

  return {
    subtitleMode, setSubtitleMode,
    parsedSubs, setParsedSubs,
    activeSub,
    targetLang, setTargetLang,
    showLangPicker, setShowLangPicker,
    loadSubtitleFile,
    handleModeChange,
    LANGUAGES,
  };
}
