const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware bảo vệ route — yêu cầu JWT hợp lệ trong header Authorization
 * Header: Authorization: Bearer <token>
 */
const protect = async (req, res, next) => {
  // Ưu tiên Authorization header, fallback về query string ?token=...
  // (cần thiết cho <video src> và <img src> không thể set custom headers)
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc user không tồn tại.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token hết hạn hoặc không hợp lệ.' });
  }
};

/**
 * Middleware tùy chọn — Gắn user vào req nếu có token, không bắt buộc
 * Dùng cho route có thể truy cập cả khi chưa đăng nhập
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (_) {
      // Token không hợp lệ → bỏ qua, không block request
    }
  }
  next();
};

module.exports = { protect, optionalAuth };
