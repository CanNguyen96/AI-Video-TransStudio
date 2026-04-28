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

## Bước tiếp theo — Giai đoạn 2
- [ ] Cài FFmpeg
- [ ] Tích hợp Gemini API để tạo phụ đề từ audio
- [ ] Generate file .srt
- [ ] API `/api/videos/:id/transcribe`
