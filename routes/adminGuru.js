const express = require('express');
const router = express.Router();
const { Guru, User } = require('../models/index'); // Pastikan User diimport juga
const bcrypt = require('bcrypt');

// Middleware cek admin (sesuai contohmu)
const isAdmin = (req, res, next) => {
    if (req.session.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Akses ditolak. Khusus Admin!" });
    }
};

// --- 1. GET ALL GURU ---
router.get('/guru', isAdmin, async (req, res) => {
    try {
        const data = await Guru.findAll({
            include: [{ 
                model: User, 
                attributes: ['username', 'email'] // Ambil data loginnya juga
            }],
            order: [['nama_guru', 'ASC']]
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data guru", error: error.message });
    }
});

// --- 2. POST (TAMBAH GURU) ---
router.post('/guru', isAdmin, async (req, res) => {
    const { username, email, password, nip, nama_guru } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tambah ke tabel Users dulu, baru tabel Gurus
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'guru'
        });

        await Guru.create({
            user_id: newUser.id,
            nip,
            nama_guru
        });

        res.status(201).json({ message: "Data guru berhasil ditambahkan!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menambah data guru", error: error.message });
    }
});

// --- 3. PUT (UPDATE GURU) ---
router.put('/guru/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nip, nama_guru, email, username } = req.body;
    try {
        const guru = await Guru.findByPk(id);
        if (!guru) return res.status(404).json({ message: "Guru tidak ditemukan" });

        // Update data profil guru
        await guru.update({ nip, nama_guru });

        // Update data login user terkait
        await User.update(
            { email, username },
            { where: { id: guru.user_id } }
        );

        res.json({ message: "Data guru berhasil diperbarui!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui data", error: error.message });
    }
});

// --- 4. DELETE (HAPUS GURU) ---
router.delete('/guru/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const guru = await Guru.findByPk(id);
        if (!guru) return res.status(404).json({ message: "Guru tidak ditemukan" });

        // Cukup hapus User-nya. 
        // Karena di SQL kamu ada ON DELETE CASCADE, row di tabel 'gurus' otomatis hilang.
        await User.destroy({ where: { id: guru.user_id } });

        res.json({ message: "Data guru berhasil dihapus!" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus data", error: error.message });
    }
});

module.exports = router;