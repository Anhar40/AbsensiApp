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

router.get('/stats', async (req, res) => {
    try {
        const totalSiswa = await Siswa.count();
        const totalGuru = await Guru.count();
        const totalKelas = await Kelas.count();

        // Perbaikan Filter Hari Ini (Lebih Aman untuk MySQL/Postgres)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const absenHariIni = await Absensi.count({
            where: {
                waktu_scan: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        const recentAbsensi = await Absensi.findAll({
            limit: 5,
            order: [['waktu_scan', 'DESC']],
            include: [
                { 
                    model: Siswa, 
                    attributes: ['nama_siswa'],
                    required: false // Agar tetap muncul meski data siswa bermasalah
                },
                { 
                    model: Jadwal, 
                    required: false,
                    include: [{ model: Kelas, attributes: ['nama_kelas'] }] 
                }
            ]
        });

        res.json({
            summary: {
                totalSiswa: totalSiswa || 0,
                totalGuru: totalGuru || 0,
                totalKelas: totalKelas || 0,
                absenHariIni: absenHariIni || 0
            },
            recentAbsensi: recentAbsensi || []
        });
    } catch (error) {
        // SANGAT PENTING: Lihat log di Vercel untuk pesan ini!
        console.error("LOG ERROR SERVER:", error.message);
        res.status(500).json({ 
            message: "Gagal mengambil data statistik",
            debug: error.message // Hapus bagian ini jika sudah masuk tahap produksi
        });
    }
});

module.exports = router;