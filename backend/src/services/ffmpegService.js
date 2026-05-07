
const { extractAudio } = require('./ffmpeg/audioService');
const { getVideoMetadata, detectSubtitleStreams } = require('./ffmpeg/metadataService');
const { burnSubtitles, burnSubtitlesRemovingSoft,
  burnSubtitlesCoveringHardcoded } = require('./ffmpeg/burnService');
const { generateThumbnail } = require('./ffmpeg/thumbnailService');

module.exports = {
  extractAudio,
  getVideoMetadata,
  detectSubtitleStreams,
  burnSubtitles,
  burnSubtitlesRemovingSoft,
  burnSubtitlesCoveringHardcoded,
  generateThumbnail,
};
