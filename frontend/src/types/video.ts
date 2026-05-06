/**
 * Shared types cho toàn bộ frontend.
 * Cập nhật ở đây khi backend thêm field mới.
 */

export interface Subtitle {
  language: string;
  srtPath: string;
  label?: string;
}

export interface Segment {
  start: number;
  end: number;
  original: string;
  translated: string;
}

export interface Video {
  _id: string;
  title: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: "uploaded" | "processing" | "completed" | "error";
  duration: number | null;
  createdAt: string;
  subtitles: Subtitle[];
  segments: Segment[];
  errorMessage?: string;
}

export type SubtitleMode = "off" | "translated" | "bilingual";

export type BurnState = "idle" | "rendering" | "done" | "error";
