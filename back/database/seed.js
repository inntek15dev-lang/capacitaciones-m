const { sequelize, Category, Course, User, ScheduleSlot, Enrollment, Request } = require('../models');
const initialData = require('./initial.json');
const mysql = require('mysql2/promise');

const seed = async () => {
    try {
        console.log('Iniciando el proceso de seeding desde initial.json...');
        
        // 1. Asegurar la creación de la base de datos
        const dbName = process.env.DB_NAME || 'capacitaflow_db';
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_ROOT_PASSWORD || '',
        });
        // Ensure database exists without dropping it
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await connection.end();

        // Sincronizar el esquema de forma segura sin borrar datos
        await sequelize.sync({ alter: true });

        // 2. Poblar Categorías y Cursos
        console.log('Poblando categorías y cursos...');
        for (const cat of initialData.categories) {
            const [category] = await Category.findOrCreate({ 
                where: { id: cat.id }, 
                defaults: { id: cat.id, label: cat.label } 
            });
            
            for (const course of cat.courses) {
                await Course.findOrCreate({
                    where: { id: course.id },
                    defaults: {
                        id: course.id,
                        name: course.name,
                        maxPerSlot: course.maxPerSlot,
                        categoryId: category.id
                    }
                });
            }
        }

        // 3. Poblar Usuarios
        console.log('Poblando usuarios...');
        for (const user of initialData.users) {
            await User.findOrCreate({
                where: { id: user.id },
                defaults: user
            });
        }

        // 4. Poblar Horarios (ScheduleSlots) y sus enrolados
        console.log('Poblando horarios...');
        for (const [courseId, slots] of Object.entries(initialData.schedules)) {
            for (const slot of slots) {
                const [dbSlot] = await ScheduleSlot.findOrCreate({
                    where: { id: slot.id },
                    defaults: {
                        id: slot.id,
                        courseId: courseId,
                        date: slot.date,
                        start: slot.start,
                        end: slot.end,
                        max: slot.max,
                    }
                });

                // Si tiene enrolados iniciales, asociarlos
                if (slot.enrolled && slot.enrolled.length > 0) {
                    for (const wid of slot.enrolled) {
                        await Enrollment.findOrCreate({
                            where: { slotId: slot.id, workerId: wid },
                            defaults: {
                                slotId: slot.id,
                                workerId: wid,
                                workerName: `Trabajador ${wid}`,
                                workerRut: wid,
                                evaluation: 'pending'
                            }
                        });
                    }
                }
            }
        }

        console.log('La base de datos ha sido inicializada exitosamente.');

    } catch (error) {
        console.error('Error durante el proceso de seeding:', error);
        process.exit(1);
    }
};

const runSeed = async () => {
    await seed();
    await sequelize.close();
}

runSeed();

module.exports = seed;
