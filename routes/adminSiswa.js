const express = require('express');
const router = express.Router();
const { Siswa, User, Kelas } = require('../models/index'); 
const bcrypt = require('bcrypt');

// Middleware cek admin
const isAdmin = (req, res, next) => {
    if (req.session.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Akses ditolak. Khusus Admin!" });
    }
};

// --- 1. GET ALL SISWA ---
router.get('/siswa', isAdmin, async (req, res) => {
    try {
        const data = await Siswa.findAll({
            include: [
                { 
                    model: User, 
                    attributes: ['username', 'email'] 
                },
                {
                    model: Kelas,
                    attributes: ['nama_kelas']
                }
            ],
            order: [['nama_siswa', 'ASC']]
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data siswa", error: error.message });
    }
});

// --- 2. POST (TAMBAH SISWA) ---
router.post('/siswa', isAdmin, async (req, res) => {
    const { username, email, password, kelas_id, nisn, nama_siswa, barcode_data } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Tambah ke tabel Users (role: siswa)
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'siswa'
        });

        // 2. Tambah ke tabel Siswas menggunakan user_id yang baru dibuat
        await Siswa.create({
            user_id: newUser.id,
            kelas_id,
            nisn,
            nama_siswa,
            barcode_data
        });

        res.status(201).json({ message: "Data siswa berhasil ditambahkan!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah data siswa", error: error.message });
    }
});

// --- 3. PUT (UPDATE SISWA) ---
router.put('/siswa/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nisn, nama_siswa, kelas_id, barcode_data, email, username } = req.body;
    try {
        const siswa = await Siswa.findByPk(id);
        if (!siswa) return res.status(404).json({ message: "Siswa tidak ditemukan" });

        // Update profil siswa
        await siswa.update({ 
            nisn, 
            nama_siswa, 
            kelas_id, 
            barcode_data 
        });

        // Update data login user terkait
        await User.update(
            { email, username },
            { where: { id: siswa.user_id } }
        );

        res.json({ message: "Data siswa berhasil diperbarui!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui data", error: error.message });
    }
});

// --- 4. DELETE (HAPUS SISWA) ---
router.delete('/siswa/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const siswa = await Siswa.findByPk(id);
        if (!siswa) return res.status(404).json({ message: "Siswa tidak ditemukan" });

        // Menghapus User akan otomatis menghapus Siswa karena ON DELETE CASCADE di database
        await User.destroy({ where: { id: siswa.user_id } });

        res.json({ message: "Data siswa berhasil dihapus!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus data", error: error.message });
    }
});

module.exports = router;