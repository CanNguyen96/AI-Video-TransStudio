"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden pt-16">
        {/* Background orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 animate-pulse-slow"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-8 animate-float"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
        <div className="absolute top-1/2 right-1/3 w-60 h-60 rounded-full opacity-6"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />

        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm"
            style={{ border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Powered by Gemini AI
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            <span className="gradient-text">AI Video</span>
            <br />
            <span style={{ color: "var(--text-primary)" }}>TransStudio</span>
          </h1>

          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "var(--text-secondary)" }}>
            Upload video của bạn — AI sẽ tự động tạo phụ đề, dịch thuật và lồng tiếng chỉ trong vài phút.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/upload"
              id="hero-upload-btn"
              className="px-8 py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 hover:scale-105 hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                boxShadow: "0 0 30px rgba(139,92,246,0.4)",
              }}
            >
              🚀 Bắt đầu Upload
            </Link>
            <Link
              href="/library"
              id="hero-library-btn"
              className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 glass"
              style={{ color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              📁 Thư viện Video
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
          style={{ color: "var(--text-muted)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: "var(--text-primary)" }}>
            Tính năng chính
          </h2>
          <p className="text-center mb-16" style={{ color: "var(--text-secondary)" }}>
            Từ upload đến phụ đề hoàn chỉnh — hoàn toàn tự động
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl card-bg transition-all duration-300 hover:scale-105 group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: f.bg }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline section */}
      <section className="py-24 px-6" style={{ background: "var(--bg-secondary)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-16" style={{ color: "var(--text-primary)" }}>
            Quy trình xử lý
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {pipeline.map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl glass"
                    style={{ border: "1px solid rgba(139,92,246,0.3)" }}>
                    {step.icon}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    {step.label}
                  </span>
                </div>
                {i < pipeline.length - 1 && (
                  <svg className="hidden md:block" width="24" height="24" viewBox="0 0 24 24"
                    fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)" }}>
        <p className="text-sm">
          © 2025 AI Video TransStudio — Built with Next.js, Express & Gemini AI
        </p>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: "🎬",
    title: "Upload & Phát Video",
    desc: "Hỗ trợ kéo thả file MP4, MOV, AVI, MKV. Trình phát HTML5 tích hợp sẵn với hỗ trợ tua video mượt mà.",
    bg: "rgba(139,92,246,0.15)",
  },
  {
    icon: "🤖",
    title: "AI Tạo Phụ Đề",
    desc: "Gemini AI tự động nhận diện giọng nói, tạo timestamp chính xác và dịch sang tiếng Việt.",
    bg: "rgba(59,130,246,0.15)",
  },
  {
    icon: "📝",
    title: "Double Subtitle",
    desc: "Hiển thị đồng thời phụ đề ngôn ngữ gốc và tiếng Việt. Chỉnh sửa trực tiếp nếu AI dịch chưa chuẩn.",
    bg: "rgba(6,182,212,0.15)",
  },
  {
    icon: "🎙️",
    title: "AI Dubbing",
    desc: "Text-to-Speech đọc bản dịch và trộn ngược vào video gốc. Lồng tiếng hoàn toàn tự động.",
    bg: "rgba(236,72,153,0.15)",
  },
  {
    icon: "📦",
    title: "Xuất File SRT",
    desc: "Tải xuống file phụ đề chuẩn .srt để dùng với bất kỳ trình phát video nào.",
    bg: "rgba(245,158,11,0.15)",
  },
  {
    icon: "⚡",
    title: "Xử Lý Nhanh",
    desc: "Queue processing với hàng đợi thông minh, không lo sập server dù xử lý video dài.",
    bg: "rgba(16,185,129,0.15)",
  },
];

const pipeline = [
  { icon: "📤", label: "Upload" },
  { icon: "🔊", label: "Tách Audio" },
  { icon: "🤖", label: "AI Xử Lý" },
  { icon: "📝", label: "Tạo SRT" },
  { icon: "🎬", label: "Xem Video" },
];
