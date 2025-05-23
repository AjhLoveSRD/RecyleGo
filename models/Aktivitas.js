const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Aktivitas = sequelize.define('Aktivitas', {
  jenis_sampah: {
    type: DataTypes.ENUM('plastik', 'kertas', 'logam', 'organik', 'elektronik'),
    allowNull: false
  },
  berat: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  poin_diperoleh: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tanggal: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lokasi: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending'
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// Relasi dengan User
Aktivitas.belongsTo(User);
User.hasMany(Aktivitas);

module.exports = Aktivitas;