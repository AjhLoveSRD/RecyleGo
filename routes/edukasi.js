const express = require('express');
const router = express.Router();
const { Edukasi, UserEdukasi } = require('../models/Edukasi');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

// Mendapatkan semua konten edukasi yang dipublikasikan
router.get('/', async (req, res) => {
  try {
    const edukasi = await Edukasi.findAll({
      where: { status: 'published' },
      order: [['tanggal_publikasi', 'DESC']]
    });
    res.json(edukasi);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mendapatkan konten edukasi berdasarkan kategori
router.get('/kategori/:kategori', async (req, res) => {
  const { kategori } = req.params;
  
  try {
    const edukasi = await Edukasi.findAll({
      where: { 
        kategori,
        status: 'published'
      },
      order: [['tanggal_publikasi', 'DESC']]
    });
    res.json(edukasi);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mendapatkan detail konten edukasi
router.get('/:id', async (req, res) => {
  try {
    const edukasi = await Edukasi.findByPk(req.params.id);
    if (!edukasi || edukasi.status !== 'published') {
      return res.status(404).json({ message: 'Konten edukasi tidak ditemukan' });
    }
    res.json(edukasi);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Menambahkan konten edukasi baru (admin)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { judul, konten, kategori, gambar, link_video, poin_reward, status } = req.body;
  
  try {
    const edukasi = await Edukasi.create({
      judul,
      konten,
      kategori,
      gambar,
      link_video,
      poin_reward,
      status: status || 'draft'
    });
    
    res.status(201).json(edukasi);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update konten edukasi (admin)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { judul, konten, kategori, gambar, link_video, poin_reward, status } = req.body;
  
  try {
    const edukasi = await Edukasi.findByPk(id);
    
    if (!edukasi) {
      return res.status(404).json({ message: 'Konten edukasi tidak ditemukan' });
    }
    
    await edukasi.update({
      judul,
      konten,
      kategori,
      gambar,
      link_video,
      poin_reward,
      status
    });
    
    res.json(edukasi);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Menandai konten edukasi sudah dibaca/ditonton dan memberikan poin
router.post('/:id/read', verifyToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Cek apakah konten edukasi ada dan dipublikasikan
    const edukasi = await Edukasi.findByPk(id);
    if (!edukasi || edukasi.status !== 'published') {
      return res.status(404).json({ message: 'Konten edukasi tidak ditemukan' });
    }
    
    // Cek apakah user sudah pernah membaca konten ini
    const existingRead = await UserEdukasi.findOne({
      where: {
        UserId: req.user.id,
        EdukasiId: id
      }
    });
    
    if (existingRead) {
      return res.status(400).json({ message: 'Konten ini sudah pernah dibaca' });
    }
    
    // Catat bahwa user telah membaca konten
    const userEdukasi = await UserEdukasi.create({
      UserId: req.user.id,
      EdukasiId: id,
      poin_diberikan: true
    });
    
    // Berikan poin ke user
    if (edukasi.poin_reward > 0) {
      const user = await User.findByPk(req.user.id);
      user.points += edukasi.poin_reward;
      await user.save();
    }
    
    res.status(201).json({
      message: 'Konten berhasil dibaca',
      poin_diperoleh: edukasi.poin_reward
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mendapatkan riwayat konten edukasi yang sudah dibaca user
router.get('/user/history', verifyToken, async (req, res) => {
  try {
    const history = await UserEdukasi.findAll({
      where: { UserId: req.user.id },
      include: [{ model: Edukasi }],
      order: [['tanggal_baca', 'DESC']]
    });
    
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hapus konten edukasi (admin)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const edukasi = await Edukasi.findByPk(id);
    
    if (!edukasi) {
      return res.status(404).json({ message: 'Konten edukasi tidak ditemukan' });
    }
    
    await edukasi.destroy();
    res.json({ message: 'Konten edukasi berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;