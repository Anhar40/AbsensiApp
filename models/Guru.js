const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Guru = sequelize.define('Guru', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Definisikan user_id secara manual agar lebih stabil
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: 'guru_user_unique'
    },
    nip: { 
        type: DataTypes.STRING(20), 
        allowNull: false,
        unique: 'guru_nip_unique'
    },
    nama_guru: { 
        type: DataTypes.STRING(100), 
        allowNull: false 
    }
}, { 
    tableName: 'gurus', 
    timestamps: false,
    underscored: true
});

module.exports = Guru;