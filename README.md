# 🎬 AI Video TransStudio

> **Studio dịch video thông minh bằng AI** — Upload video, AI tự động tạo phụ đề, dịch thuật và xuất file SRT.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)
![Gemini](https://img.shields.io/badge/AI-Gemini-blue?logo=google)

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

| Tính năng | Trạng thái |
|---|---|
| Đăng ký / Đăng nhập (JWT) | ✅ Hoàn thành |
| Upload video (kéo thả, tối đa 500MB) | ✅ Hoàn thành |
| Trình phát video HTML5 tùy chỉnh | ✅ Hoàn thành |
| Thư viện quản lý video cá nhân | ✅ Hoàn thành |
| Stream video với hỗ trợ tua (Range Requests) | ✅ Hoàn thành |
| Thumbnail tự động (FFmpeg) | ✅ Hoàn thành |
| AI tạo phụ đề tự động (Gemini API) | ✅ Hoàn thành |
| Double Subtitle (gốc + tiếng Việt song ngữ) | ✅ Hoàn thành |
| Tải file phụ đề (.srt) | ✅ Hoàn thành |
| Tải video đã burn phụ đề (FFmpeg) | ✅ Hoàn thành |
| In-memory Queue giới hạn concurrency AI | ✅ Hoàn thành |
| Chỉnh sửa phụ đề trực tiếp | 🔜 Sắp có |
| AI Dubbing (lồng tiếng tự động) | 🔜 Sắp có |

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

**Quy trình xử lý video:**
```
Upload → FFmpeg tách Audio → Gemini AI → Text + Timestamp → File .SRT → Hiển thị phụ đề
```

**Bảo mật:**
```
Client gửi JWT → authMiddleware verify → Controller truy vấn theo owner → Trả data đúng user
```

---

## 🛠 Yêu cầu cài đặt

| Công cụ | Version | Link |
|---|---|---|
| **Node.js** | >= 18.x | [nodejs.org](https://nodejs.org) |
| **npm** | >= 9.x | Đi kèm Node.js |
| **MongoDB Atlas** | Cloud | [mongodb.com/atlas](https://mongodb.com/atlas) (Free tier) |
| **FFmpeg** | Latest | [ffmpeg.org](https://ffmpeg.org) |

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
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ai-transstudio
NODE_ENV=development
MAX_FILE_SIZE=500
UPLOAD_PATH=./uploads
GEMINI_API_KEY=<your-gemini-api-key>
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=7d
```

> 💡 **Lấy MongoDB URI:** Vào [MongoDB Atlas](https://cloud.mongodb.com) → Cluster → Connect → Drivers → Node.js → Copy connection string
>
> 💡 **Lấy Gemini API Key:** Vào [Google AI Studio](https://aistudio.google.com) → Get API Key

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

Truy cập **http://localhost:3000** → Đăng ký tài khoản → Bắt đầu dùng 🎉

---

## 📁 Cấu trúc thư mục

```
AI-Video-TransStudio/
│
├── frontend/                       # Next.js 16 App
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── page.tsx            # Trang chủ
│   │   │   ├── auth/page.tsx       # Đăng nhập / Đăng ký
│   │   │   ├── upload/page.tsx     # Upload video (drag & drop)
│   │   │   ├── library/page.tsx    # Thư viện video cá nhân
│   │   │   ├── watch/[id]/page.tsx # Trình phát video
│   │   │   ├── layout.tsx          # Root layout + SEO
│   │   │   └── globals.css         # Design system (dark theme)
│   │   │
│   │   ├── components/             # React Components
│   │   │   ├── Navbar.tsx
│   │   │   ├── ui/                 # Atomic UI (LoadingSpinner, StatusBadge, EmptyState)
│   │   │   ├── video/              # VideoPlayer, PlayerControls, SubtitleOverlay
│   │   │   ├── watch/              # VideoInfoPanel, SubtitleDownloads, AiPanel
│   │   │   ├── library/            # VideoCard, VideoGrid, LibraryHeader
│   │   │   └── upload/             # DropZone, TitleInput, ProgressBar
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Global auth state (JWT localStorage)
│   │   │
│   │   ├── hooks/                  # Custom React Hooks
│   │   │   ├── useVideoPlayer.ts   # Player state & controls
│   │   │   ├── useSubtitles.ts     # SRT loading & parsing
│   │   │   ├── useVideoPolling.ts  # AI transcription & polling
│   │   │   └── useApiAuth.ts       # Fetch wrapper với Authorization header
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts              # API_URL + tất cả endpoints
│   │   │   └── homeData.ts         # Data tĩnh trang chủ
│   │   │
│   │   └── types/
│   │       └── video.ts            # TypeScript interfaces
│   │
│   └── .env.local                  # ← Tạo file này (xem Bước 3)
│
├── backend/                        # Node.js Express API
│   ├── src/
│   │   ├── server.js               # Entry point
│   │   ├── config/
│   │   │   ├── db.js               # Kết nối MongoDB
│   │   │   └── paths.js            # Centralized path config
│   │   ├── models/
│   │   │   ├── User.js             # Schema User (auth)
│   │   │   └── Video.js            # Schema Video
│   │   ├── controllers/
│   │   │   ├── authController.js   # Register, Login, GetMe
│   │   │   ├── videoController.js  # CRUD + Stream + Thumbnail
│   │   │   ├── transcribeController.js  # AI pipeline
│   │   │   └── subtitleController.js    # SRT & Burn download
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js   # JWT protect & optionalAuth
│   │   │   ├── upload.js           # Multer
│   │   │   └── errorHandler.js     # Global error handler
│   │   ├── routes/
│   │   │   ├── authRoutes.js       # /api/auth
│   │   │   ├── videoRoutes.js      # /api/videos
│   │   │   └── subtitleRoutes.js   # /api/videos/:id/...
│   │   └── services/
│   │       ├── ffmpeg/             # audio, metadata, burn, thumbnail
│   │       ├── geminiService.js    # Gemini AI integration
│   │       ├── subtitleService.js  # SRT builder
│   │       └── transcribeQueue.js  # In-memory job queue (max 2 concurrent)
│   ├── uploads/                    # Thư mục lưu video (tự tạo)
│   └── .env                        # ← Tạo file này (xem Bước 2)
│
├── .gitignore
└── README.md
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

> 🔒 Tất cả endpoints (trừ Auth) yêu cầu header: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/auth/register` | Đăng ký tài khoản mới |
| `POST` | `/auth/login` | Đăng nhập, nhận JWT |
| `GET` | `/auth/me` | Lấy thông tin user đang đăng nhập |

### Video

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/videos` | Danh sách video của user (phân trang) |
| `POST` | `/videos/upload` | Upload video mới |
| `GET` | `/videos/:id` | Chi tiết 1 video |
| `GET` | `/videos/:id/stream` | Stream video (Range Requests) |
| `GET` | `/videos/:id/thumbnail` | Lấy ảnh thumbnail |
| `DELETE` | `/videos/:id` | Xóa video |

### Subtitle & AI

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/videos/:id/transcribe` | Kích hoạt AI tạo phụ đề |
| `GET` | `/videos/:id/subtitles/:lang` | Lấy nội dung SRT |
| `GET` | `/videos/:id/subtitles/:lang/download` | Tải file SRT |
| `GET` | `/videos/:id/download-burned` | Tải video đã burn phụ đề |

**Ví dụ đăng nhập:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

**Upload video (kèm token):**
```bash
curl -X POST http://localhost:5000/api/videos/upload \
  -H "Authorization: Bearer <token>" \
  -F "video=@/path/to/video.mp4" \
  -F "title=Tên video"
```

---

## 🔧 Scripts

| Lệnh | Thư mục | Mô tả |
|---|---|---|
| `npm run dev` | `backend/` | Chạy backend (nodemon, hot-reload) |
| `npm start` | `backend/` | Chạy backend (production) |
| `npm run dev` | `frontend/` | Chạy frontend dev server |
| `npm run build` | `frontend/` | Build production bundle |

---

## 📄 License

MIT © 2025 AI Video TransStudio
