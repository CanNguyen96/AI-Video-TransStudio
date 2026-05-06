/**
 * Data tĩnh cho trang chủ — tách ra để Home page.tsx gọn hơn.
 */

export const features = [
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

export const pipeline = [
  { icon: "📤", label: "Upload" },
  { icon: "🔊", label: "Tách Audio" },
  { icon: "🤖", label: "AI Xử Lý" },
  { icon: "📝", label: "Tạo SRT" },
  { icon: "🎬", label: "Xem Video" },
];
