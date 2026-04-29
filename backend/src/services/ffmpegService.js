const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

/**
 * Tách audio từ file video → xuất ra file .mp3
 * @param {string} videoPath - Đường dẫn tuyệt đối đến file video
 * @param {string} outputDir - Thư mục lưu file audio output
 * @returns {Promise<string>} - Đường dẫn file audio đã tạo
 */
const extractAudio = (videoPath, outputDir) => {
  return new Promise((resolve, reject) => {
    // Tạo thư mục output nếu chưa tồn tại
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const baseName = path.parse(videoPath).name;
    const audioOutputPath = path.join(outputDir, `${baseName}.mp3`);

    console.log(`🎬 FFmpeg: Bắt đầu tách audio từ ${path.basename(videoPath)}`);

    ffmpeg(videoPath)
      .noVideo()                    // Bỏ track video, chỉ lấy audio
      .audioCodec('libmp3lame')     // Encode sang MP3
      .audioBitrate('128k')         // Bitrate 128kbps — đủ chất lượng cho AI
      .audioChannels(1)             // Mono — giảm file size, Gemini xử lý tốt hơn
      .audioFrequency(16000)        // 16kHz — chuẩn cho speech recognition
      .output(audioOutputPath)
      .on('start', (cmd) => {
        console.log(`   FFmpeg command: ${cmd}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`   Tiến độ: ${Math.round(progress.percent)}%\r`);
        }
      })
      .on('end', () => {
        console.log(`\n✅ FFmpeg: Tách audio xong → ${audioOutputPath}`);
        resolve(audioOutputPath);
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err.message);
        reject(new Error(`FFmpeg thất bại: ${err.message}`));
      })
      .run();
  });
};

/**
 * Lấy metadata video (duration, resolution, etc.)
 * @param {string} videoPath
 * @returns {Promise<Object>}
 */
const getVideoMetadata = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(new Error(`Không đọc được metadata: ${err.message}`));
      }
      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

      resolve({
        duration: Math.round(metadata.format.duration || 0),
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        width: videoStream?.width,
        height: videoStream?.height,
        fps: videoStream?.r_frame_rate,
        audioCodec: audioStream?.codec_name,
        hasAudio: !!audioStream,
      });
    });
  });
};

module.exports = { extractAudio, getVideoMetadata };
