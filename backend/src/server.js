require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const videoRoutes = require('./routes/videoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (for thumbnails, etc.)
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_PATH || './uploads')));

// Routes
app.use('/api/videos', videoRoutes);

// Health check — bao gồm trạng thái kết nối DB
app.get('/api/health', (req, res) => {
  const dbState = [
    'Disconnected', // 0
    'Connected',    // 1
    'Connecting',   // 2
    'Disconnecting',// 3
  ];
  const mongoose = require('mongoose');
  const state = mongoose.connection.readyState;
  res.json({
    status: state === 1 ? 'OK' : 'DEGRADED',
    message: '🎬 AI Video TransStudio API is running',
    database: {
      status: dbState[state] || 'Unknown',
      host: mongoose.connection.host || null,
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `File quá lớn. Tối đa ${process.env.MAX_FILE_SIZE || 500}MB`,
    });
  }
  res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
});

// ─── Khởi động server (chờ DB kết nối trước) ─────────────────────────────
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('💥 Khởi động thất bại:', err.message);
    process.exit(1);
  }
};

start();
