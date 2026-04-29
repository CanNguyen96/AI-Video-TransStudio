const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadVideo,
  getVideos,
  getVideoById,
  deleteVideo,
  streamVideo,
} = require('../controllers/videoController');
const {
  transcribeVideo,
  getSubtitle,
  downloadSubtitle,
  downloadBurnedVideo,
} = require('../controllers/transcribeController');

// GET  /api/videos          — Danh sách video
router.get('/', getVideos);

// POST /api/videos/upload   — Upload video mới
router.post('/upload', upload.single('video'), uploadVideo);

// GET  /api/videos/:id      — Chi tiết 1 video
router.get('/:id', getVideoById);

// GET  /api/videos/:id/stream — Stream video (hỗ trợ tua)
router.get('/:id/stream', streamVideo);

// DELETE /api/videos/:id    — Xóa video
router.delete('/:id', deleteVideo);

// POST   /api/videos/:id/transcribe         — Trigger pipeline FFmpeg → Gemini → .srt
router.post('/:id/transcribe', transcribeVideo);

// GET    /api/videos/:id/subtitles/:lang     — Lấy nội dung SRT (stream)
router.get('/:id/subtitles/:lang', getSubtitle);

// GET    /api/videos/:id/subtitles/:lang/download — Tải xuống SRT
router.get('/:id/subtitles/:lang/download', downloadSubtitle);

// GET    /api/videos/:id/download-burned?lang=... — Download video đã burn subtitle
router.get('/:id/download-burned', downloadBurnedVideo);


module.exports = router;
