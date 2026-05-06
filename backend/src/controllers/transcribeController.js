const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const {
  extractAudio,
  getVideoMetadata,
  detectSubtitleStreams,
  burnSubtitles,
  burnSubtitlesRemovingSoft,
  burnSubtitlesCoveringHardcoded,
} = require('../services/ffmpegService');
const { transcribeAndTranslate } = require('../services/geminiService');
const { generateSrtContent, saveSrtFile, deleteOldSrtFiles } = require('../services/subtitleService');

// Thư mục lưu audio và subtitle tách ra từ video
const AUDIO_DIR = path.resolve('./uploads/audio');
const SUBTITLE_DIR = path.resolve('./uploads/subtitles');

/**
 * @desc  Trigger pipeline: Video → FFmpeg → Gemini → .srt → MongoDB
 * @route POST /api/videos/:id/transcribe
 * @body  { language: 'Vietnamese' }  (tuỳ chọn)
 */
const transcribeVideo = async (req, res) => {
  const { id } = req.params;
  const targetLanguage = req.body.language || 'Vietnamese';

  // 1. Tìm video trong DB
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).json({ success: false, message: 'Video không tồn tại' });
  }

  // Kiểm tra video có đang được xử lý không
  if (video.status === 'processing') {
    return res.status(409).json({
      success: false,
      message: 'Video đang được xử lý. Vui lòng chờ...',
    });
  }

  const videoFilePath = path.resolve(video.filePath);
  if (!fs.existsSync(videoFilePath)) {
    return res.status(404).json({ success: false, message: 'File video không tồn tại trên server' });
  }

  // Trả về ngay lập tức để client không bị timeout
  // Pipeline chạy bất đồng bộ ở background
  res.status(202).json({
    success: true,
    message: '🚀 Bắt đầu xử lý! Đang tách audio và gửi lên AI...',
    data: { videoId: id, status: 'processing' },
  });

  // Cập nhật status → processing, xóa dữ liệu phụ đề cũ ngay lập tức
  await Video.findByIdAndUpdate(id, {
    status: 'processing',
    subtitles: [],      // Xóa subtitles cũ → FE không hiện nút download stale
    segments: [],       // Xóa segments cũ
    errorMessage: '',   // Reset lỗi cũ
  });

  // ======= PIPELINE BẤT ĐỒNG BỘ =======
  try {
    const baseName = path.parse(video.fileName).name;

    // BƯỚC 1: Lấy metadata (duration)
    console.log('\n📊 Bước 1: Đọc metadata video...');
    let metadata = {};
    try {
      metadata = await getVideoMetadata(videoFilePath);
      console.log(`   Duration: ${metadata.duration}s | ${metadata.width}x${metadata.height}`);
      // Cập nhật duration vào DB nếu chưa có
      if (!video.duration && metadata.duration) {
        await Video.findByIdAndUpdate(id, { duration: metadata.duration });
      }
    } catch (metaErr) {
      console.warn('⚠️  Không đọc được metadata:', metaErr.message);
    }

    // BƯỚC 2: Tách audio bằng FFmpeg
    console.log('\n🎵 Bước 2: FFmpeg đang tách audio...');
    const audioPath = await extractAudio(videoFilePath, AUDIO_DIR);

    // Lưu audioPath vào DB
    await Video.findByIdAndUpdate(id, { audioPath });

    // BƯỚC 3: Gửi audio lên Gemini API
    console.log('\n🤖 Bước 3: Gửi audio lên Gemini AI...');
    const segments = await transcribeAndTranslate(audioPath, targetLanguage);

    if (segments.length === 0) {
      throw new Error('Gemini không nhận diện được giọng nói trong video này');
    }
    console.log(`   Nhận được ${segments.length} segments`);

    // BƯỚC 4: Tạo file SRT
    console.log('\n📝 Bước 4: Tạo file .srt...');

    // Xóa SRT cũ nếu có (regenerate)
    deleteOldSrtFiles(video.subtitles);

    // SRT bản dịch (chỉ tiếng Việt)
    const translatedContent = generateSrtContent(segments, false);
    const translatedSrtPath = saveSrtFile(translatedContent, SUBTITLE_DIR, baseName, 'vi');

    // SRT song ngữ (gốc + dịch)
    const bilingualContent = generateSrtContent(segments, true);
    const bilingualSrtPath = saveSrtFile(bilingualContent, SUBTITLE_DIR, baseName, 'bilingual');

    // BƯỚC 5: Cập nhật MongoDB
    console.log('\n💾 Bước 5: Lưu kết quả vào database...');
    await Video.findByIdAndUpdate(id, {
      status: 'completed',
      subtitles: [
        {
          language: targetLanguage.toLowerCase(),
          srtPath: translatedSrtPath,
          label: `Dịch ${targetLanguage}`,
        },
        {
          language: 'bilingual',
          srtPath: bilingualSrtPath,
          label: 'Song ngữ',
        },
      ],
      segments: segments, // Lưu raw segments để frontend dùng sau
    });

    console.log(`\n🎉 HOÀN THÀNH! Video "${video.title}" đã có phụ đề.`);
  } catch (err) {
    console.error('\n❌ Pipeline thất bại:', err.message);
    await Video.findByIdAndUpdate(id, {
      status: 'error',
      errorMessage: err.message,
    });
  }
};

