/**
 * CRUD + stream + thumbnail routes — protected by JWT
 */
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadVideo,
  getVideos,
  getVideoById,
  deleteVideo,
  streamVideo,
  getThumbnail,
} = require('../controllers/videoController');

// GET    /api/videos          — Danh sách video của user đang đăng nhập
router.get('/', protect, getVideos);

// POST   /api/videos/upload   — Upload video mới
router.post('/upload', protect, upload.single('video'), uploadVideo);

// GET    /api/videos/:id      — Chi tiết 1 video
router.get('/:id', protect, getVideoById);

// GET    /api/videos/:id/stream    — Stream video (hỗ trợ tua)
router.get('/:id/stream', protect, streamVideo);

// GET    /api/videos/:id/thumbnail — Lấy thumbnail ảnh
router.get('/:id/thumbnail', protect, getThumbnail);

// DELETE /api/videos/:id      — Xóa video
router.delete('/:id', protect, deleteVideo);

module.exports = router;
