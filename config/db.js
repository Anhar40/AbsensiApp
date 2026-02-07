const { Sequelize } = require('sequelize');

require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Tes Koneksi
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log(`✅ [DATABASE] Connected using ${process.env.DB_DIALECT.toUpperCase()}`);
    } catch (error) {
        console.error('❌ [DATABASE ERROR] Unable to connect:', error.message);
    }
}

testConnection();

module.exports = sequelize;