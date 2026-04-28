const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      unique: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // bytes
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // seconds, populated later by FFmpeg
      default: null,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'error'],
      default: 'uploaded',
    },
    subtitles: [
      {
        language: { type: String, default: 'vi' },
        srtPath: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    thumbnail: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Video', videoSchema);
