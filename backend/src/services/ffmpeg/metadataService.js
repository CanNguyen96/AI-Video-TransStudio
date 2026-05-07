/**
 * Đọc metadata và detect subtitle streams từ video
 */
const ffmpeg = require('fluent-ffmpeg');

/**
 * Lấy metadata video (duration, resolution, codec...)
 * @param {string} videoPath
 * @returns {Promise<Object>}
 */
const getVideoMetadata = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(new Error(`Không đọc được metadata: ${err.message}`));

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

/**
 * Phát hiện subtitle streams (soft subtitle) trong video
 * @param {string} videoPath
 * @returns {Promise<{ hasSoftSubtitle: boolean, subtitleStreams: Array, subtitleCount: number }>}
 */
const detectSubtitleStreams = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(new Error(`Không đọc được metadata: ${err.message}`));

      const subtitleStreams = metadata.streams.filter((s) => s.codec_type === 'subtitle');
      const subtitleInfo = subtitleStreams.map((s) => ({
        index: s.index,
        codec: s.codec_name,
        language: s.tags?.language || 'und',
        title: s.tags?.title || '',
        isDefault: s.disposition?.default === 1,
        isForced: s.disposition?.forced === 1,
      }));

      const result = {
        hasSoftSubtitle: subtitleStreams.length > 0,
        subtitleStreams: subtitleInfo,
        subtitleCount: subtitleStreams.length,
      };

      console.log(`🔍 Detect subtitle: ${result.subtitleCount} soft subtitle track(s) tìm thấy`);
      subtitleInfo.forEach((s) => {
        console.log(`   → Track #${s.index} [${s.codec}] lang=${s.language} title="${s.title}"`);
      });

      resolve(result);
    });
  });
};

module.exports = { getVideoMetadata, detectSubtitleStreams };
