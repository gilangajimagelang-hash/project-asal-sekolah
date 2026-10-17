const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, verifyRole } = require('../middleware/auth');

// 1. GET ALL: Ambil Semua Data Asal Sekolah (Publik / Mahasiswa bisa lihat tanpa login)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM asalsekolah ORDER BY id DESC');
    res.json({
      status: 'success',
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET BY ID: Ambil Data Berdasarkan ID (Publik / Mahasiswa bisa lihat tanpa login)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM asalsekolah WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Data asal sekolah tidak ditemukan' });
    }
    res.json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST: Tambah Data Asal Sekolah Baru (Khusus Admin)
router.post('/', verifyToken, verifyRole(['admin']), async (req, res) => {
  const { nama_sekolah, jenis_sekolah, kabupaten } = req.body;

  // Validasi opsi jenis_sekolah sesuai CHECK constraint ('SMA', 'SMK', 'MA')
  if (jenis_sekolah && !['SMA', 'SMK', 'MA'].includes(jenis_sekolah)) {
    return res.status(400).json({ 
      message: "jenis_sekolah harus berupa 'SMA', 'SMK', atau 'MA'" 
    });
  }

  try {
    const newRecord = await pool.query(
      `INSERT INTO asalsekolah (nama_sekolah, jenis_sekolah, kabupaten)
       VALUES ($1, $2, $3) RETURNING *`,
      [nama_sekolah, jenis_sekolah, kabupaten]
    );

    res.status(201).json({
      message: 'Data asal sekolah berhasil ditambahkan',
      data: newRecord.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT: Update Data Asal Sekolah Berdasarkan ID (Khusus Admin)
router.put('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { nama_sekolah, jenis_sekolah, kabupaten } = req.body;

  if (jenis_sekolah && !['SMA', 'SMK', 'MA'].includes(jenis_sekolah)) {
    return res.status(400).json({ 
      message: "jenis_sekolah harus berupa 'SMA', 'SMK', atau 'MA'" 
    });
  }

  try {
    const updatedRecord = await pool.query(
      `UPDATE asalsekolah 
       SET nama_sekolah = $1, jenis_sekolah = $2, kabupaten = $3
       WHERE id = $4 RETURNING *`,
      [nama_sekolah, jenis_sekolah, kabupaten, id]
    );

    if (updatedRecord.rows.length === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }

    res.json({
      message: 'Data asal sekolah berhasil diperbarui',
      data: updatedRecord.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE: Hapus Data Asal Sekolah (Khusus Admin)
router.delete('/:id', verifyToken, verifyRole(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM asalsekolah WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }

    res.json({ message: 'Data asal sekolah berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;