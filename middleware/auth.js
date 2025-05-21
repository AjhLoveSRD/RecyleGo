const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware untuk verifikasi JWT token
const verifyToken = (req, res, next) => {
  try {
    // Ambil token dari header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Akses ditolak. Token tidak ada' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Tambahkan data user ke request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token kadaluarsa' });
    }
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

// Middleware untuk verifikasi role admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Akses ditolak. Hanya admin yang diizinkan' });
  }
};

// Middleware untuk verifikasi role moderator atau admin
const isModeratorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'moderator' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Akses ditolak. Hanya moderator atau admin yang diizinkan' });
  }
};

// Middleware untuk verifikasi pemilik resource atau admin
const isOwnerOrAdmin = (model) => async (req, res, next) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Admin selalu diizinkan
    if (userRole === 'admin') {
      return next();
    }
    
    // Cek apakah resource dimiliki oleh user
    const resource = await model.findByPk(resourceId);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource tidak ditemukan' });
    }
    
    if (resource.UserId === userId) {
      return next();
    }
    
    return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki izin untuk resource ini' });
  } catch (error) {
    console.error('isOwnerOrAdmin error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Middleware untuk mencegah brute force attack dengan delay
const bruteForceProtection = (req, res, next) => {
  // Tambahkan delay acak antara 100-500ms untuk mencegah timing attacks
  const delay = Math.floor(Math.random() * 400) + 100;
  setTimeout(next, delay);
};

// Middleware untuk sanitasi input
const sanitizeInput = (req, res, next) => {
  // Fungsi untuk sanitasi string
  const sanitize = (str) => {
    if (typeof str !== 'string') return str;
    // Escape karakter khusus HTML
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  // Sanitasi body request
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitize(req.body[key]);
      }
    });
  }

  // Sanitasi query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitize(req.query[key]);
      }
    });
  }

  next();
};

// Middleware untuk validasi CSRF token
const csrfProtection = (req, res, next) => {
  // Skip untuk GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const csrfToken = req.headers['x-csrf-token'];
  const storedToken = req.session?.csrfToken;
  
  if (!csrfToken || !storedToken || csrfToken !== storedToken) {
    return res.status(403).json({ message: 'CSRF token tidak valid' });
  }
  
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isModeratorOrAdmin,
  isOwnerOrAdmin,
  bruteForceProtection,
  sanitizeInput,
  csrfProtection
};