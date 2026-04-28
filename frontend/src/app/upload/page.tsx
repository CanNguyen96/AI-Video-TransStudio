"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedId, setUploadedId] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    const allowed = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-matroska"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Định dạng không hỗ trợ. Vui lòng chọn: MP4, MOV, AVI, WebM, MKV");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setErrorMsg("File quá lớn. Tối đa 500MB.");
      return;
    }
    setErrorMsg("");
    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^.]+$/, ""));
    setStatus("idle");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("title", title || selectedFile.name);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 201) {
          const data = JSON.parse(xhr.responseText);
          setStatus("success");
          setProgress(100);
          setUploadedId(data.data._id);
        } else {
          const err = JSON.parse(xhr.responseText);
          setStatus("error");
          setErrorMsg(err.message || "Upload thất bại");
        }
      });

      xhr.addEventListener("error", () => {
        setStatus("error");
        setErrorMsg("Không thể kết nối tới server. Hãy chắc chắn backend đang chạy.");
      });

      xhr.open("POST", `${API_URL}/videos/upload`);
      xhr.send(formData);
    } catch (err) {
      setStatus("error");
      setErrorMsg("Lỗi không xác định.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <main className="min-h-screen pt-16" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="text-4xl font-black mb-3">
            <span className="gradient-text">Upload Video</span>
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Hỗ trợ MP4, MOV, AVI, WebM, MKV — Tối đa 500MB
          </p>
        </div>

        {/* Drop Zone */}
        <div
          id="upload-dropzone"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={`relative rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer mb-6 ${
            dragOver
              ? "scale-102"
              : selectedFile
              ? "cursor-default"
              : "hover:scale-[1.01]"
          }`}
          style={{
            border: `2px dashed ${dragOver ? "#8b5cf6" : selectedFile ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.12)"}`,
            background: dragOver
              ? "rgba(139,92,246,0.1)"
              : selectedFile
              ? "rgba(139,92,246,0.05)"
              : "var(--bg-card)",
            boxShadow: dragOver ? "0 0 40px rgba(139,92,246,0.2)" : "none",
          }}
        >
          {dragOver && <div className="absolute inset-0 rounded-2xl upload-shimmer" />}

          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />

          {!selectedFile ? (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl animate-float"
                style={{ background: "rgba(139,92,246,0.15)" }}>
                🎬
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Kéo thả video vào đây
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  hoặc <span className="text-purple-400 underline">chọn file</span>
                </p>
              </div>
              <div className="flex justify-center gap-3 flex-wrap">
                {["MP4", "MOV", "AVI", "WebM", "MKV"].map((fmt) => (
                  <span key={fmt} className="px-3 py-1 rounded-full text-xs font-medium glass"
                    style={{ color: "var(--text-muted)" }}>
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-5xl">✅</div>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {selectedFile.name}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {formatSize(selectedFile.size)}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setStatus("idle"); setProgress(0); }}
                className="text-xs px-3 py-1 rounded-lg transition-all hover:opacity-80"
                style={{ color: "#f87171", background: "rgba(248,113,113,0.1)" }}
              >
                Chọn file khác
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="p-4 rounded-xl mb-4 text-sm animate-scale-in"
            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#fca5a5" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Title input */}
        {selectedFile && status !== "success" && (
          <div className="mb-6 animate-fade-in-up">
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Tiêu đề video
            </label>
            <input
              id="video-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--bg-card)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>
        )}

        {/* Progress bar */}
        {status === "uploading" && (
          <div className="mb-6 animate-fade-in-up">
            <div className="flex justify-between text-sm mb-2"
              style={{ color: "var(--text-secondary)" }}>
              <span>Đang upload...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-card)" }}>
              <div className="h-full rounded-full progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="p-5 rounded-xl mb-6 animate-scale-in"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <p className="font-semibold mb-3" style={{ color: "#6ee7b7" }}>
              🎉 Upload thành công!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/watch/${uploadedId}`)}
                id="btn-watch-now"
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}
              >
                ▶ Xem ngay
              </button>
              <button
                onClick={() => router.push("/library")}
                id="btn-go-library"
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80 glass"
                style={{ color: "var(--text-secondary)" }}
              >
                📁 Thư viện
              </button>
            </div>
          </div>
        )}

        {/* Upload button */}
        {selectedFile && status !== "success" && (
          <button
            id="btn-upload-submit"
            onClick={handleUpload}
            disabled={status === "uploading"}
            className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              boxShadow: "0 0 30px rgba(139,92,246,0.3)",
            }}
          >
            {status === "uploading" ? `Đang upload... ${progress}%` : "🚀 Upload Video"}
          </button>
        )}
      </div>
    </main>
  );
}
