const express = require('express');
const router = express.Router();
const { Guru, User, Jadwal, Mapel, Kelas, Absensi, Siswa } = require('../../models/index');
const { Op } = require('sequelize');

// Middleware Cek Role Guru
const isGuru = (req, res, next) => {
    if (req.session && req.session.role === 'guru') {
        next();
    } else {
        res.status(403).json({ message: "Akses ditolak. Khusus Guru!" });
    }
};

// --- 1. GET DASHBOARD DATA (DATA UTAMA) ---
router.get('/guru/dashboard', isGuru, async (req, res) => {
    try {
        const userId = req.session.userId;
        const guru = await Guru.findOne({ where: { user_id: userId } });
        
        if (!guru) return res.status(404).json({ message: "Data guru tidak ditemukan" });

        // A. Ambil Jadwal Hari Ini
        const hariIni = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()];
        const jadwalHariIni = await Jadwal.findAll({
            where: { guru_id: guru.id, hari: hariIni },
            include: [
                { model: Mapel, attributes: ['nama_mapel'] },
                { model: Kelas, attributes: ['nama_kelas'] }
            ],
            order: [['jam_mulai', 'ASC']]
        });

        // B. Cari Kelas yang Sedang Berlangsung (Current Class)
        const sekarang = new Date().toLocaleTimeString('id-ID', { hour12: false }); // Format "HH:mm:ss"
        const currentClass = jadwalHariIni.find(j => 
            sekarang >= j.jam_mulai && sekarang <= j.jam_selesai
        );

        // C. Statistik Kehadiran Hari Ini (Total Siswa yang sudah di-absen oleh Guru ini)
        const totalHadir = await Absensi.count({
            include: [{
                model: Jadwal,
                where: { guru_id: guru.id }
            }],
            where: {
                waktu_scan: {
                    [Op.gte]: new Date().setHours(0,0,0,0) // Mulai jam 00:00 hari ini
                }
            }
        });

        res.json({
            guru: {
                nama: guru.nama_guru,
                nip: guru.nip
            },
            currentClass: currentClass || null,
            jadwalHariIni,
            stats: {
                hadir_hari_ini: totalHadir
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Gagal memuat dashboard", error: error.message });
    }
});

// --- 2. GET JADWAL MENGAJAR LENGKAP ---
router.get('/guru/my-schedule', isGuru, async (req, res) => {
    try {
        const guru = await Guru.findOne({ where: { user_id: req.session.userId } });
        const jadwal = await Jadwal.findAll({
            where: { guru_id: guru.id },
            include: [
                { model: Mapel, attributes: ['nama_mapel', 'kode_mapel'] },
                { model: Kelas, attributes: ['nama_kelas'] }
            ],
            order: [['hari', 'ASC'], ['jam_mulai', 'ASC']]
        });
        res.json(jadwal);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil jadwal", error: error.message });
    }
});

// --- 3. GET RIWAYAT ABSENSI KELAS (Dibuat oleh Guru ini) ---
router.get('/guru/history', isGuru, async (req, res) => {
    try {
        const guru = await Guru.findOne({ where: { user_id: req.session.userId } });
        const history = await Absensi.findAll({
            limit: 20,
            include: [
                {
                    model: Jadwal,
                    where: { guru_id: guru.id },
                    attributes: ['jam_mulai'],
                    include: [
                        { model: Mapel, attributes: ['nama_mapel'] },
                        { model: Kelas, attributes: ['nama_kelas'] }
                    ]
                },
                { model: Siswa, attributes: ['nama_siswa'] }
            ],
            order: [['waktu_scan', 'DESC']]
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil riwayat", error: error.message });
    }
});

module.exports = router;