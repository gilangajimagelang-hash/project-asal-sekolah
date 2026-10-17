const jwt = require('jsonwebtoken');

// Middleware untuk verifikasi Token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan!' });
  }

  const secretKey = process.env.JWT_SECRET || 'rahasia_negara'; 

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token tidak valid atau sudah kedaluwarsa!' });
    }
    req.user = user; // Menyimpan data user (id, role, dll)
    next();
  });
};

// Middleware untuk mengecek Role (contoh: ['admin'])
const verifyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak! Khusus Admin.' });
    }
    next();
  };
};

module.exports = { verifyToken, verifyRole };