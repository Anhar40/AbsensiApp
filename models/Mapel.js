const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Mapel = sequelize.define('Mapel', {
    nama_mapel: { 
        type: DataTypes.STRING(50), 
        allowNull: false 
    },
    kode_mapel: { 
        type: DataTypes.STRING(10), 
        unique: true, 
        allowNull: false 
    }
}, { 
    tableName: 'mapels', 
    timestamps: false 
});

module.exports = Mapel;