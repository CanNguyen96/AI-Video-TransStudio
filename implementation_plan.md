# 🎬 AI Video TransStudio — Kế hoạch xây dựng

## Tổng quan

Bạn sẽ xây dựng một **Website "Studio"** cho phép người dùng upload video lên, AI sẽ tự động tạo phụ đề dịch và lồng tiếng. Đây là project "flagship" cho CV Fullstack của bạn.

---

## 🗺️ Bức tranh toàn cảnh

```
[Người dùng] 
    → Upload video lên Website
    → Backend dùng FFmpeg tách âm thanh
    → Gửi audio lên Gemini AI → nhận text + timestamp
    → Tạo file phụ đề (.srt)
    → Hiển thị video + phụ đề dịch cho người dùng xem
    → (Nâng cao) Lồng giọng đọc vào video
```

---

## 🧱 Tech Stack (Công nghệ sử dụng)

| Tầng | Công nghệ | Dùng để làm gì |
|---|---|---|
| **Frontend** | Next.js + Tailwind CSS | Giao diện người dùng |
| **Backend** | Node.js (Express) | Xử lý logic, gọi AI |
| **Database** | MongoDB | Lưu thông tin video, phụ đề |
| **Xử lý Video** | FFmpeg | Tách audio từ video |
| **AI** | Gemini API | Chuyển giọng nói → văn bản, dịch thuật |
| **Lưu trữ file** | Cloudinary hoặc Local | Lưu video upload lên |
| **Deploy** | Vercel (FE) + Render (BE) | Đưa lên internet |

---

## 📅 Lộ trình 5 Giai đoạn

### ✅ Giai đoạn 1 — Nền tảng (1-2 tuần)
**Mục tiêu:** Upload video lên và xem được.

**Việc cần làm:**
- [ ] Thiết kế giao diện: trang chủ, trang upload (kéo thả file)
- [ ] Backend: nhận file video từ frontend → lưu vào server/Cloudinary
- [ ] Hiển thị video vừa upload lên trình phát HTML5
- [ ] Lưu metadata video vào MongoDB (tên file, thời lượng, ngày upload)

**Kết quả đầu ra:** Upload video → xem được video trên web ✔️

---

### ✅ Giai đoạn 2 — AI Core (2-3 tuần)
**Mục tiêu:** Video → Phụ đề dịch tự động.

**Việc cần làm:**
- [ ] Dùng FFmpeg tách audio (.mp3) từ video đã upload
- [ ] Gửi audio lên Gemini API → nhận về text + timestamp (mốc thời gian)
- [ ] Backend chuyển kết quả thành file `.srt` (định dạng phụ đề chuẩn)
- [ ] Lưu file `.srt` và liên kết với video trong MongoDB
- [ ] Hiển thị trạng thái xử lý (Processing... → Done)

**Kết quả đầu ra:** Bấm "Tạo phụ đề" → sau vài phút có file .srt ✔️

---

### ✅ Giai đoạn 3 — Trình phát thông minh (1-2 tuần)
**Mục tiêu:** Xem video kèm phụ đề dịch đè lên màn hình.

**Việc cần làm:**
- [ ] Đọc file `.srt` và khớp với thời gian video đang chạy
- [ ] Hiển thị phụ đề dịch đè lên video (overlay)
- [ ] **Double Subtitle:** Hiện cả tiếng gốc (trên) + tiếng Việt dịch (dưới)
- [ ] Cho phép người dùng chỉnh sửa phụ đề nếu AI dịch sai
- [ ] Nút tải xuống file `.srt`

**Kết quả đầu ra:** Video phát kèm phụ đề 2 ngôn ngữ, chỉnh sửa được ✔️

> 💡 **Đây là điểm dừng tối thiểu để đưa vào CV** — project đã hoàn chỉnh và deploy được.

---

### 🚀 Giai đoạn 4 — Tính năng Pro (2-3 tuần)
**Mục tiêu:** Biến project từ "bài tập" thành "sản phẩm thực tế".

**Việc cần làm:**
- [ ] **Queue Processing:** Hàng đợi xử lý video (dùng Bull + Redis) — tránh sập server khi có nhiều người dùng cùng lúc
- [ ] **Tiền xử lý ảnh:** Lọc nhiễu/cân bằng sáng audio trước khi gửi AI → tăng độ chính xác (tận dụng kiến thức xử lý ảnh của bạn!)
- [ ] **AI Dubbing:** Dùng Text-to-Speech API đọc bản dịch → trộn vào video gốc (FFmpeg)
- [ ] **Lịch sử:** Trang quản lý danh sách video đã upload + phụ đề đã tạo

**Kết quả đầu ra:** Hệ thống ổn định, có tính năng "wow" ✔️

---

### 🏁 Giai đoạn 5 — Đóng gói CV (1 tuần)
**Mục tiêu:** Project sẵn sàng để nhà tuyển dụng xem.

**Việc cần làm:**
- [ ] **Docker:** Viết `Dockerfile` + `docker-compose.yml` → chạy 1 lệnh là xong
- [ ] **README:** Viết README đẹp với GIF demo, sơ đồ kiến trúc hệ thống
- [ ] **Deploy:** Frontend lên Vercel, Backend lên Render/Railway
- [ ] **Demo video:** Quay video 2-3 phút demo đầy đủ tính năng

**Kết quả đầu ra:** Link GitHub + Link demo online sẵn sàng ghi vào CV ✔️

---

## 🎯 Thứ tự ưu tiên thực tế

```
Giai đoạn 1 → 2 → 3 → DEPLOY → 5 (README/Docker)
                              ↓
                    (Nếu còn thời gian)
                         Giai đoạn 4
```

> [!IMPORTANT]
> **Deploy sau Giai đoạn 3** — Nhà tuyển dụng cần thấy link demo chạy được NGAY. Đừng chờ hoàn thiện 100% mới deploy.

---

## 📁 Cấu trúc thư mục đề xuất

```
AI-Video-TransStudio/
├── frontend/          ← Next.js app
│   ├── pages/
│   ├── components/
│   └── styles/
├── backend/           ← Node.js Express
│   ├── routes/
│   ├── controllers/
│   ├── models/        ← MongoDB schemas
│   ├── services/      ← FFmpeg, Gemini AI logic
│   └── queues/        ← Bull queue (Giai đoạn 4)
├── docker-compose.yml
└── README.md
```

---

## 💼 Điểm nổi bật ghi vào CV

1. **"Xây dựng pipeline xử lý video end-to-end"** — Upload → FFmpeg → Gemini AI → .srt → Render phụ đề
2. **"Tích hợp Gemini AI API"** — Không chỉ gọi API mà xử lý output thành định dạng chuẩn (.srt)
3. **"Queue Processing với Bull/Redis"** — Xử lý bất đồng bộ, tránh bottleneck
4. **"Ứng dụng xử lý ảnh/âm thanh vào tiền xử lý AI"** — Điểm rất độc đáo, ít ai có
5. **"Dockerize + CI/CD ready"** — Tư duy DevOps, production-minded

---

## ⏱️ Tổng thời gian ước tính

| Mục tiêu | Thời gian |
|---|---|
| MVP (Giai đoạn 1-3) | ~5-7 tuần |
| Deploy + README | +1 tuần |
| Tính năng Pro (Giai đoạn 4) | +2-3 tuần thêm |
| **Tổng (CV-ready tối thiểu)** | **~6-8 tuần** |
