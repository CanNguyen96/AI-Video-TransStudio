require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const connectDB    = require('./config/db');
const authRoutes   = require('./routes/authRoutes');
const videoRoutes  = require('./routes/videoRoutes');
const subtitleRoutes = require('./routes/subtitleRoutes');
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file upload tĩnh (thumbnail, v.v.)
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_PATH || './uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/videos', subtitleRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const { getStatus } = require('./services/transcribeQueue');
  const DB_STATES = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const state = mongoose.connection.readyState;
  const queue = getStatus();
  res.json({
    status:   state === 1 ? 'OK' : 'DEGRADED',
    message:  '🎬 AI Video TransStudio API is running',
    database: {
      status: DB_STATES[state] || 'Unknown',
      host:   mongoose.connection.host || null,
    },
    queue: {
      running:       queue.running,
      waiting:       queue.waiting,
      maxConcurrent: queue.maxConcurrent,
    },
  });
});

// ─── Global Error Handler (phải đặt SAU tất cả routes) ───────────────────────
app.use(errorHandler);

// ─── Khởi động server (chờ DB kết nối trước) ─────────────────────────────────
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
