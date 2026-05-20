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
- [Các Lệnh CLI Hữu Ích](#-các-lệnh-cli-hữu-ích)

---

## ✨ Tính năng

| Tính năng | Trạng thái | Chi tiết kỹ thuật |
|---|---|---|
| **Đăng ký / Đăng nhập (JWT)** | ✅ Hoàn thành | Mã hóa mật khẩu bằng bcrypt, xác thực stateless qua JWT. Hỗ trợ xem thông tin profile cá nhân. |
| **Upload video (tối đa 500MB)** | ✅ Hoàn thành | Giao diện kéo thả hiện đại. Nhận dạng đuôi `.mkv` và các định dạng video khác trên Windows Chrome/Edge bằng cách tự động fallback kiểm tra file extension khi MIME-type trả về rỗng. |
| **Trình phát video HTML5 tùy chỉnh** | ✅ Hoàn thành | Custom controls đẹp mắt với hiệu ứng glassmorphism, hỗ trợ phím tắt điều khiển và chuyển đổi nhanh giữa các track phụ đề (Tiếng Việt / Song ngữ / Tắt). |
| **Thư viện quản lý video** | ✅ Hoàn thành | Liệt kê danh sách video của riêng từng user (đảm bảo bảo mật chéo), phân trang và theo dõi trạng thái biên dịch AI thời gian thực thông qua cơ chế polling. |
| **Stream video tua nhanh** | ✅ Hoàn thành | Cấu hình HTTP Range Requests ở Backend giúp tối ưu hóa băng thông, tải video nhanh và hỗ trợ tua (seek) mượt mà trên Chrome, Safari, Edge. |
| **Tạo Thumbnail tự động** | ✅ Hoàn thành | Tự động sử dụng FFmpeg trích xuất hình ảnh đầu tiên của video để làm ảnh thumbnail hiển thị trong danh sách thư viện. |
| **AI tạo phụ đề & Dịch thuật** | ✅ Hoàn thành | Sử dụng **Gemini API** (`gemini-2.0-flash`, `gemini-2.5-flash`...). Tự động chia nhỏ âm thanh thành các đoạn 60 giây (1 phút) trước khi gửi qua API để tăng độ chính xác của timestamp, tránh lệch chữ và mất phụ đề nửa sau của video. |
| **Double Subtitle (Song ngữ)** | ✅ Hoàn thành | Tự động tạo song song hai track phụ đề: Phụ đề dịch thuần tiếng Việt (`vi`) và phụ đề song ngữ (`bilingual` - hiển thị tiếng Trung/Anh gốc ở trên và tiếng Việt ở dưới). |
| **Tải file phụ đề (.srt)** | ✅ Hoàn thành | Tạo và tải xuống file SRT chuẩn hóa định dạng, tự động xử lý các segment bị đè thời gian hoặc kéo quá dài để hiển thị tối ưu nhất. |
| **Tải video đã burn phụ đề** | ✅ Hoàn thành | Sử dụng FFmpeg để hardcode phụ đề trực tiếp vào video. Tích hợp **3 chế độ tự động phát hiện**: **Clean** (video sạch), **Soft** (loại bỏ track soft-sub cũ trước khi burn), và **Hardcoded** (che đè phụ đề cứng cũ bằng thanh đen mờ với tỉ lệ tùy biến `coverRatio` trước khi chèn phụ đề mới). |
| **In-memory Queue** | ✅ Hoàn thành | Hàng đợi xử lý tác vụ nền AI giới hạn tối đa 2 tác vụ chạy song song để đảm bảo hiệu suất server và tránh bị dính rate-limit của Gemini API key. |
| **Khôi phục video bị kẹt** | ✅ Hoàn thành | Tự động quét và chuyển đổi trạng thái của các video bị kẹt ở trạng thái `processing` sang `error` khi khởi động lại server để tránh bị khóa vĩnh viễn dữ liệu. |
| **Chỉnh sửa phụ đề trực tiếp** | 🔜 Sắp có | Giao diện chỉnh sửa nội dung và mốc thời gian phụ đề trực tiếp trên web. |
| **AI Dubbing (Lồng tiếng)** | 🔜 Sắp có | Dịch thuật và lồng tiếng tự động vào video bằng công nghệ Text-to-Speech (TTS). |

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
1. **Upload Video:** User upload video -> Lưu vào thư mục `uploads/` trên Disk.
2. **FFmpeg Pipeline:** Backend dùng FFmpeg lấy metadata (width, height, duration), trích xuất ảnh thumbnail và tách file âm thanh `.mp3` chất lượng 64kbps mono.
3. **AI Split & Transcribe:** Chia nhỏ âm thanh thành các đoạn 60s -> Gửi tuần tự qua Gemini API -> Nhận kết quả JSON chứa các segment thoại với thông tin `start`, `end`, `original`, `translated`.
4. **Stitch & Build SRT:** Ghép các đoạn nhỏ lại, cộng dồn offset thời gian -> Tạo ra 2 file phụ đề SRT (`vi` và `bilingual`).
5. **MongoDB Update:** Lưu dữ liệu hoàn chỉnh, cập nhật trạng thái `completed`.

---

## 🛠 Yêu cầu cài đặt

| Công cụ | Phiên bản | Link |
|---|---|---|
| **Node.js** | >= 18.x | [nodejs.org](https://nodejs.org) |
| **npm** | >= 9.x | Đi kèm Node.js |
| **MongoDB Atlas** | Cloud | [mongodb.com/atlas](https://mongodb.com/atlas) (Free tier) |
| **FFmpeg** | Mới nhất | [ffmpeg.org](https://ffmpeg.org) |

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
cd ../frontend
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
│   │   │   ├── page.tsx            # Trang chủ giới thiệu
│   │   │   ├── auth/page.tsx       # Đăng nhập / Đăng ký
│   │   │   ├── upload/page.tsx     # Upload video (đáp ứng kéo thả & check đuôi file)
│   │   │   ├── library/page.tsx    # Thư viện video cá nhân
│   │   │   ├── watch/[id]/page.tsx # Trình phát video custom và các nút chức năng
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
│   │   │   ├── useVideoPlayer.ts   # Quản lý trạng thái & phím tắt của player
│   │   │   ├── useSubtitles.ts     # Load srt và parse thành định dạng hiển thị
│   │   │   ├── useVideoPolling.ts  # Theo dõi tiến độ dịch thuật của AI
│   │   │   └── useApiAuth.ts       # Wrapper fetch API kèm token Authorization
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts              # Cấu hình API_URL và gom nhóm các endpoint endpoint
│   │   │   └── homeData.ts         # Dữ liệu hiển thị trang landing page
│   │   │
│   │   └── types/
│   │       └── video.ts            # Định nghĩa các kiểu dữ liệu TypeScript
│   │
│   └── .env.local                  # ← File cấu hình biến môi trường Frontend
│
├── backend/                        # Node.js Express API
│   ├── src/
│   │   ├── server.js               # Khởi động server (bao gồm quét & reset video bị kẹt)
│   │   ├── config/
│   │   │   ├── db.js               # Kết nối CSDL MongoDB
│   │   │   └── paths.js            # Gom quản lý các thư mục lưu tạm trên server
│   │   ├── models/
│   │   │   ├── User.js             # Mongoose Model chứa thông tin người dùng
│   │   │   └── Video.js            # Mongoose Model chứa video và các segment dịch thuật
│   │   ├── controllers/
│   │   │   ├── authController.js   # Đăng ký, Đăng nhập, Profile cá nhân
│   │   │   ├── videoController.js  # CRUD video, stream hỗ trợ Range, trích xuất ảnh
│   │   │   ├── transcribeController.js  # Trình tự tách nhạc, đẩy AI dịch, lưu file SRT
│   │   │   └── subtitleController.js    # Tải file SRT và burn phụ đề vào video bằng FFmpeg
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js   # Middleware JWT xác thực người dùng bảo mật
│   │   │   ├── upload.js           # Quản lý upload file bằng Multer
│   │   │   └── errorHandler.js     # Bắt lỗi toàn cục của server
│   │   ├── routes/
│   │   │   ├── authRoutes.js       # /api/auth
│   │   │   ├── videoRoutes.js      # /api/videos
│   │   │   └── subtitleRoutes.js   # /api/videos/:id/...
│   │   └── services/
│   │       ├── ffmpeg/             # Các dịch vụ xử lý âm thanh, thumbnail, burn phụ đề
│   │       ├── geminiService.js    # Kết nối Gemini API, xử lý chia nhỏ segment 60s
│   │       ├── subtitleService.js  # Xử lý format cấu trúc file phụ đề SRT
│   │       └── transcribeQueue.js  # Hàng đợi quản lý đồng thời tác vụ AI
│   ├── uploads/                    # Thư mục chứa tệp lưu tạm (được tự động tạo ra)
│   └── .env                        # ← File cấu hình biến môi trường Backend
│
├── .gitignore
└── README.md
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

> 🔒 Tất cả endpoints (ngoại trừ Đăng nhập & Đăng ký) yêu cầu Header: `Authorization: Bearer <JWT_TOKEN>`

### 1. Xác thực (Auth)

| Method | Endpoint | Mô tả | Body / Response |
|---|---|---|---|
| `POST` | `/auth/register` | Đăng ký tài khoản | `{ email, password, name }` |
| `POST` | `/auth/login` | Đăng nhập nhận token | `{ email, password }` -> Trả về token |
| `GET` | `/auth/me` | Lấy profile hiện tại | Trả về thông tin chi tiết user |

### 2. Quản lý Video (Video)

| Method | Endpoint | Mô tả | Tham số / Body |
|---|---|---|---|
| `GET` | `/videos` | Lấy danh sách video (phân trang) | Query: `page`, `limit` |
| `POST` | `/videos/upload` | Upload video lên server | Form-data: `video` (file), `title` |
| `GET` | `/videos/:id` | Chi tiết một video | Trả về video document bao gồm trạng thái xử lý |
| `GET` | `/videos/:id/stream` | Stream video (Hỗ trợ tua Range) | Yêu cầu header `Range: bytes=...` |
| `GET` | `/videos/:id/thumbnail` | Lấy ảnh thumbnail của video | Trả về định dạng ảnh `image/jpeg` |
| `DELETE` | `/videos/:id` | Xóa video | Xóa tài liệu trong DB và dọn dẹp file trên disk |

### 3. Phụ đề & AI (Subtitles & AI)

| Method | Endpoint | Mô tả | Tham số truyền vào |
|---|---|---|---|
| `POST` | `/videos/:id/transcribe` | Bắt đầu chạy AI dịch phụ đề | Body: `{ targetLanguage: "Vietnamese" }` |
| `GET` | `/videos/:id/subtitles/:lang` | Xem nội dung phụ đề SRT | `:lang` có thể là `vietnamese` hoặc `bilingual` |
| `GET` | `/videos/:id/subtitles/:lang/download` | Tải xuống file phụ đề `.srt` | `:lang` có thể là `vietnamese` hoặc `bilingual` |
| `GET` | `/videos/:id/download-burned` | Tải video đã burn phụ đề cứng | Query: `lang` (vietnamese/bilingual), `coverRatio` (tỉ lệ che hardcoded sub, mặc định 0.15) |

---

## 🔧 Các Lệnh CLI Hữu Ích

| Lệnh | Thư mục chạy | Mô tả |
|---|---|---|
| `npm run dev` | `backend/` | Khởi chạy máy chủ Backend ở chế độ Development (Nodemon tự reload) |
| `npm start` | `backend/` | Khởi chạy máy chủ Backend ở chế độ Production |
| `npm run dev` | `frontend/` | Khởi chạy Frontend Dev Server của Next.js (Hot reload) |
| `npm run build` | `frontend/` | Biên dịch dự án Next.js thành bản build tĩnh tối ưu hóa |
| `npm start` | `frontend/` | Chạy máy chủ Next.js Production sau khi đã build |

---

## 📄 License

Bản quyền dự án thuộc về **MIT © 2026 AI Video TransStudio**.
