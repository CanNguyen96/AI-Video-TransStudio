const Video = require('../models/Video');
const path = require('path');
const fs = require('fs');
const { generateThumbnail } = require('../services/ffmpegService');

const THUMBNAIL_DIR = path.resolve('./uploads/thumbnails');

// @desc  Upload a new video
// @route POST /api/videos/upload
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file nào được upload' });
    }

    const title =
      req.body.title ||
      path.parse(req.file.originalname).name;

    const video = await Video.create({
      title,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path.replace(/\\/g, '/'),
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({
      success: true,
      message: 'Upload thành công!',
      data: video,
    });

    // Tự động tạo thumbnail sau khi upload (async, không block response)
    setImmediate(async () => {
      try {
        const videoFilePath = path.resolve(video.filePath);
        const baseName = path.parse(video.fileName).name;
        const thumbPath = await generateThumbnail(videoFilePath, THUMBNAIL_DIR, baseName);
        // Lưu đường dẫn thumbnail tương đối vào DB
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

// @desc  Get all videos
// @route GET /api/videos
const getVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const total = await Video.countDocuments();
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-filePath'); // don't expose server paths

    res.json({
      success: true,
      data: videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single video by ID
// @route GET /api/videos/:id
const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video không tồn tại' });
    }
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete a video
// @route DELETE /api/videos/:id
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video không tồn tại' });
    }

    // Xóa file video khỏi disk
    const filePath = path.resolve(video.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Xóa thumbnail nếu có
    if (video.thumbnail && fs.existsSync(video.thumbnail)) {
      try { fs.unlinkSync(video.thumbnail); } catch (_) {}
    }

    await video.deleteOne();
    res.json({ success: true, message: 'Xóa video thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Serve thumbnail image
// @route GET /api/videos/:id/thumbnail
const getThumbnail = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).select('thumbnail');
    if (!video || !video.thumbnail || !fs.existsSync(video.thumbnail)) {
      // Trả về 404 nếu chưa có thumbnail
      return res.status(404).json({ success: false, message: 'Thumbnail chưa sẵn sàng' });
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 1 ngày
    fs.createReadStream(video.thumbnail).pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Stream video file
// @route GET /api/videos/:id/stream
const streamVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video không tồn tại' });
    }

    const filePath = path.resolve(video.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File không tồn tại trên server' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Support range requests for video seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimeType,
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': video.mimeType,
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadVideo, getVideos, getVideoById, deleteVideo, streamVideo, getThumbnail };
