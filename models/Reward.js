const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Reward = sequelize.define('Reward', {
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  poin_dibutuhkan: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  stok: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  gambar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
  tanggal_kadaluarsa: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

// Model untuk pencatatan reward yang ditukarkan
const RewardClaim = sequelize.define('RewardClaim', {
  tanggal_klaim: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processed', 'completed'),
    defaultValue: 'pending',
  },
  kode_klaim: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

// Relasi
Reward.hasMany(RewardClaim);
RewardClaim.belongsTo(Reward);

User.hasMany(RewardClaim);
RewardClaim.belongsTo(User);

module.exports = { Reward, RewardClaim };
