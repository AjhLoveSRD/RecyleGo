const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize'); // ✅ gunakan operator dari sequelize

// Middleware untuk mencegah XSS attacks
router.use(xss());

// Rate limiter khusus untuk login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Terlalu banyak percobaan login, silakan coba lagi nanti' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Token generator
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username, tokenVersion: user.token_version }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', { expiresIn: '7d' });
};

// ✅ REGISTER
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username harus antara 3-30 karakter')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username hanya boleh berisi huruf, angka, dan underscore')
      .trim()
      .escape(),
    body('email').isEmail().withMessage('Email tidak valid').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password minimal 8 karakter')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/)
      .withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka'),
    body('nama_lengkap').optional().trim().escape(),
    body('no_telepon')
      .optional()
      .matches(/^[0-9+]+$/),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, nama_lengkap, alamat, no_telepon } = req.body;

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email }],
        },
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Username atau email sudah terdaftar' });
      }

      const user = await User.create({
        username,
        email,
        password,
        nama_lengkap,
        alamat,
        no_telepon,
      });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refresh_token = refreshToken;
      await user.save();

      res.status(201).json({
        message: 'User berhasil dibuat',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          nama_lengkap: user.nama_lengkap,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ✅ LOGIN
router.post('/login', loginLimiter, [body('username').trim().escape(), body('password').trim()], async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) return res.status(401).json({ message: 'Username atau password salah' });

    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      const timeLeft = Math.ceil((new Date(user.account_locked_until) - new Date()) / 1000 / 60);
      return res.status(401).json({ message: `Akun terkunci. Coba lagi dalam ${timeLeft} menit.` });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      user.failed_login_attempts += 1;
      if (user.failed_login_attempts >= 5) {
        user.account_locked_until = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    user.failed_login_attempts = 0;
    user.account_locked_until = null;
    user.last_login = new Date();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refresh_token = refreshToken;
    await user.save();

    res.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        nama_lengkap: user.nama_lengkap,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ REFRESH TOKEN
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token diperlukan' });

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');

    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ message: 'User tidak ditemukan' });
    if (user.token_version !== payload.tokenVersion) {
      return res.status(401).json({ message: 'Refresh token tidak valid' });
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    user.refresh_token = newRefreshToken;
    await user.save();

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Refresh token tidak valid atau kadaluarsa' });
  }
});

// ✅ LOGOUT
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token diperlukan' });

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');

    const user = await User.findByPk(payload.id);
    if (user) {
      await user.incrementTokenVersion(); // pastikan kamu punya method ini di model
      user.refresh_token = null;
      await user.save();
    }

    res.json({ message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({ message: 'Logout berhasil' });
  }
});

// ✅ PROFILE (harus pakai middleware verifyToken di route asli)
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refresh_token', 'token_version'] },
    });

    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
