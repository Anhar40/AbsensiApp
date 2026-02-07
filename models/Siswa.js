const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Siswa = sequelize.define('Siswa', {
    // id tidak perlu ditulis, otomatis dibuat
    nisn: { 
        type: DataTypes.STRING(20), 
        unique: true, 
        allowNull: false 
    },
    nama_siswa: { 
        type: DataTypes.STRING(100), 
        allowNull: false 
    },
    barcode_data: { 
        type: DataTypes.STRING(255), 
        unique: true, 
        allowNull: false 
    }
}, { 
    tableName: 'siswas', 
    timestamps: true, // Aktifkan agar ada info kapan siswa didaftarkan
    underscored: true // Mengubah createdAt menjadi created_at agar sama dengan SQL
});

module.exports = Siswa;