const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Absensi = sequelize.define('Absensi', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // siswa_id dan jadwal_id otomatis ada dari models/index.js
    waktu_scan: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    },
    status: { 
        type: DataTypes.ENUM('Hadir', 'Terlambat', 'Alpa'), 
        allowNull: false 
    },
    keterangan: { 
        type: DataTypes.TEXT,
        allowNull: true // Bisa dikosongkan jika tidak ada catatan
    }
}, { 
    tableName: 'absensis', 
    timestamps: false 
});

module.exports = Absensi;