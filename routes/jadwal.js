const express = require('express');
const router = express.Router();
const { Jadwal, Mapel, Guru, Kelas } = require('../models/index'); 

// Middleware cek admin (sesuai contoh kamu)
const isAdmin = (req, res, next) => {
    if (req.session && req.session.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Akses ditolak. Khusus Admin!" });
    }
};

// --- 1. GET ALL JADWAL ---
router.get('/jadwal', async (req, res) => {
    try {
        const data = await Jadwal.findAll({
            include: [
                { model: Mapel, attributes: ['nama_mapel', 'kode_mapel'] },
                { model: Guru, attributes: ['nama_guru', 'nip'] },
                { model: Kelas, attributes: ['nama_kelas'] }
            ],
            order: [['hari', 'ASC'], ['jam_mulai', 'ASC']]
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data jadwal", error: error.message });
    }
});

// --- 2. POST (TAMBAH JADWAL) ---
router.post('/jadwal', isAdmin, async (req, res) => {
    const { mapel_id, guru_id, kelas_id, hari, jam_mulai, jam_selesai } = req.body;
    try {
        const newJadwal = await Jadwal.create({
            mapel_id,
            guru_id,
            kelas_id,
            hari,
            jam_mulai,
            jam_selesai
        });

        res.status(201).json({ 
            message: "Jadwal berhasil ditambahkan!", 
            data: newJadwal 
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah jadwal", error: error.message });
    }
});

// --- 3. PUT (UPDATE JADWAL) ---
router.put('/jadwal/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { mapel_id, guru_id, kelas_id, hari, jam_mulai, jam_selesai } = req.body;
    try {
        const jadwal = await Jadwal.findByPk(id);
        if (!jadwal) return res.status(404).json({ message: "Jadwal tidak ditemukan" });

        await jadwal.update({ 
            mapel_id, 
            guru_id, 
            kelas_id, 
            hari, 
            jam_mulai, 
            jam_selesai 
        });

        res.json({ message: "Jadwal berhasil diperbarui!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui jadwal", error: error.message });
    }
});

// --- 4. DELETE (HAPUS JADWAL) ---
router.delete('/jadwal/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const jadwal = await Jadwal.findByPk(id);
        if (!jadwal) return res.status(404).json({ message: "Jadwal tidak ditemukan" });

        await jadwal.destroy();

        res.json({ message: "Jadwal berhasil dihapus!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus jadwal", error: error.message });
    }
});

module.exports = router;