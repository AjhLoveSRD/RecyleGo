const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const { v4: uuidv4 } = require('uuid');

// Middleware untuk mencegah XSS attacks
router.use(xss());

// Rate limiter khusus untuk login (lebih ketat dari global limiter)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // maksimal 5 percobaan dalam 15 menit
  message: { message: 'Terlalu banyak percobaan login, silakan coba lagi nanti' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Fungsi untuk generate token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Token berlaku 15 menit
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, tokenVersion: user.token_version },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' } // Refresh token berlaku 7 hari
  );
};

// Register user baru
router.post(
  '/register',
  [
    // Validasi input
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username harus antara 3-30 karakter')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username hanya boleh berisi huruf, angka, dan underscore')
      .trim()
      .escape(),
    body('email')
      .isEmail()
      .withMessage('Email tidak valid')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password minimal 8 karakter')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/)
      .withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka'),
    body('nama_lengkap')
      .optional()
      .trim()
      .escape(),
    body('no_telepon')
      .optional()
      .matches(/^[0-9+]+$/)
      .withMessage('Nomor telepon hanya boleh berisi angka dan tanda +'),
  ],
  async (req, res) => {
    try {
      // Cek hasil validasi
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, nama_lengkap, alamat, no_telepon } = req.body;

      // Cek apakah username atau email sudah terdaftar
      const existingUser = await User.findOne({
        where: {
          [sequelize.Op.or]: [{ username }, { email }],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          message: 'Username atau email sudah terdaftar',
        });
      }

      // Buat user baru
      const user = await User.create({
        username,
        email,
        password, // Password akan di-hash oleh hook beforeCreate
        nama_lengkap,
        alamat,
        no_telepon,
      });

      // Generate token
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Simpan refresh token ke database
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

// Login
router.post(
  '/login',
  loginLimiter,
  [
    body('username').trim().escape(),
    body('password').trim(),
  ],
  async (req, res) => {
    try {
      const { username, password } = req.body;

      // Cari user berdasarkan username
      const user = await User.findOne({ where: { username } });

      if (!user) {
        return res.status(401).json({ message: 'Username atau password salah' });
      }

      // Cek apakah akun terkunci
      if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
        const timeLeft = Math.ceil((new Date(user.account_locked_until) - new Date()) / 1000 / 60);
        return res.status(401).json({
          message: `Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam ${timeLeft} menit.`,
        });
      }

      // Validasi password
      const isPasswordValid = await user.validatePassword(password);

      if (!isPasswordValid) {
        // Increment failed login attempts
        user.failed_login_attempts += 1;
        
        // Lock account after 5 failed attempts
        if (user.failed_login_attempts >= 5) {
          user.account_locked_until = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
        }
        
        await user.save();
        
        return res.status(401).json({ message: 'Username atau password salah' });
      }

      // Reset failed login attempts on successful login
      user.failed_login_attempts = 0;
      user.account_locked_until = null;
      user.last_login = new Date();

      // Generate token
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Simpan refresh token ke database
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
  }
);

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token diperlukan' });
    }

    // Verify refresh token
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    );

    // Cari user berdasarkan id dari token
    const user = await User.findByPk(payload.id);

    if (!user) {
      return res.status(401).json({ message: 'User tidak ditemukan' });
    }

    // Cek apakah token version sama dengan yang ada di database
    if (user.token_version !== payload.tokenVersion) {
      return res.status(401).json({ message: 'Refresh token tidak valid' });
    }

    // Generate token baru
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token di database
    user.refresh_token = newRefreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Refresh token tidak valid atau kadaluarsa' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token diperlukan' });
    }

    // Verify refresh token
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
    );

    // Cari user berdasarkan id dari token
    const user = await User.findByPk(payload.id);

    if (user) {
      // Increment token version untuk invalidasi semua refresh token
      await user.incrementTokenVersion();
      // Hapus refresh token dari database
      user.refresh_token = null;
      await user.save();
    }

    res.json({ message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout error:', error);
    // Tetap kirim response sukses meskipun ada error
    res.json({ message: 'Logout berhasil' });
  }
});

// Get user profile (protected route)
router.get('/profile', async (req, res) => {
  try {
    // Token sudah diverifikasi oleh middleware auth
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refresh_token', 'token_version'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;