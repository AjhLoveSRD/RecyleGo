// routes/aktivitas.js
const express = require('express');
const router = express.Router();
const Aktivitas = require('../models/Aktivitas');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware untuk verifikasi token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  console.log('TOKEN:', token);
  console.log('JWT_SECRET:', process.env.JWT_SECRET);

  if (!token) return res.status(401).json({ message: 'Token kosong' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    console.error('Verifikasi gagal:', err.message);
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

// Middleware untuk admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses ditolak, hanya untuk admin' });
  }
  next();
};

// Mendapatkan semua aktivitas (admin)
router.get('/admin', verifyToken, isAdmin, async (req, res) => {
  try {
    const aktivitas = await Aktivitas.findAll({
      include: [{ model: User, attributes: ['id', 'username', 'email'] }],
    });
    res.json(aktivitas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mendapatkan aktivitas user tertentu
router.get('/user', verifyToken, async (req, res) => {
  try {
    const aktivitas = await Aktivitas.findAll({
      where: { UserId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(aktivitas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Menambahkan aktivitas baru
router.post('/', verifyToken, async (req, res) => {
  const { jenis_sampah, berat, lokasi, keterangan } = req.body;

  let poinPerKg = 0;
  switch (jenis_sampah) {
    case 'plastik':
      poinPerKg = 10;
      break;
    case 'kertas':
      poinPerKg = 5;
      break;
    case 'logam':
      poinPerKg = 15;
      break;
    case 'organik':
      poinPerKg = 3;
      break;
    case 'elektronik':
      poinPerKg = 20;
      break;
    default:
      poinPerKg = 1;
  }

  const poin_diperoleh = Math.round(berat * poinPerKg);

  try {
    const aktivitas = await Aktivitas.create({
      jenis_sampah,
      berat,
      poin_diperoleh,
      lokasi,
      keterangan,
      UserId: req.user.id,
    });

    res.status(201).json(aktivitas);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Verifikasi aktivitas (admin)
router.patch('/:id/verify', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid' });
  }

  try {
    const aktivitas = await Aktivitas.findByPk(id, {
      include: [{ model: User, as: 'User' }],
    });

    if (!aktivitas) {
      return res.status(404).json({ message: 'Aktivitas tidak ditemukan' });
    }

    aktivitas.status = status;
    await aktivitas.save();

    if (status === 'verified' && aktivitas.User) {
      if (typeof aktivitas.User.poin_total === 'number') {
        aktivitas.User.poin_total += aktivitas.poin_diperoleh;
        await aktivitas.User.save();
      } else {
        console.warn('⚠️ poin_total tidak tersedia pada User');
      }
    }

    res.json({
      message: `Aktivitas berhasil ${status === 'verified' ? 'diverifikasi' : 'ditolak'}`,
    });
  } catch (err) {
    console.error('❌ ERROR PATCH /verify:', err);
    res.status(500).json({ message: 'Terjadi kesalahan di server.' });
  }
});


// Hapus aktivitas
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const aktivitas = await Aktivitas.findByPk(id);

    if (!aktivitas) {
      return res.status(404).json({ message: 'Aktivitas tidak ditemukan' });
    }

    if (aktivitas.UserId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Tidak diizinkan' });
    }

    await aktivitas.destroy();
    res.json({ message: 'Aktivitas berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
