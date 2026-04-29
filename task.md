# Task: Giai đoạn 1 - Nền tảng ✅

## Backend (Express)
- [x] Khởi tạo project backend
- [x] Cài đặt dependencies (express, mongoose, multer, cors, uuid, nodemon)
- [x] Tạo server + routes upload
- [x] Xử lý upload file với multer (UUID naming, filter video-only)
- [x] Kết nối MongoDB (schema Video đầy đủ)
- [x] API stream video (hỗ trợ range requests để tua)
- [x] API CRUD: upload, list, getById, delete, stream

## Frontend (Next.js + Tailwind)
- [x] Khởi tạo project frontend (Next.js 16 + TypeScript + Tailwind)
- [x] Design system: dark theme, glassmorphism, gradient, animations
- [x] Navbar: glassmorphism, active link, gradient logo
- [x] Trang chủ: hero + features grid + pipeline diagram
- [x] Trang Upload: drag-and-drop, XHR progress bar, file validation
- [x] Trang Thư viện: video grid, skeleton loading, delete, empty state
- [x] Trang Watch/[id]: custom HTML5 player + seekbar + volume + fullscreen

## Kiểm tra
- [x] UI hiển thị đúng: trang chủ, upload, library (✅)
- [x] Backend chạy port 5000 (✅)
- [ ] Cần: Khởi động MongoDB local để test full flow upload → xem video

## Giai đoạn 2 — AI Core (đang làm)

### Backend ✅
- [x] Cài FFmpeg + @google/generative-ai + fluent-ffmpeg
- [x] `services/ffmpegService.js` — tách audio từ video (.mp3 mono 16kHz)
- [x] `services/geminiService.js` — gửi audio → Gemini 2.0 Flash → transcript + timestamp
- [x] `services/subtitleService.js` — chuyển segments thành file .srt (đơn ngữ + song ngữ)
- [x] `controllers/transcribeController.js` — pipeline controller + subtitle/download API
- [x] API `POST /api/videos/:id/transcribe` — trigger pipeline bất đồng bộ (202 Accepted)
- [x] API `GET  /api/videos/:id/subtitles/:lang` — lấy nội dung SRT
- [x] API `GET  /api/videos/:id/subtitles/:lang/download` — tải file SRT
- [x] `models/Video.js` — thêm fields: audioPath, errorMessage, segments
- [x] Gemini API key đã điền vào .env

### Frontend ✅
- [x] Nút "Tạo phụ đề AI" + chọn ngôn ngữ dịch (dropdown)
- [x] Polling tự động mỗi 3s → cập nhật status khi xong
- [x] Hiển thị phụ đề overlay lên video player
- [x] 3 chế độ: Tắt / Chỉ dịch / Song ngữ (gốc + dịch)
- [x] Nút tải xuống từng file SRT
- [x] Badge trạng thái: Chưa có / Đang xử lý / Hoàn thành / Lỗi
- [x] Auto-load phụ đề nếu video đã completed khi mở trang

## Giai đoạn 3 — Trình phát thông minh (tiếp theo)
- [ ] Cho phép chỉnh sửa nội dung phụ đề trực tiếp trên web
