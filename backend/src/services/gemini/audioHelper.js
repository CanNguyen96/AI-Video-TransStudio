const fs = require('fs');
const path = require('path');

/**
 * Lấy thời lượng của file âm thanh bằng ffprobe
 */
const getAudioDuration = (filePath) => {
  const ffmpeg = require('fluent-ffmpeg');
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
};

/**
 * Chia nhỏ audio bằng FFmpeg segment
 */
const splitAudio = (audioPath, outputDir, segmentTimeSeconds = 600) => {
  const ffmpeg = require('fluent-ffmpeg');
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const chunkPattern = path.join(outputDir, 'chunk_%03d.mp3');
    
    ffmpeg(audioPath)
      .outputOptions([
        '-f segment',
        `-segment_time ${segmentTimeSeconds}`,
        '-c copy'
      ])
      .output(chunkPattern)
      .on('end', () => {
        const files = fs.readdirSync(outputDir)
          .filter((f) => f.startsWith('chunk_') && f.endsWith('.mp3'))
          .sort()
          .map((f) => path.join(outputDir, f));
        resolve(files);
      })
      .on('error', (err) => {
        reject(new Error(`FFmpeg segment failed: ${err.message}`));
      })
      .run();
  });
};

module.exports = {
  getAudioDuration,
  splitAudio,
};
