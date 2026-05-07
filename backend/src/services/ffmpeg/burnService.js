/**
 * Burn (hardcode) subtitle SRT vào video bằng FFmpeg
 * Hỗ trợ 3 chế độ: clean / remove soft sub / cover hardcoded sub
 */
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

/** FFmpeg output options dùng chung */
const ENCODE_OPTIONS = [
  '-c:v libx264',
  '-c:a copy',
  '-sn',               // Xóa soft subtitle tracks khỏi output
  '-preset fast',
  '-crf 23',
  '-movflags +faststart',
];

/** Escape đường dẫn SRT cho FFmpeg filter (Windows cần escape ':' và '\') */
const escapeSrtPath = (srtPath) =>
  srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');

/** Log tiến độ render */
const onProgress = (p) => {
  if (p.percent) process.stdout.write(`   Render: ${Math.round(p.percent)}%\r`);
};

/**
 * Burn subtitle vào video SẠCH (không có sub cũ)
 * @param {string} videoPath
 * @param {string} srtPath
 * @param {string} outputPath
 * @returns {Promise<string>}
 */
const burnSubtitles = (videoPath, srtPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const escaped = escapeSrtPath(srtPath);
    console.log(`🔥 FFmpeg [clean]: Burn subtitle vào video...`);
    console.log(`   Input : ${path.basename(videoPath)}`);
    console.log(`   SRT   : ${path.basename(srtPath)}`);

    ffmpeg(videoPath)
      .videoFilter(`subtitles='${escaped}':force_style='FontSize=20,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2'`)
      .outputOptions(ENCODE_OPTIONS)
      .output(outputPath)
      .on('start', () => console.log('   Bắt đầu render...'))
      .on('progress', onProgress)
      .on('end', () => { console.log(`\n✅ Burn xong → ${outputPath}`); resolve(outputPath); })
      .on('error', (err) => reject(new Error(`FFmpeg burn thất bại: ${err.message}`)))
      .run();
  });
};

/**
 * Xóa soft subtitle tracks rồi burn subtitle mới
 * Dùng cho video có soft subtitle (mkv, mp4 có subtitle track)
 * @param {string} videoPath
 * @param {string} srtPath
 * @param {string} outputPath
 * @returns {Promise<string>}
 */
const burnSubtitlesRemovingSoft = (videoPath, srtPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const escaped = escapeSrtPath(srtPath);
    console.log(`🔥 FFmpeg [soft]: Burn mới + xóa soft sub cũ...`);
    console.log(`   Input : ${path.basename(videoPath)}`);
    console.log(`   SRT   : ${path.basename(srtPath)}`);

    ffmpeg(videoPath)
      .videoFilter(`subtitles='${escaped}':force_style='FontSize=20,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2'`)
      .outputOptions(ENCODE_OPTIONS)
      .output(outputPath)
      .on('start', () => console.log('   Bắt đầu render (xóa soft sub + burn mới)...'))
      .on('progress', onProgress)
      .on('end', () => { console.log(`\n✅ Burn (replace soft) xong → ${outputPath}`); resolve(outputPath); })
      .on('error', (err) => reject(new Error(`FFmpeg burn soft thất bại: ${err.message}`)))
      .run();
  });
};

/**
 * Che hardcoded subtitle cũ bằng drawbox rồi burn subtitle mới
 * @param {string} videoPath
 * @param {string} srtPath
 * @param {string} outputPath
 * @param {number} [coverRatio=0.15] - Tỉ lệ chiều cao che (15% dưới cùng)
 * @returns {Promise<string>}
 */
const burnSubtitlesCoveringHardcoded = (videoPath, srtPath, outputPath, coverRatio = 0.15) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(new Error(`Không đọc được metadata: ${err.message}`));

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const width = videoStream?.width || 1920;
      const height = videoStream?.height || 1080;

      const coverHeight = Math.round(height * coverRatio);
      const coverY = height - coverHeight;
      const escaped = escapeSrtPath(srtPath);

      const filterChain = [
        `drawbox=x=0:y=${coverY}:w=${width}:h=${coverHeight}:color=black@0.85:t=fill`,
        `subtitles='${escaped}':force_style='FontSize=20,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2'`,
      ].join(',');

      console.log(`🔥 FFmpeg [hardcoded]: Che sub cũ + burn mới...`);
      console.log(`   Video: ${width}x${height} | Che vùng: y=${coverY} h=${coverHeight}px (${Math.round(coverRatio * 100)}%)`);
      console.log(`   Input: ${path.basename(videoPath)}`);

      ffmpeg(videoPath)
        .videoFilter(filterChain)
        .outputOptions(ENCODE_OPTIONS)
        .output(outputPath)
        .on('start', () => console.log('   Bắt đầu render (cover hardcoded + burn mới)...'))
        .on('progress', onProgress)
        .on('end', () => { console.log(`\n✅ Burn (cover hardcoded) xong → ${outputPath}`); resolve(outputPath); })
        .on('error', (err) => reject(new Error(`FFmpeg burn hardcoded thất bại: ${err.message}`)))
        .run();
    });
  });
};

module.exports = { burnSubtitles, burnSubtitlesRemovingSoft, burnSubtitlesCoveringHardcoded };
