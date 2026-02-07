const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
require('dotenv').config(); 
const sequelize = require('./config/db'); 
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const path = require('path');
const fs = require('fs');
const adminRoutes = require('./routes/admin');
const guruRoutes = require('./routes/adminGuru');
const siswasRoutes = require('./routes/adminSiswa');
const adminMapelRoutes = require('./routes/mapel');
const adminKelasRoutes = require('./routes/kelas');
const adminJadwalRoutes = require('./routes/jadwal');
const laporanRoutes = require('./routes/laporan');

const dashboardGuruRoutes = require('./routes/guru/dashboardGuru');
const profileGuruRoutes = require('./routes/guru/profilleGuru');

const dashboardSiswaRoutes = require('./routes/siswa/dashboard');

const app = express();
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000', // Port default Vite
  credentials: true
}));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "https://cdn.tailwindcss.com", 
        "https://cdn.jsdelivr.net",      // Untuk JsBarcode
        "https://cdnjs.cloudflare.com",  // UNTUK jsPDF & FontAwesome JS
        "'unsafe-inline'"
      ],
      scriptSrcAttr: ["'unsafe-inline'"], 
      styleSrc: [
        "'self'", 
        "https://fonts.googleapis.com", 
        "https://cdnjs.cloudflare.com", // FontAwesome CSS
        "https://cdn.tailwindcss.com",
        "'unsafe-inline'"
      ],
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com", 
        "https://cdnjs.cloudflare.com"  // FontAwesome Fonts
      ],
      imgSrc: ["'self'", "data:", "https://ui-avatars.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn-icons-png.flaticon.com"
      ],
      connectSrc: ["'self'"], 
    },
  })
);

app.use(express.json());

app.use(session({
    name: 'SESS_ID',
    secret: process.env.SESSION_SECRET || 'rahasia_sekolah_123',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', 
        httpOnly: true, 
        maxAge: 3600000
    }
}));

app.use(express.static(path.join(__dirname, 'public')));
// 1. Handler untuk rute tingkat pertama (misal: /dashboard)
app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, 'public', `${page}.html`);

    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }
    next();
});

// 2. Handler untuk rute tingkat kedua/subfolder (misal: /admin/siswa)
app.get('/:folder/:page', (req, res, next) => {
    const { folder, page } = req.params;
    const filePath = path.join(__dirname, 'public', folder, `${page}.html`);

    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
    }
    next();
});

// Jika dalam mode produksi
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}


app.use('/auth', authRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/admin', adminRoutes);
app.use('/adminGuru', guruRoutes);
app.use('/adminSiswa', siswasRoutes);
app.use('/adminMapel', adminMapelRoutes);
app.use('/adminKelas', adminKelasRoutes);
app.use('/adminJadwal', adminJadwalRoutes);
app.use('/laporan', laporanRoutes);

app.use('/guru', dashboardGuruRoutes, profileGuruRoutes);
app.use('/siswa', dashboardSiswaRoutes);

// Handle 404 errors
app.use(session({
  name: 'SESS_ID',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // WAJIB FALSE jika masih HTTP (bukan HTTPS)
    httpOnly: true,
    sameSite: 'lax' // Penting untuk browser modern
  }
}));

const startServer = async () => {
    try {

        await sequelize.authenticate();
        console.log('✅ [DATABASE] Connection has been established successfully.');
        
        await sequelize.sync({ alter: true });
        console.log('📂 [DATABASE] All models were synchronized successfully.');

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 [SERVER] Server is running on port ${process.env.HOST || 'http://localhost'}:${PORT}`);
            console.log(`🛡️  [SECURITY] Helmet & Session protection active`);
        });
    } catch (error) {
        console.error('❌ [SERVER ERROR] Unable to start server:', error);
    }
};

startServer();