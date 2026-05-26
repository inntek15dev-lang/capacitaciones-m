const sequelize = require('../database/db');
const Category = require('../models/Category');
const Course = require('../models/Course');
const User = require('../models/User');
const Worker = require('../models/Worker');
const ScheduleSlot = require('../models/ScheduleSlot');

const seed = async () => {
    try {
        console.log('Iniciando el proceso de seeding...');
        console.log('Verificando/Creando categorías...');
        const categoriesData = [
            { id: 'cat-seg', name: 'SEGURIDAD' },
            { id: 'cat-cal', name: 'Calidad' },
            { id: 'cat-amb', name: 'Medio Ambiente' },
            { id: 'cat-ops', name: 'Operaciones' },
        ];

        for (const cat of categoriesData) {
            const [category, created] = await Category.findOrCreate({ where: { id: cat.id }, defaults: cat });
            if (created) {
                console.log(`Categoría '${category.name}' creada.`);
            }
        }
        console.log('Categorías verificadas.');

        console.log('Verificando/Creando cursos de ejemplo...');
        const coursesData = [
            { id: 'c-seg-01', name: 'Uso correcto de EPP', categoryId: 'cat-seg', maxPerSlot: 20 },
            { id: 'c-seg-02', name: 'Prevención de riesgos eléctricos', categoryId: 'cat-seg', maxPerSlot: 15 },
            { id: 'c-seg-03', name: 'Trabajo seguro en alturas', categoryId: 'cat-seg', maxPerSlot: 10, niv_id: 4068283, plantaNombre: 'Planta Principal' },
            { id: 'c-cal-01', name: 'Introducción a ISO 9001', categoryId: 'cat-cal', maxPerSlot: 25 },
            { id: 'c-amb-01', name: 'Manejo de residuos peligrosos', categoryId: 'cat-amb', maxPerSlot: 15 },
        ];
        for (const course of coursesData) {
            const [, created] = await Course.findOrCreate({ where: { id: course.id }, defaults: course });
            if (created) console.log(`Curso '${course.name}' creado.`);
        }
        console.log('Cursos verificados.');

        console.log('Verificando/Creando usuarios de prueba...');
        const usersData = [
            { id: 'user-admin', username: 'admin', password: 'admin_password', role: 'admin', name: 'Administrador' },
            { id: 'user-contratista', username: 'contratista', password: 'contra_password', role: 'contractor', name: 'Contratista Ejemplo' },
        ];
        for (const user of usersData) {
            const [, created] = await User.findOrCreate({ where: { id: user.id }, defaults: user });
            if (created) console.log(`Usuario '${user.username}' creado.`);
        }
        console.log('Usuarios verificados.');

        console.log('Verificando/Creando trabajadores de prueba...');
        const workersData = [
            { id: 'worker-001', name: 'Juan Pérez', company: 'Constructora XYZ' },
            { id: 'worker-002', name: 'Ana Gómez', company: 'Constructora XYZ' },
            { id: 'worker-003', name: 'Luis Martínez', company: 'Servicios Industriales ABC' },
        ];
        for (const worker of workersData) {
            const [, created] = await Worker.findOrCreate({ where: { id: worker.id }, defaults: worker });
            if (created) console.log(`Trabajador '${worker.name}' creado.`);
        }
        console.log('Trabajadores verificados.');

        console.log('Verificando/Creando horarios de ejemplo...');
        const slotsData = [
            { id: 'slot-001', courseId: 'c-seg-01', date: '2026-06-15', time: '09:00', max: 20, location: 'Sala 1' },
            { id: 'slot-002', courseId: 'c-seg-01', date: '2026-06-16', time: '14:00', max: 20, location: 'Sala 2' },
            { id: 'slot-003', courseId: 'c-cal-01', date: '2026-06-15', time: '11:00', max: 25, location: 'Auditorio' },
        ];
        for (const slot of slotsData) {
            const [, created] = await ScheduleSlot.findOrCreate({ where: { id: slot.id }, defaults: slot });
            if (created) console.log(`Horario para curso '${slot.courseId}' en fecha '${slot.date}' creado.`);
        }
        console.log('Horarios verificados.');

        console.log('\n--- Proceso de Seeding completado ---');
        console.log('La base de datos ha sido inicializada con datos de prueba.');
        console.log('\nCredenciales de prueba:');
        console.log('  - Administrador: admin / admin_password');
        console.log('  - Contratista:   contratista / contra_password');
        console.log('-------------------------------------\n');

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