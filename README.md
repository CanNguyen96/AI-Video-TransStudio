# 🎬 AI Video TransStudio

> **Studio dịch video thông minh bằng AI** — Upload video, AI tự động tạo phụ đề, dịch thuật và lồng tiếng.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Tech Stack](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![Tech Stack](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)
![Tech Stack](https://img.shields.io/badge/AI-Gemini-blue?logo=google)


---

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Yêu cầu cài đặt](#-yêu-cầu-cài-đặt)
- [Hướng dẫn chạy dự án](#-hướng-dẫn-chạy-dự-án)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [API Reference](#-api-reference)

---

## ✨ Tính năng

| Tính năng | Giai đoạn | Trạng thái |
|---|---|---|
| Upload video (kéo thả, tối đa 500MB) | 1 | ✅ Hoàn thành |
| Trình phát video HTML5 tùy chỉnh | 1 | ✅ Hoàn thành |
| Thư viện quản lý video | 1 | ✅ Hoàn thành |
| Stream video với hỗ trợ tua (Range Requests) | 1 | ✅ Hoàn thành |
| AI tạo phụ đề tự động (Gemini API) | 2 | ✅ Hoàn thành |
| Double Subtitle (gốc + tiếng Việt song ngữ) | 2 | ✅ Hoàn thành |
| Tải file phụ đề (.srt) | 2 | ✅ Hoàn thành |
| Tải video đã burn phụ đề (FFmpeg) | 2 | ✅ Hoàn thành |
| Chỉnh sửa phụ đề trực tiếp | 3 | 🔜 Sắp có |
| AI Dubbing (lồng tiếng tự động) | 4 | 🔜 Sắp có |

---

## 🏗 Kiến trúc hệ thống

```
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│                 │        │                 │        │                 │
│   Next.js 16    │◄──────►│  Express API    │◄──────►│  MongoDB Atlas  │
│   (Frontend)    │  HTTP  │  (Backend)      │        │  (Database)     │
│   :3000         │        │  :5000          │        │                 │
│                 │        │                 │        └─────────────────┘
└─────────────────┘        │  ┌───────────┐  │
                           │  │  FFmpeg   │  │        ┌─────────────────┐
                           │  │  Multer   │  │◄──────►│  Gemini AI API  │
                           │  └───────────┘  │        │                 │
                           └─────────────────┘        └─────────────────┘
```

**Quy trình xử lý video :**
```
Upload Video → FFmpeg tách Audio → Gemini AI → Text + Timestamp → File .SRT → Hiển thị phụ đề
```

---

## 🛠 Yêu cầu cài đặt

Trước khi chạy dự án, hãy chắc chắn đã cài:

| Công cụ | Version | Link |
|---|---|---|
| **Node.js** | >= 18.x | [nodejs.org](https://nodejs.org) |
| **npm** | >= 9.x | Đi kèm Node.js |
| **MongoDB Atlas** | Cloud | [mongodb.com/atlas](https://mongodb.com/atlas) (Free tier) |
| **FFmpeg** | Latest | [ffmpeg.org](https://ffmpeg.org)|

---

## 🚀 Hướng dẫn chạy dự án

### Bước 1 — Clone dự án

```bash
git clone <repository-url>
cd AI-Video-TransStudio
```

### Bước 2 — Cấu hình Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ai-transstudio?retryWrites=true&w=majority
NODE_ENV=development
MAX_FILE_SIZE=500
UPLOAD_PATH=./uploads
```

> 💡 **Lấy MongoDB URI:** Vào [MongoDB Atlas](https://cloud.mongodb.com) → Cluster → Connect → Drivers → Node.js → Copy connection string

### Bước 3 — Cấu hình Frontend

```bash
cd frontend
npm install
```

Tạo file `.env.local` trong thư mục `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Bước 4 — Chạy dự án

Mở **2 terminal riêng biệt**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
✅ Thành công khi thấy:
```
🚀 Server đang chạy tại http://localhost:5000
✅ MongoDB Connected: <host>
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
✅ Thành công khi thấy:
```
▲ Next.js 16
- Local: http://localhost:3000
```

### Bước 5 — Mở trình duyệt

Truy cập **http://localhost:3000** 🎉

---

## 📁 Cấu trúc thư mục

```
AI-Video-TransStudio/
│
├── frontend/                   # Next.js 16 App
│   ├── src/
│   │   ├── app/                        # Next.js App Router (định nghĩa URL)
│   │   │   ├── page.tsx                # Trang chủ (Hero + Features)
│   │   │   ├── upload/page.tsx         # Trang upload video (drag & drop)
│   │   │   ├── library/page.tsx        # Thư viện video
│   │   │   ├── watch/[id]/page.tsx     # Trình phát video
│   │   │   ├── layout.tsx              # Root layout + SEO
│   │   │   └── globals.css             # Design system (dark theme)
│   │   │
│   │   ├── components/                 # React Components tái dùng
│   │   │   ├── Navbar.tsx
│   │   │   ├── ui/                     # Atomic UI components
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   ├── StatusBadge.tsx
│   │   │   │   └── EmptyState.tsx
│   │   │   ├── video/                  # Video player components
│   │   │   │   ├── VideoPlayer.tsx
│   │   │   │   ├── PlayerControls.tsx
│   │   │   │   ├── SubtitleOverlay.tsx
│   │   │   │   └── ProcessingBadge.tsx
│   │   │   ├── watch/                  # Panels bên dưới player
│   │   │   │   ├── VideoInfoPanel.tsx
│   │   │   │   ├── SubtitleDownloads.tsx
│   │   │   │   └── AiPanel.tsx
│   │   │   ├── library/                # Library page components
│   │   │   │   ├── VideoCard.tsx
│   │   │   │   ├── VideoGrid.tsx
│   │   │   │   └── LibraryHeader.tsx
│   │   │   └── upload/                 # Upload page components
│   │   │       ├── DropZone.tsx
│   │   │       ├── TitleInput.tsx
│   │   │       ├── ProgressBar.tsx
│   │   │       └── UploadSuccess.tsx
│   │   │
│   │   ├── hooks/                      # Custom React Hooks
│   │   │   ├── useVideoPlayer.ts       # Player state & controls
│   │   │   ├── useSubtitles.ts         # SRT loading & parsing
│   │   │   └── useVideoPolling.ts      # AI transcription & polling
│   │   │
│   │   ├── lib/                        # Shared utilities
│   │   │   ├── api.ts                  # API_URL + tất cả endpoints
│   │   │   └── homeData.ts             # Data tĩnh trang chủ
│   │   │
│   │   └── types/
│   │       └── video.ts                # TypeScript interfaces chung
│   │
│   └── .env.local                      # ← Tạo file này (xem Bước 3)
│
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── server.js               # Entry point
│   │   ├── config/
│   │   │   └── db.js               # Kết nối MongoDB
│   │   ├── models/
│   │   │   └── Video.js            # Schema MongoDB
│   │   ├── controllers/
│   │   │   └── videoController.js  # Logic xử lý video
│   │   ├── routes/
│   │   │   └── videoRoutes.js      # API routes
│   │   ├── services/               # FFmpeg, Gemini AI logic
│   │   └── middleware/
│   │       └── upload.js           # Multer (xử lý upload file)
│   ├── uploads/                    # Thư mục lưu video (tự tạo)
│   └── .env                        # ← Tạo file này (xem Bước 2)
│
├── .gitignore
└── README.md
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/health` | Kiểm tra server hoạt động |
| `POST` | `/videos/upload` | Upload video mới |
| `GET` | `/videos` | Lấy danh sách video (có phân trang) |
| `GET` | `/videos/:id` | Lấy chi tiết 1 video |
| `GET` | `/videos/:id/stream` | Stream video (hỗ trợ Range Requests) |
| `DELETE` | `/videos/:id` | Xóa video |

**Upload video:**
```bash
curl -X POST http://localhost:5000/api/videos/upload \
  -F "video=@/path/to/video.mp4" \
  -F "title=Tên video"
```

**Lấy danh sách video:**
```bash
curl http://localhost:5000/api/videos?page=1&limit=12
```

---

## 🔧 Scripts

| Lệnh | Thư mục | Mô tả |
|---|---|---|
| `npm run dev` | `backend/` | Chạy backend (nodemon) |
| `npm start` | `backend/` | Chạy backend (production) |
| `npm run dev` | `frontend/` | Chạy frontend dev server |
| `npm run build` | `frontend/` | Build production |

---

## 📄 License

MIT © 2025 AI Video TransStudio
