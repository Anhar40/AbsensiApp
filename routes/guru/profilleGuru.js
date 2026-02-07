const express = require('express');
const router = express.Router();
const { Guru, User, Jadwal, Mapel, Kelas, Absensi, Siswa } = require('../../models/index');
const bcrypt = require('bcrypt');

// Middleware: Pastikan hanya Guru yang login yang bisa akses
const isGuru = (req, res, next) => {
    if (req.session && req.session.role === 'guru') {
        next();
    } else {
        res.status(403).json({ message: "Akses ditolak!" });
    }
};

// --- 1. AMBIL DATA PROFILE ---
router.get('/my-profile', isGuru, async (req, res) => {
    try {
        const profile = await Guru.findOne({
            where: { user_id: req.session.userId },
            include: [{
                model: User,
                attributes: ['username', 'email', 'created_at']
            }]
        });

        if (!profile) return res.status(404).json({ message: "Data tidak ditemukan" });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// --- 2. UPDATE PROFILE (Identitas & Akun) ---
router.put('/update-profile', isGuru, async (req, res) => {
    const { nama_guru, username, email, password_lama, password_baru } = req.body;
    
    try {
        // Cari user dan guru berdasarkan session
        const user = await User.findByPk(req.session.userId);
        const guru = await Guru.findOne({ where: { user_id: req.session.userId } });

        if (!user || !guru) return res.status(404).json({ message: "User tidak ditemukan" });

        // A. Update Data Identitas (Tabel gurus)
        if (nama_guru) guru.nama_guru = nama_guru;
        await guru.save();

        // B. Update Data Akun Dasar (Tabel users)
        if (username) user.username = username;
        if (email) user.email = email;

        // C. Logika Ganti Password (Jika mengisi password_baru)
        if (password_baru && password_baru.trim() !== "") {
            // Validasi: Harus mengisi password_lama untuk ganti ke yang baru
            if (!password_lama) {
                return res.status(400).json({ message: "Masukkan password lama untuk ganti password" });
            }

            // Cek apakah password lama benar
            const match = await bcrypt.compare(password_lama, user.password);
            if (!match) {
                return res.status(401).json({ message: "Password lama salah!" });
            }

            // Hash password baru
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password_baru, salt);
        }

        await user.save();

        res.json({ 
            success: true, 
            message: "Profile berhasil diperbarui!",
            data: { nama: guru.nama_guru, email: user.email }
        });

    } catch (error) {
        // Cek jika username/email sudah dipakai orang lain (Unique constraint)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: "Username atau Email sudah digunakan" });
        }
        res.status(500).json({ message: "Gagal update profile", error: error.message });
    }
});

const { Op } = require('sequelize');

router.get('/jadwal/saya', async (req, res) => {
    try {
        // 1. Cek Session
        if (!req.session.userId) {
            return res.status(401).json({ message: "Sesi habis, silakan login kembali" });
        }

        // 2. Cari data guru berdasarkan user_id di session
        const guru = await Guru.findOne({ 
            where: { user_id: req.session.userId } 
        });

        if (!guru) {
            return res.status(404).json({ message: "Data guru tidak ditemukan" });
        }

        // 3. Ambil jadwal milik guru tersebut
        const data = await Jadwal.findAll({
            where: { guru_id: guru.id },
            include: [
                { 
                    model: Mapel, 
                    attributes: ['nama_mapel', 'kode_mapel'] 
                },
                { 
                    model: Kelas, 
                    attributes: ['nama_kelas'] 
                }
            ],
            order: [
                ['hari', 'ASC'], 
                ['jam_mulai', 'ASC']
            ]
        });

        res.json(data);
    } catch (error) {
        // Ini akan muncul di terminal VS Code Anda jika ada error lagi
        console.error("ERROR JADWAL SAYA:", error); 
        res.status(500).json({ 
            message: "Gagal mengambil data jadwal", 
            error: error.message 
        });
    }
});

// Pastikan Op di-import di bagian atas file

router.get('/rekap/:jadwal_id', async (req, res) => {
    try {
        const { jadwal_id } = req.params;
        const { start, end } = req.query;

        let dateFilter;

        if (start && end) {
            // Jika ada filter tanggal dari frontend (format: YYYY-MM-DD)
            const startDate = new Date(start);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999);

            dateFilter = {
                [Op.between]: [startDate, endDate]
            };
        } else {
            // Default jika tidak ada filter: Hanya hari ini
            const hariIniMulai = new Date();
            hariIniMulai.setHours(0, 0, 0, 0);

            const hariIniSelesai = new Date();
            hariIniSelesai.setHours(23, 59, 59, 999);

            dateFilter = {
                [Op.between]: [hariIniMulai, hariIniSelesai]
            };
        }

        const data = await Absensi.findAll({
            where: {
                jadwal_id: jadwal_id,
                waktu_scan: dateFilter
            },
            include: [
                { 
                    model: Siswa, 
                    attributes: ['nama_siswa', 'nisn'] 
                }
            ],
            order: [['waktu_scan', 'DESC']]
        });

        res.json(data);
    } catch (error) {
        console.error("Error Rekap:", error);
        res.status(500).json({ 
            message: "Gagal memuat rekap", 
            error: error.message 
        });
    }
});
module.exports = router;