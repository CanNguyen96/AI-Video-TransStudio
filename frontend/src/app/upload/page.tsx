"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import DropZone from "@/components/upload/DropZone";
import TitleInput from "@/components/upload/TitleInput";
import ProgressBar from "@/components/upload/ProgressBar";
import UploadSuccess from "@/components/upload/UploadSuccess";
import { videoEndpoints } from "@/lib/api";

type UploadStatus = "idle" | "uploading" | "success" | "error";

const ALLOWED_TYPES = [
  "video/mp4", "video/mpeg", "video/quicktime",
  "video/x-msvideo", "video/webm", "video/x-matroska",
];
const MAX_SIZE_MB = 500;

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function UploadPage() {
  const router = useRouter();

  const [dragOver, setDragOver]         = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle]               = useState("");
  const [status, setStatus]             = useState<UploadStatus>("idle");
  const [progress, setProgress]         = useState(0);
  const [errorMsg, setErrorMsg]         = useState("");
  const [uploadedId, setUploadedId]     = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg("Định dạng không hỗ trợ. Vui lòng chọn: MP4, MOV, AVI, WebM, MKV");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`File quá lớn. Tối đa ${MAX_SIZE_MB}MB.`);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFile = () => { setSelectedFile(null); setStatus("idle"); setProgress(0); };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("title", title || selectedFile.name);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
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
    xhr.open("POST", videoEndpoints.upload());
    xhr.send(formData);
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
            Hỗ trợ MP4, MOV, AVI, WebM, MKV — Tối đa {MAX_SIZE_MB}MB
          </p>
        </div>

        <DropZone
          dragOver={dragOver}
          selectedFile={selectedFile}
          errorMsg={errorMsg}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onFileSelect={handleFileSelect}
          onClear={clearFile}
          formatSize={formatSize}
        />

        {selectedFile && status !== "success" && (
          <TitleInput value={title} onChange={setTitle} />
        )}

        {status === "uploading" && <ProgressBar progress={progress} />}

        {status === "success" && (
          <UploadSuccess
            onWatch={() => router.push(`/watch/${uploadedId}`)}
            onLibrary={() => router.push("/library")}
          />
        )}

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
