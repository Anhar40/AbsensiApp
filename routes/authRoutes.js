const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Terlalu banyak percobaan login." }
});

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email dan password wajib diisi" });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: "Kredensial salah" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: "Kredensial salah" });
        }

        // 1. Regenerasi session ID baru
        req.session.regenerate((err) => {
            if (err) return res.status(500).json({ message: "Session error" });
            
            // 2. Isi data ke session
            req.session.userId = user.id;
            req.session.role = user.role;
            req.session.username = user.username;

            // 3. PAKSA simpan ke store (PENTING!)
            req.session.save((err) => {
                if (err) return res.status(500).json({ message: "Gagal menyimpan session" });
                
                // 4. Baru kirim respon ke frontend
                res.json({ 
                    message: "Login berhasil", 
                    role: user.role,
                    username: user.username 
                });
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get('/me', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ 
            loggedIn: true, 
            user: { 
                username: req.session.username, 
                role: req.session.role 
            } 
        });
    } else {
        // Status 401 berarti tidak ada session aktif
        res.status(401).json({ loggedIn: false, message: "Belum login" });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('SESS_ID').json({ message: "Logout berhasil" });
    });
});

module.exports = router;