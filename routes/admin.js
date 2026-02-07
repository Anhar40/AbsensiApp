const express = require('express');
const router = express.Router();
const { Siswa, Guru, Kelas, Absensi, Jadwal } = require('../models/index');
const { Op } = require('sequelize');

// Middleware sederhana untuk cek apakah yang akses benar-benar admin
const isAdmin = (req, res, next) => {
    if (req.session.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Akses ditolak. Khusus Admin!" });
    }
};

router.get('/stats', isAdmin, async (req, res) => {
    try {
        // 1. Hitung total dasar
        const totalSiswa = await Siswa.count();
        const totalGuru = await Guru.count();
        const totalKelas = await Kelas.count();

        // 2. Hitung absensi hari ini saja
        const hariIni = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
        const absenHariIni = await Absensi.count({
            where: {
                waktu_scan: {
                    [Op.startsWith]: hariIni
                }
            }
        });

        // 3. Ambil 5 riwayat absensi terbaru untuk ditampilkan di tabel dashboard
        const recentAbsensi = await Absensi.findAll({
            limit: 5,
            order: [['waktu_scan', 'DESC']],
            include: [
                { model: Siswa, attributes: ['nama_siswa'] },
                { model: Jadwal, include: [{ model: Kelas, attributes: ['nama_kelas'] }] }
            ]
        });

        res.json({
            summary: {
                totalSiswa,
                totalGuru,
                totalKelas,
                absenHariIni
            },
            recentAbsensi
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil data statistik" });
    }
});

module.exports = router;