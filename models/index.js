const User = require('./User');
const Kelas = require('./Kelas');
const Siswa = require('./Siswa');
const Guru = require('./Guru');
const Mapel = require('./Mapel');
const Jadwal = require('./Jadwal');
const Absensi = require('./Absensi');

// Relasi User (One-to-One)
User.hasOne(Siswa, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Siswa.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(Guru, { foreignKey: 'user_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Guru.belongsTo(User, { foreignKey: 'user_id' });

// Relasi Kelas (One-to-Many)
Kelas.hasMany(Siswa, { foreignKey: 'kelas_id' });
Siswa.belongsTo(Kelas, { foreignKey: 'kelas_id' });

Kelas.hasMany(Jadwal, { foreignKey: 'kelas_id' });
Jadwal.belongsTo(Kelas, { foreignKey: 'kelas_id' });

// Relasi Jadwal (Many-to-One ke Mapel dan Guru)
Mapel.hasMany(Jadwal, { foreignKey: 'mapel_id' });
Jadwal.belongsTo(Mapel, { foreignKey: 'mapel_id' });

Guru.hasMany(Jadwal, { foreignKey: 'guru_id' });
Jadwal.belongsTo(Guru, { foreignKey: 'guru_id' });

// Relasi Absensi (Many-to-One ke Siswa dan Jadwal)
Siswa.hasMany(Absensi, { foreignKey: 'siswa_id' });
Absensi.belongsTo(Siswa, { foreignKey: 'siswa_id' });

Jadwal.hasMany(Absensi, { foreignKey: 'jadwal_id' });
Absensi.belongsTo(Jadwal, { foreignKey: 'jadwal_id' });

module.exports = { User, Kelas, Siswa, Guru, Mapel, Jadwal, Absensi };