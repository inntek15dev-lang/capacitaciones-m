require('dotenv').config();
const { Sequelize } = require('sequelize');

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = (dbHost !== 'localhost' && dbHost !== '127.0.0.1')
  ? 3306
  : (parseInt(process.env.DB_PORT, 10) || 3306);

const sequelize = new Sequelize(
  process.env.DB_NAME || 'capacitaflow_db',
  process.env.DB_USER || 'root',
  process.env.DB_ROOT_PASSWORD || '',
  {
    host: dbHost,
    port: dbPort,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false, // Set to console.log to see SQL queries
  }
);

module.exports = sequelize;
