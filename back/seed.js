// IEEE Trace: [REQ-TEST-DATA] | [US-SEED] | [Category, Course, User, Worker]
const sequelize = require('../database/db');
const Category = require('../models/Category');
const Course = require('../models/Course');
const User = require('../models/User');
const Worker = require('../models/Worker');
const ScheduleSlot = require('../models/ScheduleSlot');

const seed = async () => {
    try {
        console.log('Iniciando el proceso de seeding...');

        // En un entorno de producción/pre-producción, la sincronización debe ser manejada por migraciones.
        // Para desarrollo, `alter: true` o `force: true` es común, pero `force:true` es destructivo.
        // Comentamos `force:true` para hacer este script más seguro y adaptable.
        // await sequelize.sync({ force: true });
        // console.log('Base de datos sincronizada. Tablas recreadas.');

        // --- 1. Creación de Categorías ---
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

        // --- 2. Creación de Cursos (Charlas) ---
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

        // --- 3. Creación de Usuarios ---
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

        // --- 4. Creación de Trabajadores (locales) ---
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

        // --- 5. Creación de Horarios (Slots) ---
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
    // Cierra la conexión a la base de datos para que el script termine.
    await sequelize.close();
}

runSeed();

module.exports = seed;

```

### ¿Cómo usarlo?

1.  **Guarda el archivo**: Coloca el código anterior en un nuevo archivo llamado `seed.js` dentro de la carpeta `back / src`.

2.  **Añade el script a `package.json`**: Para que sea fácil de ejecutar, abre el archivo `package.json` que está en la carpeta `back / ` y agrega un script para el seeder:

    ```json
"scripts": {
    "start": "node server.js",
        "dev": "nodemon server.js",
            "seed": "node src/seed.js"
},
```

3.  **Ejecuta el seeder**: Abre una terminal en la carpeta `back / ` y ejecuta el siguiente comando. Esto borrará los datos actuales y los reemplazará con los datos de prueba.

    ```bash
    npm run seed
    ```

4.  **Inicia tu servidor**: Una vez que el seeder termine, inicia tu backend como de costumbre.

    ```bash
    npm run dev
    ```

Ahora, al recargar tu aplicación frontend, deberías ver la categoría "SEGURIDAD" y las demás que hemos agregado, junto con sus cursos asociados. ¡Espero que esto resuelva el problema!

<!--
[PROMPT_SUGGESTION]¿Cómo puedo modificar el frontend para que muestre un ícono diferente para cada categoría?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Explícame cómo funciona la relación entre Cursos, Horarios y Trabajadores en el modelo de datos.[/PROMPT_SUGGESTION]
-->