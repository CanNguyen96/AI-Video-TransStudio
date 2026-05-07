const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Tạo JWT token */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/** Format user response (bỏ password) */
const userResponse = (user) => ({
  _id:       user._id,
  name:      user.name,
  email:     user.email,
  createdAt: user.createdAt,
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc  Đăng ký tài khoản mới
 * @route POST /api/auth/register
 * @body  { name, email, password }
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      token,
      user: userResponse(user),
    });
  } catch (err) {
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc  Đăng nhập
 * @route POST /api/auth/login
 * @body  { email, password }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    // Lấy cả password (select: false) để so sánh
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: userResponse(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc  Lấy thông tin user đang đăng nhập
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  res.json({ success: true, user: userResponse(req.user) });
};

module.exports = { register, login, getMe };
