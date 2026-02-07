const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        // Memberikan nama index spesifik mencegah Sequelize membuat index baru terus-menerus
        unique: 'users_username_unique'
    },
    email: {
        type: DataTypes.STRING(100), // Batasi panjang karakter
        allowNull: false,
        unique: 'users_email_unique',
        validate: {
            isEmail: true 
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'guru', 'siswa'),
        allowNull: false
    }
}, {
    tableName: 'users',
    timestamps: true,
    // PENTING: underscored mengubah createdAt/updatedAt menjadi created_at/updated_at
    // Ini menyelesaikan error "Incorrect datetime value"
    underscored: true 
});

module.exports = User;