/**
 * @desc  Lấy nội dung file SRT để stream về frontend
 * @route GET /api/videos/:id/subtitles/:lang
 */
const getSubtitle = async (req, res) => {
  try {
    const { id, lang } = req.params;
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video không tồn tại' });
    }

    const subtitle = video.subtitles.find(
      (s) => s.language === lang || s.language === lang.toLowerCase()
    );

    if (!subtitle || !subtitle.srtPath) {
      return res.status(404).json({ success: false, message: `Không có phụ đề ngôn ngữ: ${lang}` });
    }

    if (!fs.existsSync(subtitle.srtPath)) {
      return res.status(404).json({ success: false, message: 'File SRT không còn tồn tại trên server' });
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

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video không tồn tại' });
    }

    const subtitle = video.subtitles.find((s) => s.language === lang);
    if (!subtitle || !fs.existsSync(subtitle.srtPath)) {
      return res.status(404).json({ success: false, message: 'File SRT không tồn tại' });
    }

    res.download(subtitle.srtPath);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc  Download video đã burn subtitle vào
 * @route GET /api/videos/:id/download-burned?lang=vietnamese
 */
const downloadBurnedVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.query.lang || 'vietnamese';
    // coverRatio: tỉ lệ che hardcoded sub (mặc định 15%, FE có thể truyền vào)
    const coverRatio = parseFloat(req.query.coverRatio) || 0.15;

    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ success: false, message: 'Video không tồn tại' });

    const subtitle = video.subtitles.find(
      (s) => s.language === lang || s.language === lang.toLowerCase()
    );
    if (!subtitle || !subtitle.srtPath || !fs.existsSync(subtitle.srtPath)) {
      return res.status(404).json({ success: false, message: `Không tìm thấy file SRT ngôn ngữ: ${lang}` });
    }

    const videoFilePath = path.resolve(video.filePath);
    if (!fs.existsSync(videoFilePath)) {
      return res.status(404).json({ success: false, message: 'File video gốc không tồn tại' });
    }

    // Tạo file output tạm thời
    const outputDir = path.resolve('./uploads/burned');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const baseName = path.parse(video.fileName).name;
    const outputFileName = `${baseName}.${lang}.burned.mp4`;
    const outputPath = path.join(outputDir, outputFileName);
    const srtPath = path.resolve(subtitle.srtPath);

    // ====== DETECT SUBTITLE TYPE ======
    console.log('\n🔍 Phát hiện loại subtitle trong video gốc...');
    const subtitleDetect = await detectSubtitleStreams(videoFilePath);

    let burnMode;
    if (subtitleDetect.hasSoftSubtitle) {
      // Có soft subtitle track → xóa và burn mới
      burnMode = 'soft';
      console.log(`   → Chế độ: SOFT SUBTITLE (${subtitleDetect.subtitleCount} track) → Xóa và thay thế`);
    } else if (video.hasHardcodedSubtitle) {
      // Field này user/admin có thể set thủ công hoặc FE check thấy có sub burn sẵn
      burnMode = 'hardcoded';
      console.log(`   → Chế độ: HARDCODED SUBTITLE → Che và thay thế`);
    } else {
      // Không có subtitle gì → burn bình thường
      burnMode = 'clean';
      console.log('   → Chế độ: CLEAN VIDEO (không có sub cũ) → Burn trực tiếp');
    }

    // ====== CHỌN HÀM BURN PHÙ HỢP ======
    if (burnMode === 'soft') {
      await burnSubtitlesRemovingSoft(videoFilePath, srtPath, outputPath);
    } else if (burnMode === 'hardcoded') {
      await burnSubtitlesCoveringHardcoded(videoFilePath, srtPath, outputPath, coverRatio);
    } else {
      await burnSubtitles(videoFilePath, srtPath, outputPath);
    }

    // Stream file đã render về client để download
    const downloadName = `${video.title}_${lang}_subtitled.mp4`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
    res.setHeader('Content-Type', 'video/mp4');
    // Thông báo cho FE biết đã dùng chế độ nào
    res.setHeader('X-Burn-Mode', burnMode);

    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);

    // Xóa file tạm sau khi stream xong
    stream.on('end', () => {
      try { fs.unlinkSync(outputPath); } catch (_) {}
    });

  } catch (err) {
    console.error('❌ downloadBurnedVideo lỗi:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = { transcribeVideo, getSubtitle, downloadSubtitle, downloadBurnedVideo };
