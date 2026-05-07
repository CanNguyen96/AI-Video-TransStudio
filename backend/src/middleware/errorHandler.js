/**
 * Global error handler middleware.
 * Xử lý: Multer errors, Mongoose errors, generic errors
 */
const errorHandler = (err, req, res, next) => {
  // Multer: file quá lớn
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `File quá lớn. Tối đa ${process.env.MAX_FILE_SIZE || 500}MB`,
    });
  }

  // Multer: sai định dạng
  if (err.message?.includes('Định dạng file không hỗ trợ')) {
    return res.status(415).json({ success: false, message: err.message });
  }

  // Mongoose: ID không hợp lệ
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
  }

  // Mongoose: duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Dữ liệu đã tồn tại' });
  }

  // Generic server error
  const status = err.statusCode || err.status || 500;
  console.error(`[${new Date().toISOString()}] ❌ ${status} ${req.method} ${req.path}:`, err.message);

  res.status(status).json({
    success: false,
    message: err.message || 'Lỗi server không xác định',
  });
};

module.exports = errorHandler;
