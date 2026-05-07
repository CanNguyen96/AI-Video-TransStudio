/**
 * Routes liên quan đến AI transcription, SRT, và download
 */
const express = require('express');
const router = express.Router();

const { transcribeVideo } = require('../controllers/transcribeController');
const { getSubtitle, downloadSubtitle, downloadBurnedVideo } = require('../controllers/subtitleController');

// POST /api/videos/:id/transcribe — Trigger AI pipeline
router.post('/:id/transcribe', transcribeVideo);

// GET  /api/videos/:id/subtitles/:lang — Lấy nội dung SRT (stream)
router.get('/:id/subtitles/:lang', getSubtitle);

// GET  /api/videos/:id/subtitles/:lang/download — Tải xuống SRT
router.get('/:id/subtitles/:lang/download', downloadSubtitle);

// GET  /api/videos/:id/download-burned?lang=... — Download video đã burn subtitle
router.get('/:id/download-burned', downloadBurnedVideo);

module.exports = router;
