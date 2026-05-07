/**
 * Centralized API config — dùng chung cho toàn bộ frontend.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ─── Video endpoints ────────────────────────────────────────────────────────

export const videoEndpoints = {
  list:     ()                   => `${API_URL}/videos`,
  detail:   (id: string)        => `${API_URL}/videos/${id}`,
  upload:   ()                  => `${API_URL}/videos/upload`,
  delete:   (id: string)        => `${API_URL}/videos/${id}`,
  transcribe: (id: string)      => `${API_URL}/videos/${id}/transcribe`,
  subtitles: (id: string, lang: string) => `${API_URL}/videos/${id}/subtitles/${lang}`,
  downloadSubtitle: (id: string, lang: string) => `${API_URL}/videos/${id}/subtitles/${lang}/download`,
  downloadBurned:   (id: string, lang: string) => `${API_URL}/videos/${id}/download-burned?lang=${lang}`,

  // Media endpoints — token qua query string vì <video> và <img> không set được header
  stream:    (id: string, token: string | null) =>
    token ? `${API_URL}/videos/${id}/stream?token=${token}` : `${API_URL}/videos/${id}/stream`,
  thumbnail: (id: string, token: string | null) =>
    token ? `${API_URL}/videos/${id}/thumbnail?token=${token}` : `${API_URL}/videos/${id}/thumbnail`,
};
