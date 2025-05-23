const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Edukasi = sequelize.define('Edukasi', {
  judul: {
    type: DataTypes.STRING,
    allowNull: false
  },
  konten: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  kategori: {
    type: DataTypes.ENUM('artikel', 'video', 'infografis', 'tips'),
    allowNull: false
  },
  gambar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  link_video: {
    type: DataTypes.STRING,
    allowNull: true
  },
  poin_reward: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Poin yang didapat user setelah membaca/menonton'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft'
  },
  tanggal_publikasi: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Model untuk mencatat edukasi yang sudah dibaca/ditonton user
const UserEdukasi = sequelize.define('UserEdukasi', {
  tanggal_baca: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  poin_diberikan: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Relasi
Edukasi.hasMany(UserEdukasi);
UserEdukasi.belongsTo(Edukasi);

User.hasMany(UserEdukasi);
UserEdukasi.belongsTo(User);

module.exports = { Edukasi, UserEdukasi };