/**
 * thumbnailService.js — Chụp thumbnail từ video bằng FFmpeg
 */
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

/**
 * Chụp thumbnail từ video tại một thời điểm cụ thể
 * @param {string} videoPath  - Đường dẫn video gốc
 * @param {string} outputDir  - Thư mục lưu thumbnail
 * @param {string} baseName   - Tên file (không extension)
 * @param {number|null} [atSecond] - Giây cần chụp (mặc định tự tính 10% duration)
 * @returns {Promise<string>} - Đường dẫn file .jpg đã tạo
 */
const generateThumbnail = (videoPath, outputDir, baseName, atSecond = null) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const thumbPath = path.join(outputDir, `${baseName}.jpg`);

    const doCapture = (seekSecond) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [seekSecond],
          filename:   `${baseName}.jpg`,
          folder:     outputDir,
          size:       '480x270', // 16:9 thumbnail nhỏ gọn
        })
        .on('end', () => {
          console.log(`🖼️  Thumbnail: ${thumbPath}`);
          resolve(thumbPath);
        })
        .on('error', (err) => {
          console.warn(`⚠️  Thumbnail thất bại: ${err.message}`);
          reject(new Error(`generateThumbnail thất bại: ${err.message}`));
        });
    };

    if (atSecond !== null) {
      doCapture(Math.max(atSecond, 1));
    } else {
      // Tự lấy duration → chụp tại 10%
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        const duration = metadata?.format?.duration || 30;
        doCapture(Math.max(Math.floor(duration * 0.1), 1));
      });
    }
  });
};

module.exports = { generateThumbnail };
