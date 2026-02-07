const express = require('express');
const router = express.Router();
const { Mapel } = require('../models/index'); 

// Middleware cek admin
const isAdmin = (req, res, next) => {
    if (req.session && req.session.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Akses ditolak. Khusus Admin!" });
    }
};

// --- 1. GET ALL MAPEL ---
router.get('/mapel', async (req, res) => {
    try {
        const data = await Mapel.findAll({
            order: [['nama_mapel', 'ASC']]
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data mata pelajaran", error: error.message });
    }
});

// --- 2. POST (TAMBAH MAPEL) ---
router.post('/mapel', isAdmin, async (req, res) => {
    const { nama_mapel, kode_mapel } = req.body;
    try {
        // Validasi jika kode mapel sudah ada
        const existingMapel = await Mapel.findOne({ where: { kode_mapel } });
        if (existingMapel) {
            return res.status(400).json({ message: "Kode mata pelajaran sudah digunakan!" });
        }

        const newMapel = await Mapel.create({
            nama_mapel,
            kode_mapel
        });

        res.status(201).json({ 
            message: "Mata pelajaran berhasil ditambahkan!", 
            data: newMapel 
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah mata pelajaran", error: error.message });
    }
});

// --- 3. PUT (UPDATE MAPEL) ---
router.put('/mapel/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nama_mapel, kode_mapel } = req.body;
    try {
        const mapel = await Mapel.findByPk(id);
        if (!mapel) return res.status(404).json({ message: "Mata pelajaran tidak ditemukan" });

        await mapel.update({ 
            nama_mapel, 
            kode_mapel 
        });

        res.json({ message: "Mata pelajaran berhasil diperbarui!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui mata pelajaran", error: error.message });
    }
});

// --- 4. DELETE (HAPUS MAPEL) ---
router.delete('/mapel/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const mapel = await Mapel.findByPk(id);
        if (!mapel) return res.status(404).json({ message: "Mata pelajaran tidak ditemukan" });

        // Catatan: Jika Mapel ini sudah terhubung ke Jadwal, 
        // pastikan kamu menangani constraint database agar tidak error.
        await mapel.destroy();

        res.json({ message: "Mata pelajaran berhasil dihapus!" });
    } catch (error) {
        res.status(500).json({ 
            message: "Gagal menghapus mata pelajaran. Pastikan mapel tidak sedang digunakan di tabel jadwal.", 
            error: error.message 
        });
    }
});

module.exports = router;