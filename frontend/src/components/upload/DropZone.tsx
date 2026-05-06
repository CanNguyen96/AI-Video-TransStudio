"use client";

import { useRef } from "react";

interface DropZoneProps {
  dragOver: boolean;
  selectedFile: File | null;
  errorMsg: string;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  formatSize: (bytes: number) => string;
}

const FORMAT_LIST = ["MP4", "MOV", "AVI", "WebM", "MKV"];

export default function DropZone({
  dragOver, selectedFile, errorMsg,
  onDrop, onDragOver, onDragLeave,
  onFileSelect, onClear, formatSize,
}: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div
        id="upload-dropzone"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer mb-6 ${
          dragOver ? "scale-102" : selectedFile ? "cursor-default" : "hover:scale-[1.01]"
        }`}
        style={{
          border: `2px dashed ${dragOver ? "#8b5cf6" : selectedFile ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.12)"}`,
          background: dragOver ? "rgba(139,92,246,0.1)" : selectedFile ? "rgba(139,92,246,0.05)" : "var(--bg-card)",
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
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        />

        {!selectedFile ? (
          <div className="space-y-4">
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl animate-float"
              style={{ background: "rgba(139,92,246,0.15)" }}
            >
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
              {FORMAT_LIST.map((fmt) => (
                <span key={fmt} className="px-3 py-1 rounded-full text-xs font-medium glass" style={{ color: "var(--text-muted)" }}>
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
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="text-xs px-3 py-1 rounded-lg transition-all hover:opacity-80"
              style={{ color: "#f87171", background: "rgba(248,113,113,0.1)" }}
            >
              Chọn file khác
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <div
          className="p-4 rounded-xl mb-4 text-sm animate-scale-in"
          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#fca5a5" }}
        >
          ⚠️ {errorMsg}
        </div>
      )}
    </>
  );
}
