const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Aktivitas = require('../models/Aktivitas');

// Endpoint ringkasan statistik dashboard admin
router.get('/summary', async (req, res) => {
  try {
    const totalUser = await User.count();
    const totalAktivitas = await Aktivitas.count();
    const totalBerat = await Aktivitas.sum('berat');
    const totalPoin = await Aktivitas.sum('poin_diperoleh');

    res.json({
      totalUser,
      totalAktivitas,
      totalBerat: totalBerat || 0,
      totalPoin: totalPoin || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data ringkasan' });
  }
});

module.exports = router;
