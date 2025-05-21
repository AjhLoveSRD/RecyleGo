const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 30],
      is: /^[a-zA-Z0-9_]+$/i // Alphanumeric dan underscore saja
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 100] // Minimal 8 karakter
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'moderator'),
    defaultValue: 'user'
  },
  nama_lengkap: {
    type: DataTypes.STRING,
    allowNull: true
  },
  alamat: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  no_telepon: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9+]+$/i // Hanya angka dan tanda +
    }
  },
  poin_total: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refresh_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  token_version: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  account_locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      // Hash password sebelum menyimpan ke database
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      // Hash password jika diubah
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Method untuk validasi password
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method untuk increment token version (untuk invalidasi refresh token)
User.prototype.incrementTokenVersion = function() {
  this.token_version += 1;
  return this.save();
};

module.exports = User;