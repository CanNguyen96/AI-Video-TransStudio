const fs = require('fs');
const path = require('path');

/**
 * Chuyển số giây → định dạng timestamp SRT: HH:MM:SS,mmm
 * Ví dụ: 65.5 → "00:01:05,500"
 */
const secondsToSrtTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds % 1) * 1000);

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':') + ',' + String(milliseconds).padStart(3, '0');
};

/**
 * Tạo nội dung file SRT từ mảng segments
 * Hỗ trợ 2 chế độ: chỉ dịch, hoặc song ngữ (gốc + dịch)
 *
 * @param {Array} segments - [{start, end, original, translated}]
 * @param {boolean} bilingual - true: hiện cả 2 dòng (gốc + dịch), false: chỉ bản dịch
 * @returns {string} - Nội dung file .srt
 */
const generateSrtContent = (segments, bilingual = false) => {
  if (!segments || segments.length === 0) {
    return '';
  }

  return segments
    .map((seg, idx) => {
      const startTime = secondsToSrtTime(seg.start);
      const endTime = secondsToSrtTime(seg.end);

      const text = bilingual
        ? `${seg.original}\n${seg.translated}`
        : seg.translated;

      return `${idx + 1}\n${startTime} --> ${endTime}\n${text}`;
    })
    .join('\n\n');
};

/**
 * Lưu file SRT ra disk
 *
 * @param {string} content - Nội dung SRT
 * @param {string} outputDir - Thư mục lưu file
 * @param {string} baseName - Tên file (không có extension)
 * @param {string} suffix - Hậu tố, ví dụ 'vi', 'bilingual'
 * @returns {string} - Đường dẫn file đã lưu
 */
const saveSrtFile = (content, outputDir, baseName, suffix = 'vi') => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `${baseName}.${suffix}.srt`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, content, 'utf-8');

  console.log(`✅ SRT đã lưu: ${filePath}`);
  return filePath;
};

/**
 * Xóa file SRT cũ của một video (khi regenerate)
 */
const deleteOldSrtFiles = (subtitles) => {
  if (!subtitles || subtitles.length === 0) return;
  subtitles.forEach((sub) => {
    if (sub.srtPath && fs.existsSync(sub.srtPath)) {
      fs.unlinkSync(sub.srtPath);
      console.log(`🗑️  Đã xóa SRT cũ: ${sub.srtPath}`);
    }
  });
};

module.exports = { generateSrtContent, saveSrtFile, deleteOldSrtFiles, secondsToSrtTime };
