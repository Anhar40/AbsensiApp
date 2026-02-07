const express = require('express');
const router = express.Router();
const { Absensi, Siswa, Jadwal, Mapel, Kelas, Guru } = require('../models/index');
const { Op } = require('sequelize');

// --- 1. LAPORAN SEMUA ABSENSI (DENGAN FILTER) ---
// Bisa filter berdasarkan tanggal, kelas, atau status
router.get('/laporan/absensi', async (req, res) => {
    const { tanggal_mulai, tanggal_selesai, kelas_id, status } = req.query;
    
    let filter = {};
    
    // Filter rentang tanggal
    if (tanggal_mulai && tanggal_selesai) {
        filter.waktu_scan = {
            [Op.between]: [new Date(tanggal_mulai), new Date(tanggal_selesai)]
        };
    }

    // Filter status (Hadir, Terlambat, Alpa)
    if (status) {
        filter.status = status;
    }

    try {
        const laporan = await Absensi.findAll({
            where: filter,
            include: [
                {
                    model: Siswa,
                    attributes: ['nama_siswa', 'nisn'],
                    include: [{ model: Kelas, attributes: ['nama_kelas'] }]
                },
                {
                    model: Jadwal,
                    attributes: ['hari', 'jam_mulai'],
                    include: [{ model: Mapel, attributes: ['nama_mapel'] }]
                }
            ],
            order: [['waktu_scan', 'DESC']]
        });

        res.json({
            total_data: laporan.length,
            data: laporan
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal memuat laporan", error: error.message });
    }
});

// --- 2. REKAP ABSENSI PER SISWA (STATISTIK) ---
router.get('/laporan/statistik-siswa/:siswa_id', async (req, res) => {
    const { siswa_id } = req.params;
    try {
        const stats = await Absensi.findAll({
            where: { siswa_id },
            attributes: [
                'status',
                [Absensi.sequelize.fn('COUNT', Absensi.sequelize.col('status')), 'jumlah']
            ],
            group: ['status']
        });

        const infoSiswa = await Siswa.findByPk(siswa_id, {
            attributes: ['nama_siswa', 'nisn'],
            include: [{ model: Kelas, attributes: ['nama_kelas'] }]
        });

        res.json({
            siswa: infoSiswa,
            statistik: stats
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal memuat statistik", error: error.message });
    }
});

module.exports = router;