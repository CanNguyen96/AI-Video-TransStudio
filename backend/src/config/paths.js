/**
 * Centralized upload paths.
 */
const path = require('path');

const BASE = path.resolve(process.env.UPLOAD_PATH || './uploads');

module.exports = {
  UPLOAD_DIR: BASE,
  AUDIO_DIR: path.join(BASE, 'audio'),
  SUBTITLE_DIR: path.join(BASE, 'subtitles'),
  THUMBNAIL_DIR: path.join(BASE, 'thumbnails'),
  BURNED_DIR: path.join(BASE, 'burned'),
};
