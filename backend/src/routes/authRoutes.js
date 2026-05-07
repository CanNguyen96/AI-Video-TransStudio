/**
 * Auth routes — đăng ký, đăng nhập, lấy thông tin user
 */
const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register — Đăng ký
router.post('/register', register);

// POST /api/auth/login — Đăng nhập
router.post('/login', login);

// GET  /api/auth/me — Thông tin user (cần đăng nhập)
router.get('/me', protect, getMe);

module.exports = router;
