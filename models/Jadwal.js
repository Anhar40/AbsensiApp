const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Jadwal = sequelize.define('Jadwal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    hari: { 
        type: DataTypes.ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'), 
        allowNull: false 
    },
    jam_mulai: { 
        type: DataTypes.TIME, 
        allowNull: false 
    },
    jam_selesai: { 
        type: DataTypes.TIME, 
        allowNull: false 
    }
    // Kolom mapel_id, guru_id, dan kelas_id otomatis ditambahkan oleh relasi di models/index.js
}, { 
    tableName: 'jadwals', 
    timestamps: false 
});

module.exports = Jadwal;