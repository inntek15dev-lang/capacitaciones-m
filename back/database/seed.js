// ============================================================================
// SEEDER ESTRICTAMENTE NO DESTRUCTIVO
// ============================================================================
// REGLAS INVIOLABLES:
//   1. NUNCA usar `force: true` en sequelize.sync().
//   2. NUNCA ejecutar DROP DATABASE / DROP TABLE / TRUNCATE.
//   3. Solo usar `findOrCreate` para insertar datos — jamás UPDATE masivo.
//   4. Este script solo siembra USUARIOS BASE del core del sistema.
//      NO se inyectan categorías, cursos, horarios, enrollments ni solicitudes
//      de muestra. Esos datos son creados exclusivamente por los usuarios
//      reales a través de la aplicación.
// ============================================================================

const { sequelize, User } = require('../models');
const initialData = require('./initial.json');
const mysql = require('mysql2/promise');
const { resolveDatabaseConflicts } = require('./dbUtils');

const seed = async () => {
    try {
        console.log('=== SEEDER: Inicio ===');

        // ---------------------------------------------------------------
        // 1. Asegurar existencia de la base de datos (CREATE IF NOT EXISTS)
        // ---------------------------------------------------------------
        const dbName = process.env.DB_NAME || 'capacitaflow_db';
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
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await connection.end();
        console.log(`[DB] Base de datos "${dbName}" asegurada.`);

        // ---------------------------------------------------------------
        // 2. Resolver conflictos de estructura / datos antes de ALTER
        // ---------------------------------------------------------------
        await resolveDatabaseConflicts(sequelize);
        console.log('[DB] Conflictos de estructura resueltos.');

        // ---------------------------------------------------------------
        // 3. Sincronizar esquema de forma segura (ALTER, nunca DROP)
        // ---------------------------------------------------------------
        await sequelize.sync({ alter: true });
        console.log('[DB] Esquema sincronizado con alter: true.');

        // ---------------------------------------------------------------
        // 4. Sembrar SOLO usuarios base del sistema (findOrCreate)
        // ---------------------------------------------------------------
        console.log('[SEED] Creando usuarios base del sistema...');
        for (const user of initialData.users) {
            const [, created] = await User.findOrCreate({
                where: { id: user.id },
                defaults: user
            });
            if (created) {
                console.log(`  ✅ Usuario creado: ${user.username} (${user.role})`);
            } else {
                console.log(`  ⏭️  Usuario ya existe: ${user.username}`);
            }
        }

        console.log('=== SEEDER: Finalizado exitosamente ===');

    } catch (error) {
        console.error('❌ Error durante el proceso de seeding:', error);
        process.exit(1);
    }
};

const runSeed = async () => {
    await seed();
    await sequelize.close();
};

runSeed();

module.exports = seed;
