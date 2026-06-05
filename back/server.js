const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./database/db');

// Load all models and establish associations
const models = require('./models');

const router = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Sync database (automatically creating the database if it doesn't exist)
const mysql = require('mysql2/promise');
const { resolveDatabaseConflicts } = require('./database/dbUtils');
const dbName = process.env.DB_NAME || 'capacitaflow_db';

async function initDb() {
  try {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = (dbHost !== 'localhost' && dbHost !== '127.0.0.1')
      ? 3306
      : (parseInt(process.env.DB_PORT, 10) || 3306);

    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_ROOT_PASSWORD || '',
    });
    // Use backticks for safety in case of hyphens in DB name
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
    
    // Resolve structure and data conflicts (such as ENUM differences)
    await resolveDatabaseConflicts(sequelize);
    
    await sequelize.sync({ alter: true });
    console.log('Database connected and models synced with evaluations.');
  } catch (err) {
    console.error('Failed to sync database:', err);
  }
}

initDb();

// Mount all modular routes under /api/v1
app.use('/api/v1', router);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

