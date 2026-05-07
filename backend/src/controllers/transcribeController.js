/**
 * Orchestrate pipeline: Video → FFmpeg (audio) → Gemini AI → .srt → MongoDB
 */
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const { extractAudio } = require('../services/ffmpeg/audioService');
const { getVideoMetadata } = require('../services/ffmpeg/metadataService');
const { transcribeAndTranslate } = require('../services/geminiService');
const { generateSrtContent, saveSrtFile, deleteOldSrtFiles } = require('../services/subtitleService');
const { AUDIO_DIR, SUBTITLE_DIR } = require('../config/paths');
const { enqueue } = require('../services/transcribeQueue');

/** Xóa file audio tạm sau khi pipeline hoàn tất để giải phóng disk */
const cleanupAudio = (audioPath) => {
  if (!audioPath) return;
  try {
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
      console.log(`🗑️  Đã xóa audio tạm: ${path.basename(audioPath)}`);
    }
  } catch (e) {
    console.warn(`⚠️  Không xóa được audio tạm: ${e.message}`);
  }
};

/**
 * @desc  Trigger pipeline: Video → FFmpeg → Gemini → .srt → MongoDB
 * @route POST /api/videos/:id/transcribe
 * @body  { language: 'Vietnamese' }
 */
const transcribeVideo = async (req, res) => {
  const { id } = req.params;
  const targetLanguage = req.body.language || 'Vietnamese';

  // 1. Tìm video (phải là của chính user)
  const video = await Video.findOne({ _id: id, owner: req.user._id }).select('+filePath');
  if (!video) {
    return res.status(404).json({ success: false, message: 'Video không tồn tại' });
  }

  // 2. Kiểm tra đang xử lý chưa
  if (video.status === 'processing') {
    return res.status(409).json({
      success: false,
      message: 'Video đang được xử lý. Vui lòng chờ...',
    });
  }

  // 3. Kiểm tra file tồn tại
  const videoFilePath = path.resolve(video.filePath);
  if (!fs.existsSync(videoFilePath)) {
    return res.status(404).json({ success: false, message: 'File video không tồn tại trên server' });
  }

  // Trả về 202 ngay lập tức để client không bị timeout
  res.status(202).json({
    success: true,
    message: '🚀 Bắt đầu xử lý! Đang xếp hàng vào queue AI...',
    data: { videoId: id, status: 'processing' },
  });

  // Reset trạng thái → processing ngay lập tức
  await Video.findByIdAndUpdate(id, {
    status: 'processing',
    subtitles: [],
    segments: [],
    errorMessage: '',
  });

  // Đưa pipeline vào queue — chạy khi có slot trống (tối đa MAX_CONCURRENT)
  enqueue(id, async () => {
    let audioPath;
    try {
      const baseName = path.parse(video.fileName).name;

      // BƯỚC 1: Metadata
      console.log('\n📊 Bước 1: Đọc metadata video...');
      try {
        const metadata = await getVideoMetadata(videoFilePath);
        console.log(`   Duration: ${metadata.duration}s | ${metadata.width}x${metadata.height}`);
        if (!video.duration && metadata.duration) {
          await Video.findByIdAndUpdate(id, { duration: metadata.duration });
        }
      } catch (metaErr) {
        console.warn('⚠️  Không đọc được metadata:', metaErr.message);
      }

      // BƯỚC 2: Tách audio
      console.log('\n🎵 Bước 2: FFmpeg đang tách audio...');
      audioPath = await extractAudio(videoFilePath, AUDIO_DIR);
      await Video.findByIdAndUpdate(id, { audioPath });

      // BƯỚC 3: Gửi lên Gemini
      console.log('\n🤖 Bước 3: Gửi audio lên Gemini AI...');
      const segments = await transcribeAndTranslate(audioPath, targetLanguage);
      if (segments.length === 0) {
        throw new Error('Gemini không nhận diện được giọng nói trong video này');
      }
      console.log(`   Nhận được ${segments.length} segments`);

      // BƯỚC 4: Tạo file SRT
      console.log('\n📝 Bước 4: Tạo file .srt...');
      deleteOldSrtFiles(video.subtitles);

      const translatedSrtPath = saveSrtFile(
        generateSrtContent(segments, false), SUBTITLE_DIR, baseName, 'vi'
      );
      const bilingualSrtPath = saveSrtFile(
        generateSrtContent(segments, true), SUBTITLE_DIR, baseName, 'bilingual'
      );

      // BƯỚC 5: Lưu vào MongoDB
      console.log('\n💾 Bước 5: Lưu kết quả vào database...');
      await Video.findByIdAndUpdate(id, {
        status: 'completed',
        segments,
        subtitles: [
          { language: targetLanguage.toLowerCase(), srtPath: translatedSrtPath, label: `Dịch ${targetLanguage}` },
          { language: 'bilingual', srtPath: bilingualSrtPath, label: 'Song ngữ' },
        ],
      });

      console.log(`\n🎉 HOÀN THÀNH! Video "${video.title}" đã có phụ đề.`);
      cleanupAudio(audioPath);
    } catch (err) {
      console.error('\n❌ Pipeline thất bại:', err.message);
      await Video.findByIdAndUpdate(id, { status: 'error', errorMessage: err.message });
      cleanupAudio(audioPath);
    }
  });
};

module.exports = { transcribeVideo };
