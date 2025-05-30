const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Ambil semua pengguna (tanpa password & token)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'refresh_token', 'token_version'] },
    });
    res.json(users);
  } catch (err) {
    console.error('Gagal mengambil data pengguna:', err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Ambil satu pengguna berdasarkan ID
router.get('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'refresh_token', 'token_version'] },
    });
    if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Tambah pengguna baru (admin)
router.post(
  '/',
  verifyToken,
  isAdmin,
  [
    body('username').isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
    body('role').optional().isIn(['user', 'admin', 'moderator']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const user = await User.create(req.body);
      res.status(201).json({ message: 'Pengguna berhasil ditambahkan', user });
    } catch (err) {
      res.status(500).json({ message: 'Gagal menambah pengguna', error: err.message });
    }
  }
);

// Update pengguna
router.put('/:id', verifyToken, isAdmin, [body('email').optional().isEmail().withMessage('Email tidak valid'), body('password').optional().isLength({ min: 8 }).withMessage('Password minimal 8 karakter')], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan' });

    await user.update(req.body);
    res.json({ message: 'Pengguna berhasil diperbarui', user });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui pengguna', error: err.message });
  }
});

// Hapus pengguna
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan' });

    await user.destroy();
    res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus pengguna', error: err.message });
  }
});

module.exports = router;
