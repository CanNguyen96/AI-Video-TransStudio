/**
 * CRUD + stream + thumbnail
 */
const Video = require('../models/Video');
const path = require('path');
const fs = require('fs');
const { generateThumbnail } = require('../services/ffmpeg/thumbnailService');
const { THUMBNAIL_DIR } = require('../config/paths');

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * @desc  Upload video mới
 * @route POST /api/videos/upload
 */
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file nào được upload' });
    }

    const title = req.body.title || path.parse(req.file.originalname).name;

    const video = await Video.create({
      title,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path.replace(/\\/g, '/'),
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      owner: req.user._id,        // ← Gán owner
    });

    res.status(201).json({ success: true, message: 'Upload thành công!', data: video });

    // Tạo thumbnail sau khi response (không block)
    setImmediate(async () => {
      try {
        const videoFilePath = path.resolve(video.filePath);
        const baseName = path.parse(video.fileName).name;
        const thumbPath = await generateThumbnail(videoFilePath, THUMBNAIL_DIR, baseName);
        await Video.findByIdAndUpdate(video._id, { thumbnail: thumbPath });
        console.log(`🖼️  Thumbnail đã lưu cho video: ${video.title}`);
      } catch (thumbErr) {
        console.warn(`⚠️  Không tạo được thumbnail: ${thumbErr.message}`);
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── List & Detail ────────────────────────────────────────────────────────────

/**
 * @desc  Danh sách video (có phân trang)
 * @route GET /api/videos
 */
const getVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Chỉ lấy video của user đang đăng nhập
    const filter = { owner: req.user._id };

    const [total, videos] = await Promise.all([
      Video.countDocuments(filter),
      Video.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-filePath'),
    ]);

    res.json({
      success: true,
      data: videos,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Chi tiết 1 video
 * @route GET /api/videos/:id
 */
const getVideoById = async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      owner: req.user._id,
    }).select('-filePath');
    if (!video) return res.status(404).json({ success: false, message: 'Video không tồn tại' });
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * @desc  Xóa video (xóa file + DB)
 * @route DELETE /api/videos/:id
 */
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, owner: req.user._id }).select('+filePath');
    if (!video) return res.status(404).json({ success: false, message: 'Video không tồn tại' });

    const filePath = path.resolve(video.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (video.thumbnail && fs.existsSync(video.thumbnail)) {
      try { fs.unlinkSync(video.thumbnail); } catch (_) { }
    }

    await video.deleteOne();
    res.json({ success: true, message: 'Xóa video thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Streaming ────────────────────────────────────────────────────────────────

/**
 * @desc  Serve thumbnail image
 * @route GET /api/videos/:id/thumbnail
 */
const getThumbnail = async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, owner: req.user._id }).select('thumbnail');
    if (!video || !video.thumbnail || !fs.existsSync(video.thumbnail)) {
      return res.status(404).json({ success: false, message: 'Thumbnail chưa sẵn sàng' });
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const stream = fs.createReadStream(video.thumbnail);
    stream.pipe(res);
    req.on('close', () => {
      stream.destroy();
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Stream video (hỗ trợ Range Requests để tua)
 * @route GET /api/videos/:id/stream
 */
const streamVideo = async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, owner: req.user._id });
    if (!video) return res.status(404).json({ success: false, message: 'Video không tồn tại' });

    const filePath = path.resolve(video.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File không tồn tại trên server' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimeType,
      });
      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
      req.on('close', () => {
        stream.destroy();
      });
    } else {
      res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': video.mimeType });
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      req.on('close', () => {
        stream.destroy();
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadVideo, getVideos, getVideoById, deleteVideo, streamVideo, getThumbnail };
