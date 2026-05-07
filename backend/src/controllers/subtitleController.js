/**
 * Xử lý các request liên quan đến file subtitle và download video đã burn.
 */
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const { detectSubtitleStreams } = require('../services/ffmpeg/metadataService');
const { burnSubtitles, burnSubtitlesRemovingSoft, burnSubtitlesCoveringHardcoded } = require('../services/ffmpeg/burnService');
const { BURNED_DIR } = require('../config/paths');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Tìm subtitle theo lang trong video document */
const findSubtitle = (video, lang) =>
  video.subtitles.find((s) => s.language === lang || s.language === lang.toLowerCase());

/** Kiểm tra file SRT tồn tại trên disk */
const srtExists = (subtitle) =>
  subtitle?.srtPath && fs.existsSync(subtitle.srtPath);

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc  Lấy nội dung file SRT để stream về frontend
 * @route GET /api/videos/:id/subtitles/:lang
 */
const getSubtitle = async (req, res) => {
  try {
    const { id, lang } = req.params;
    const video = await Video.findById(id);

    if (!video) return res.status(404).json({ success: false, message: 'Video không tồn tại' });

    const subtitle = findSubtitle(video, lang);
    if (!srtExists(subtitle)) {
      return res.status(404).json({ success: false, message: `Không có phụ đề ngôn ngữ: ${lang}` });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(subtitle.srtPath)}"`);
    fs.createReadStream(subtitle.srtPath).pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc  Download file SRT
 * @route GET /api/videos/:id/subtitles/:lang/download
 */
const downloadSubtitle = async (req, res) => {
  try {
    const { id, lang } = req.params;
    const video = await Video.findById(id);

    if (!video) return res.status(404).json({ success: false, message: 'Video không tồn tại' });

    const subtitle = findSubtitle(video, lang);
    if (!srtExists(subtitle)) {
      return res.status(404).json({ success: false, message: 'File SRT không tồn tại' });
    }

    res.download(subtitle.srtPath);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc  Download video đã burn subtitle vào
 * @route GET /api/videos/:id/download-burned?lang=vietnamese&coverRatio=0.15
 */
const downloadBurnedVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.query.lang || 'vietnamese';
    const coverRatio = parseFloat(req.query.coverRatio) || 0.15;

    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ success: false, message: 'Video không tồn tại' });

    const subtitle = findSubtitle(video, lang);
    if (!srtExists(subtitle)) {
      return res.status(404).json({ success: false, message: `Không tìm thấy SRT: ${lang}` });
    }

    const videoFilePath = path.resolve(video.filePath);
    if (!fs.existsSync(videoFilePath)) {
      return res.status(404).json({ success: false, message: 'File video gốc không tồn tại' });
    }

    // Tạo thư mục output
    if (!fs.existsSync(BURNED_DIR)) fs.mkdirSync(BURNED_DIR, { recursive: true });

    const baseName = path.parse(video.fileName).name;
    const outputPath = path.join(BURNED_DIR, `${baseName}.${lang}.burned.mp4`);
    const srtPath = path.resolve(subtitle.srtPath);

    // Detect loại subtitle để chọn burn mode
    console.log('\n🔍 Phát hiện loại subtitle trong video gốc...');
    const { hasSoftSubtitle } = await detectSubtitleStreams(videoFilePath);

    let burnMode;
    if (hasSoftSubtitle) {
      burnMode = 'soft';
      console.log('   → Chế độ: SOFT SUBTITLE → Xóa và thay thế');
    } else if (video.hasHardcodedSubtitle) {
      burnMode = 'hardcoded';
      console.log('   → Chế độ: HARDCODED SUBTITLE → Che và thay thế');
    } else {
      burnMode = 'clean';
      console.log('   → Chế độ: CLEAN VIDEO → Burn trực tiếp');
    }

    // Burn theo mode
    if (burnMode === 'soft') {
      await burnSubtitlesRemovingSoft(videoFilePath, srtPath, outputPath);
    } else if (burnMode === 'hardcoded') {
      await burnSubtitlesCoveringHardcoded(videoFilePath, srtPath, outputPath, coverRatio);
    } else {
      await burnSubtitles(videoFilePath, srtPath, outputPath);
    }

    // Stream file về client
    const downloadName = `${video.title}_${lang}_subtitled.mp4`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('X-Burn-Mode', burnMode);

    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => {
      try { fs.unlinkSync(outputPath); } catch (_) { }
    });
  } catch (err) {
    console.error('❌ downloadBurnedVideo lỗi:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = { getSubtitle, downloadSubtitle, downloadBurnedVideo };
