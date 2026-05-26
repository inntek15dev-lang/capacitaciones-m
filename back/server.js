const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./database/db');
const router = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Sync database (automatically creating the database if it doesn't exist)
const mysql = require('mysql2/promise');
const dbName = process.env.DB_NAME || 'capacitaflow_db';

async function initDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_ROOT_PASSWORD || '',
    });
    // Use backticks for safety in case of hyphens in DB name
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
    
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

