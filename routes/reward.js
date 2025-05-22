const express = require('express');
const router = express.Router();
const { Reward, RewardClaim } = require('../models/Reward');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Middleware untuk verifikasi token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Akses ditolak' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Token tidak valid' });
  }
};

// Middleware untuk admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses ditolak, hanya untuk admin' });
  }
  next();
};

// Mendapatkan semua reward yang tersedia
router.get('/', async (req, res) => {
  try {
    const rewards = await Reward.findAll({
      where: { status: 'active' },
      order: [['poin_dibutuhkan', 'ASC']],
    });
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mendapatkan detail reward
router.get('/:id', async (req, res) => {
  try {
    const reward = await Reward.findByPk(req.params.id);
    if (!reward) {
      return res.status(404).json({ message: 'Reward tidak ditemukan' });
    }
    res.json(reward);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Menambahkan reward baru (admin)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { nama, deskripsi, poin_dibutuhkan, stok, gambar, tanggal_kadaluarsa, status } = req.body;

  // ✅ Tambahkan validasi di sini
  if (status && !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid. Gunakan "active" atau "inactive"' });
  }

  try {
    const reward = await Reward.create({
      nama,
      deskripsi,
      poin_dibutuhkan,
      stok,
      gambar,
      tanggal_kadaluarsa,
      status: status || 'active',
    });

    res.status(201).json(reward);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update reward (admin)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { nama, deskripsi, poin_dibutuhkan, stok, gambar, tanggal_kadaluarsa, status } = req.body;

  try {
    const reward = await Reward.findByPk(id);

    if (!reward) {
      return res.status(404).json({ message: 'Reward tidak ditemukan' });
    }

    await reward.update({
      nama,
      deskripsi,
      poin_dibutuhkan,
      stok,
      gambar,
      status,
      tanggal_kadaluarsa,
    });

    res.json(reward);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Menukarkan poin dengan reward
router.post('/claim/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Dapatkan reward dan user
    const reward = await Reward.findByPk(id);
    const user = await User.findByPk(req.user.id);

    if (!reward) {
      return res.status(404).json({ message: 'Reward tidak ditemukan' });
    }

    // Cek apakah reward masih aktif
    if (reward.status !== 'active') {
      return res.status(400).json({ message: 'Reward tidak tersedia' });
    }

    // Cek apakah stok masih ada
    if (reward.stok <= 0) {
      return res.status(400).json({ message: 'Stok reward habis' });
    }

    // Cek apakah poin user cukup
    if (user.points < reward.poin_dibutuhkan) {
      return res.status(400).json({ message: 'Poin tidak cukup' });
    }

    // Buat kode klaim unik
    const kode_klaim = uuidv4().substring(0, 8).toUpperCase();

    // Buat transaksi penukaran reward
    const claim = await RewardClaim.create({
      UserId: user.id,
      RewardId: reward.id,
      kode_klaim,
    });

    // Kurangi poin user
    user.points -= reward.poin_dibutuhkan;
    await user.save();

    // Kurangi stok reward
    reward.stok -= 1;
    await reward.save();

    res.status(201).json({
      message: 'Reward berhasil ditukarkan',
      kode_klaim,
      poin_tersisa: user.points,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mendapatkan riwayat klaim reward user
router.get('/claims/history', verifyToken, async (req, res) => {
  try {
    const claims = await RewardClaim.findAll({
      where: { UserId: req.user.id },
      include: [{ model: Reward }],
      order: [['createdAt', 'DESC']],
    });

    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update status klaim (admin)
router.patch('/claims/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'processed', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid' });
  }

  try {
    const claim = await RewardClaim.findByPk(id);

    if (!claim) {
      return res.status(404).json({ message: 'Klaim tidak ditemukan' });
    }

    claim.status = status;
    await claim.save();

    res.json({ message: `Status klaim berhasil diubah menjadi ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
