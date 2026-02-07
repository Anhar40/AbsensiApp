const express = require('express');
const router = express.Router();
const { Kelas, Siswa } = require('../models/index'); 

// Middleware cek admin
const isAdmin = (req, res, next) => {
    if (req.session && req.session.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Akses ditolak. Khusus Admin!" });
    }
};

// --- 1. GET ALL KELAS ---
router.get('/kelas', async (req, res) => {
    try {
        const data = await Kelas.findAll({
            // Opsional: Menghitung jumlah siswa di setiap kelas secara otomatis
            include: [{
                model: Siswa,
                attributes: ['id']
            }],
            order: [['nama_kelas', 'ASC']]
        });
        
        // Memformat data agar menampilkan jumlah siswa
        const response = data.map(k => ({
            id: k.id,
            nama_kelas: k.nama_kelas,
            jumlah_siswa: k.Siswas ? k.Siswas.length : 0
        }));

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data kelas", error: error.message });
    }
});

// --- 2. POST (TAMBAH KELAS) ---
router.post('/kelas', isAdmin, async (req, res) => {
    const { nama_kelas } = req.body;
    try {
        if (!nama_kelas) {
            return res.status(400).json({ message: "Nama kelas harus diisi!" });
        }

        const newKelas = await Kelas.create({ nama_kelas });
        res.status(201).json({ 
            message: "Kelas berhasil ditambahkan!", 
            data: newKelas 
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah kelas", error: error.message });
    }
});

// --- 3. PUT (UPDATE KELAS) ---
router.put('/kelas/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nama_kelas } = req.body;
    try {
        const kelas = await Kelas.findByPk(id);
        if (!kelas) return res.status(404).json({ message: "Kelas tidak ditemukan" });

        await kelas.update({ nama_kelas });
        res.json({ message: "Nama kelas berhasil diperbarui!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui kelas", error: error.message });
    }
});

// --- 4. DELETE (HAPUS KELAS) ---
router.delete('/kelas/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const kelas = await Kelas.findByPk(id);
        if (!kelas) return res.status(404).json({ message: "Kelas tidak ditemukan" });

        // Cek apakah ada siswa di dalam kelas ini
        const hasSiswa = await Siswa.findOne({ where: { kelas_id: id } });
        if (hasSiswa) {
            return res.status(400).json({ 
                message: "Kelas tidak bisa dihapus karena masih memiliki siswa. Pindahkan siswa terlebih dahulu!" 
            });
        }

        await kelas.destroy();
        res.json({ message: "Kelas berhasil dihapus!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus kelas", error: error.message });
    }
});

module.exports = router;