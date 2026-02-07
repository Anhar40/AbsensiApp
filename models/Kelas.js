const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Kelas = sequelize.define('Kelas', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nama_kelas: { 
        type: DataTypes.STRING(20), 
        allowNull: false 
    }
}, { 
    tableName: 'kelas', 
    timestamps: false 
});

module.exports = Kelas;