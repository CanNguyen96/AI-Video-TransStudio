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
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'error'],
      default: 'uploaded',
    },
    subtitles: [
      {
        language:  { type: String, default: 'vi' },
        srtPath:   { type: String },
        label:     { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    thumbnail: {
      type: String,
      default: null,
    },
    audioPath: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    segments: {
      type: Array,
      default: [],
    },
    // Chủ sở hữu video — bắt buộc
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Video', videoSchema);
