const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// 1. ENDPOINT REGISTER (Mendukung Role Admin/Mahasiswa)
router.post('/register', async (req, res) => {
  const { username, nim, password, role } = req.body;

  // Validasi input dasar
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password, dan role wajib diisi!' });
  }

  // Validasi pilihan role
  if (!['admin', 'mahasiswa'].includes(role)) {
    return res.status(400).json({ message: 'Role hanya boleh admin atau mahasiswa!' });
  }

  try {
    // Hash password sebelum disimpan ke database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan ke database
    const query = `
      INSERT INTO users (username, nim, password, role) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, username, nim, role;
    `;
    const values = [username, nim || null, hashedPassword, role];
    
    const result = await pool.query(query, values);

    res.status(201).json({
      message: 'Registrasi berhasil!',
      user: result.rows[0]
    });
  } catch (err) {
    // Handling error jika username/NIM sudah terdaftar
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Username atau NIM sudah terdaftar!' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 2. ENDPOINT LOGIN
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi!' });
  }

  try {
    // Cek keberadaan user berdasarkan username
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Username tidak ditemukan!' });
    }

    const user = userResult.rows[0];

    // Cek kesesuaian password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Password salah!' });
    }

    // Buat JWT Token yang menyimpan payload id, username, nim, dan role
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        nim: user.nim, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Token berlaku 1 hari
    );

    res.json({
      message: 'Login berhasil!',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        nim: user.nim,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;