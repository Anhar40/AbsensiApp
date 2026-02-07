const express = require('express');
const router = express.Router();
const { User, Siswa, Kelas, Absensi, Jadwal, Mapel } = require('../../models/index'); // Cek: pastikan 'Kelas' bukan 'Kela'
const { Op } = require('sequelize');

// Endpoint mendapatkan data profil & barcode siswa
router.get('/profil-saya', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'siswa') {
            return res.status(401).json({ message: "Sesi tidak valid atau bukan akses siswa" });
        }

        const dataSiswa = await Siswa.findOne({
            where: { user_id: req.session.userId },
            // Jika error 500 berlanjut, ganti 'Kelas' di bawah sesuai nama model di file models/Kelas.js
            include: [{ 
                model: Kelas, 
                attributes: ['nama_kelas'] 
            }]
        });

        if (!dataSiswa) {
            return res.status(404).json({ message: "Data profil siswa tidak ditemukan di tabel Siswa" });
        }

        res.json(dataSiswa);
    } catch (error) {
        console.error("Backend Error Profil:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada database", error: error.message });
    }
});

// Endpoint mendapatkan riwayat absen siswa hari ini
router.get('/presensi-hari-ini', async (req, res) => {
    try {
        const dataSiswa = await Siswa.findOne({ where: { user_id: req.session.userId } });
        
        if (!dataSiswa) return res.json([]);

        const hariIni = new Date();
        hariIni.setHours(0,0,0,0);

        const logAbsen = await Absensi.findAll({
            where: { 
                siswa_id: dataSiswa.id,
                waktu_scan: { [Op.gte]: hariIni }
            },
            include: [{ 
                model: Jadwal, 
                include: [{ model: Mapel, attributes: ['nama_mapel'] }] 
            }],
            order: [['waktu_scan', 'DESC']]
        });
        res.json(logAbsen);
    } catch (error) {
        console.error("Backend Error History:", error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/rekap-riwayat', async (req, res) => {
    try {
        const { bulan, tahun } = req.query; // Contoh: ?bulan=02&tahun=2024
        const dataSiswa = await Siswa.findOne({ where: { user_id: req.session.userId } });

        if (!dataSiswa) return res.status(404).json({ message: "Siswa tidak ditemukan" });

        // Filter berdasarkan bulan dan tahun
        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

        const riwayat = await Absensi.findAll({
            where: {
                siswa_id: dataSiswa.id,
                waktu_scan: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [{
                model: Jadwal,
                include: [{ model: Mapel, attributes: ['nama_mapel'] }]
            }],
            order: [['waktu_scan', 'DESC']]
        });

        res.json(riwayat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const bcrypt = require('bcrypt');

router.put('/update-profil', async (req, res) => {
    try {
        // PERBAIKAN: passwordBaru tidak boleh ada spasi
        const { nama_siswa, email, passwordBaru } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ message: "Sesi habis, silakan login kembali" });
        }

        // 1. Validasi: Cek apakah email sudah digunakan user lain
        const existingUser = await User.findOne({ 
            where: { 
                email: email,
                id: { [Op.ne]: userId } // Mencari email yang sama tapi bukan milik user ini
            } 
        });

        if (existingUser) {
            return res.status(400).json({ message: "Email sudah digunakan oleh pengguna lain" });
        }

        // 2. Siapkan data update untuk tabel Users
        const userUpdateData = { email };
        
        // Update password hanya jika diisi
        if (passwordBaru && passwordBaru.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            userUpdateData.password = await bcrypt.hash(passwordBaru, salt);
        }

        // Jalankan Update ke tabel Users
        await User.update(userUpdateData, { where: { id: userId } });

        // 3. Update nama di tabel Siswas
        // Pastikan nama kolom 'nama_siswa' sesuai dengan di database
        await Siswa.update(
            { nama_siswa: nama_siswa }, 
            { where: { user_id: userId } }
        );

        res.json({ message: "Profil berhasil diperbarui!" });
        
    } catch (error) {
        console.error("Error Update Profil:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat memperbarui data" });
    }
});

module.exports = router;