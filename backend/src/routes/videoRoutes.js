/**
 * CRUD + stream + thumbnail routes
 */
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadVideo,
  getVideos,
  getVideoById,
  deleteVideo,
  streamVideo,
  getThumbnail,
} = require('../controllers/videoController');

// GET    /api/videos          — Danh sách video (có phân trang)
router.get('/', getVideos);

// POST   /api/videos/upload   — Upload video mới
router.post('/upload', upload.single('video'), uploadVideo);

// GET    /api/videos/:id      — Chi tiết 1 video
router.get('/:id', getVideoById);

// GET    /api/videos/:id/stream    — Stream video (hỗ trợ tua)
router.get('/:id/stream', streamVideo);

// GET    /api/videos/:id/thumbnail — Lấy thumbnail ảnh
router.get('/:id/thumbnail', getThumbnail);

// DELETE /api/videos/:id      — Xóa video
router.delete('/:id', deleteVideo);

module.exports = router;
