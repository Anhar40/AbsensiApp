const express = require('express');
const router = express.Router();
const { Siswa, Jadwal, Absensi, Mapel, Kelas } = require('../models/index');
const { Op } = require('sequelize');
const moment = require('moment');
require('moment/locale/id'); // npm install moment (untuk olah waktu lebih mudah)

router.post('/scan', async (req, res) => {
    try {
        const { barcode_data } = req.body;
        const now = moment(); // Waktu sekarang
        const currentTime = now.format('HH:mm:ss');
        const currentDay = now.locale('id').format('dddd'); // Pastikan locale sesuai atau mapping manual

        // 1. Cari Siswa berdasarkan barcode
        const siswa = await Siswa.findOne({ 
            where: { barcode_data },
            include: [Kelas] 
        });

        if (!siswa) {
            return res.status(404).json({ message: "Barcode tidak dikenali" });
        }

        // 2. Cari Jadwal yang sedang berlangsung untuk kelas siswa tersebut
        const jadwalAktif = await Jadwal.findOne({
            where: {
                kelas_id: siswa.kelas_id,
                hari: currentDay, // Ganti dengan variabel currentDay hasil mapping
                jam_mulai: { [Op.lte]: currentTime }, // jam_mulai <= sekarang
                jam_selesai: { [Op.gte]: currentTime } // jam_selesai >= sekarang
            },
            include: [Mapel]
        });

        if (!jadwalAktif) {
            return res.status(400).json({ message: "Tidak ada jadwal pelajaran aktif saat ini" });
        }

        // 3. Cek apakah sudah absen di jadwal ini (cegah scan berkali-kali)
        const sudahAbsen = await Absensi.findOne({
            where: {
                siswa_id: siswa.id,
                jadwal_id: jadwalAktif.id,
                waktu_scan: {
                    [Op.gte]: moment().startOf('day').toDate() // Absen di hari yang sama
                }
            }
        });

        if (sudahAbsen) {
            return res.status(400).json({ message: "Kamu sudah melakukan absensi untuk pelajaran ini" });
        }

        // 4. Logika Status (Hadir / Terlambat)
        // Misal: toleransi 15 menit dari jam_mulai
        const toleransi = moment(jadwalAktif.jam_mulai, 'HH:mm:ss').add(15, 'minutes');
        let status = 'Hadir';
        if (now.isAfter(toleransi)) {
            status = 'Terlambat';
        }

        // 5. Simpan ke Database
        await Absensi.create({
            siswa_id: siswa.id,
            jadwal_id: jadwalAktif.id,
            waktu_scan: new Date(),
            status: status
        });

        res.json({
            message: `Absensi berhasil: ${status}`,
            siswa: siswa.nama_siswa,
            pelajaran: jadwalAktif.Mapel.nama_mapel
        });

    } catch (error) {
        console.error('[SCAN ERROR]', error);
        res.status(500).json({ message: "Terjadi kesalahan sistem" });
    }
});

module.exports = router;