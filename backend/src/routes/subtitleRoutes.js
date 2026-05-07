/**
 * Routes liên quan đến AI transcription, SRT, và download — protected by JWT
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const { transcribeVideo } = require('../controllers/transcribeController');
const { getSubtitle, downloadSubtitle, downloadBurnedVideo } = require('../controllers/subtitleController');

// POST /api/videos/:id/transcribe — Trigger AI pipeline
router.post('/:id/transcribe', protect, transcribeVideo);

// GET  /api/videos/:id/subtitles/:lang — Lấy nội dung SRT (stream)
router.get('/:id/subtitles/:lang', protect, getSubtitle);

// GET  /api/videos/:id/subtitles/:lang/download — Tải xuống SRT
router.get('/:id/subtitles/:lang/download', protect, downloadSubtitle);

// GET  /api/videos/:id/download-burned?lang=... — Download video đã burn subtitle
router.get('/:id/download-burned', protect, downloadBurnedVideo);

module.exports = router;
