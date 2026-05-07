/**
 * Tách audio từ video bằng FFmpeg
 */
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
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const baseName = path.parse(videoPath).name;
    const audioOutputPath = path.join(outputDir, `${baseName}.mp3`);

    console.log(`🎬 FFmpeg: Bắt đầu tách audio từ ${path.basename(videoPath)}`);

    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('64k')      // Đủ cho speech recognition, file nhỏ
      .audioChannels(1)         // Mono — Gemini xử lý tốt hơn
      .audioFrequency(16000)    // 16kHz — chuẩn cho speech recognition
      .output(audioOutputPath)
      .on('start', (cmd) => console.log(`   FFmpeg command: ${cmd}`))
      .on('progress', (p) => {
        if (p.percent) process.stdout.write(`   Tiến độ: ${Math.round(p.percent)}%\r`);
      })
      .on('end', () => {
        console.log(`\n✅ FFmpeg: Tách audio xong → ${audioOutputPath}`);
        resolve(audioOutputPath);
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg extractAudio error:', err.message);
        reject(new Error(`FFmpeg tách audio thất bại: ${err.message}`));
      })
      .run();
  });
};

module.exports = { extractAudio };
