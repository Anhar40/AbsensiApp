const sequelize = require('../config/db'); // Pastikan nama file config benar
const { User, Kelas, Siswa, Guru, Mapel, Jadwal } = require('../models/index');
const bcrypt = require('bcrypt');

const seedDatabase = async () => {
    try {
        console.log('⏳ Starting Seeding Process...');

        // 1. Sinkronisasi Database
        // force: true akan menghapus semua tabel dan membuatnya ulang (cocok untuk reset dev)
        await sequelize.sync({ force: true });
        console.log('🔄 Database synchronized (Tables recreated)');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // 2. Buat User Admin
        await User.create({
            username: 'admin_sekolah',
            email: 'admin@sekolah.sch.id',
            password: hashedPassword,
            role: 'admin'
        });

        // 3. Buat Data Kelas
        const kelas10 = await Kelas.create({ 
            nama_kelas: 'X-IPA-1' 
        });

        // 4. Buat User & Data Guru
        const userGuru = await User.create({
            username: 'guru_budi',
            email: 'budi@sekolah.sch.id',
            password: hashedPassword,
            role: 'guru'
        });

        const guru = await Guru.create({
            user_id: userGuru.id,
            nip: '198501011234',
            nama_guru: 'Budi Handoko, S.Pd'
        });

        // 5. Buat Mata Pelajaran
        const mapelMat = await Mapel.create({
            nama_mapel: 'Matematika',
            kode_mapel: 'MTK01'
        });

        // 6. Buat Jadwal Pelajaran 
        // Contoh: Senin Jam 07:00 - 09:00
        await Jadwal.create({
            mapel_id: mapelMat.id,
            guru_id: guru.id,
            kelas_id: kelas10.id,
            hari: 'Senin',
            jam_mulai: '07:00:00',
            jam_selesai: '09:00:00'
        });

        // 7. Buat User & Data Siswa 
        const userSiswa = await User.create({
            username: 'siswa_agus',
            email: 'agus@siswa.sch.id',
            password: hashedPassword,
            role: 'siswa'
        });

        await Siswa.create({
            user_id: userSiswa.id,
            kelas_id: kelas10.id,
            nisn: '1122334455',
            nama_siswa: 'Agus Setiawan',
            barcode_data: 'SISWA001' // Kode ini yang akan di scan
        });

        console.log('✅ Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();