const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Op } = require('sequelize');

// Database and Models
const sequelize = require('./database/db');
const Category = require('./models/Category');
const Course = require('./models/Course');
const Worker = require('./models/Worker');
const ScheduleSlot = require('./models/ScheduleSlot');
const Enrollment = require('./models/Enrollment');
const User = require('./models/User');
const Request = require('./models/Request');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Sync database (temporarily enabling alter: true for schema update)
sequelize.sync({ alter: true }).then(() => {
  console.log('Database connected and models synced with evaluations.');
}).catch(err => {
  console.error('Failed to sync database:', err);
});

// --- ROUTES ---

// Health check to verify server version
app.get('/api/v1/health', (req, res) => res.json({ status: 'ok', version: '2.0-proxy-priority' }));

// Proxy endpoint for external workers (ListadoTrabajadores) - MOVED HERE for priority
app.get('/api/v1/external/workers', async (req, res) => {
  const { id_cot, niv_id } = req.query;
  
  if (!id_cot || !niv_id) {
    return res.status(400).json({ error: 'Faltan parámetros id_cot o niv_id' });
  }

  console.log(`[PROXY] Consultando trabajadores externos para COT: ${id_cot}, NIV: ${niv_id}`);

  try {
    const response = await axios.post(process.env.EXTERNAL_WORKERS_API_URL, {
      cot_id: parseInt(id_cot, 10),
      niv_id: parseInt(niv_id, 10)
    }, {
      headers: { 
        'api-key': process.env.API_KEY_TRABAJADORES,
        'Content-Type': 'application/json'
      }
    });

    // La API puede devolver la lista directamente o en un campo. Manejamos ambos.
    const rawWorkers = Array.isArray(response.data) ? response.data : (response.data.trabajadores || []);
    
    const workers = rawWorkers.map(w => ({
      ...w,
      id: w.id || w.rut || `ext-${Math.random().toString(36).substr(2, 9)}`,
      niv_id: parseInt(niv_id, 10) // Mantenemos niv_id internamente para el front
    }));

    res.json(workers);
  } catch (err) {
    console.error('Error fetching external workers:', err.message);
    res.status(err.response?.status || 500).json({ 
      error: 'Error al consultar API externa',
      details: err.message 
    });
  }
});

// Get all data (for initial load)
app.get('/api/v1/data', async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Course, as: 'courses' }]
    });

    const workers = await Worker.findAll();
    
    const slots = await ScheduleSlot.findAll({
      include: [{
        model: Worker,
        as: 'workers',
        through: { attributes: ['evaluation'] } 
      }]
    });

    // Map schedules back to the course-indexed format expected by frontend
    const schedules = {};
    slots.forEach(slot => {
      if (!schedules[slot.courseId]) schedules[slot.courseId] = [];
      
      const slotJson = slot.toJSON();
      // Rename workers to enrolled for compatibility, and include evaluation
      slotJson.enrolled = slotJson.workers.map(w => ({
        id: w.id,
        evaluation: w.Enrollment.evaluation
      }));
      delete slotJson.workers;
      
      schedules[slot.courseId].push(slotJson);
    });

    const users = await User.findAll();
    const requests = await Request.findAll();

    res.json({
      categories,
      workers,
      schedules,
      users,
      requests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read database' });
  }
});

// Update schedules (Create/Update slot)
app.post('/api/v1/schedules', async (req, res) => {
  try {
    const { courseId, slot } = req.body;
    
    const newSlot = await ScheduleSlot.create({
      ...slot,
      courseId
    });
    
    res.json({ success: true, slot: newSlot });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save slot' });
  }
});

// Delete slot
app.delete('/api/v1/schedules/:courseId/:slotId', async (req, res) => {
  try {
    const { slotId } = req.params;
    await ScheduleSlot.destroy({ where: { id: slotId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete slot' });
  }
});

// Enroll workers in a slot
app.post('/api/v1/enroll', async (req, res) => {
  try {
    const { courseId, slotId, workerIds } = req.body;
    
    const slot = await ScheduleSlot.findByPk(slotId, {
        include: [{ model: Worker, as: 'workers', through: { attributes: [] } }]
    });
    
    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    
    // Check capacity
    const currentEnrolled = slot.Workers.length;
    const available = slot.max - currentEnrolled;
    
    if (workerIds.length > available) {
      return res.status(400).json({ error: 'Not enough capacity' });
    }
    
    // Add workers (Associations handle this efficiently)
    await slot.addWorkers(workerIds);
    
    const updatedSlot = await ScheduleSlot.findByPk(slotId, {
        include: [{ model: Worker, as: 'workers', through: { attributes: [] } }]
    });

    res.json({ success: true, enrolledCount: updatedSlot.workers.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to enroll workers' });
  }
});

// --- COURSES (CHARLAS) ROUTES ---

// Create course
app.post('/api/v1/courses', async (req, res) => {
  try {
    const { categoryId, name, maxPerSlot, niv_id, plantaNombre } = req.body;
    
    const newId = `c${Date.now()}`;
    const newCourse = await Course.create({
      id: newId,
      name,
      maxPerSlot: parseInt(maxPerSlot, 10) || 0,
      categoryId,
      niv_id: niv_id ? parseInt(niv_id, 10) : null,
      plantaNombre
    });
    
    res.json({ success: true, course: newCourse });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
app.put('/api/v1/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, maxPerSlot, niv_id, plantaNombre } = req.body;
    
    const course = await Course.findByPk(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    await course.update({
        name: name !== undefined ? name : course.name,
        maxPerSlot: maxPerSlot !== undefined ? parseInt(maxPerSlot, 10) : course.maxPerSlot,
        categoryId: categoryId || course.categoryId,
        niv_id: niv_id !== undefined ? (niv_id ? parseInt(niv_id, 10) : null) : course.niv_id,
        plantaNombre: plantaNombre !== undefined ? plantaNombre : course.plantaNombre
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
app.delete('/api/v1/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Course.destroy({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// --- AUTH ---
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username, password } });
    
    if (user) {
      const userJson = user.toJSON();
      delete userJson.password;
      res.json(userJson);
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- REQUESTS (SOLICITUDES) ---
app.get('/api/v1/requests', async (req, res) => {
  try {
    const requests = await Request.findAll();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read requests' });
  }
});

app.post('/api/v1/requests', async (req, res) => {
  try {
    const { slotId, courseId, contractorId, contractorName, workerIds } = req.body;
    
    // Optional: Validate capacity here too
    const slot = await ScheduleSlot.findByPk(slotId, {
      include: [{ model: Worker, as: 'workers', through: { attributes: [] } }]
    });
    
    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    if (slot.workers.length + workerIds.length > slot.max) {
      return res.status(400).json({ error: 'No hay cupos suficientes para esta solicitud' });
    }

    const newRequest = await Request.create({
      id: `req${Date.now()}`,
      status: 'pending',
      slotId,
      courseId,
      contractorId,
      contractorName,
      workerIds
    });
    
    res.json(newRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Update request status (Approve/Reject)
app.put('/api/v1/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected'
    
    const request = await Request.findByPk(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Solo se pueden modificar solicitudes pendientes' });
    }

    if (status === 'approved') {
      const slot = await ScheduleSlot.findByPk(request.slotId, {
        include: [{ model: Worker, as: 'workers', through: { attributes: [] } }]
      });
      
      if (!slot) return res.status(404).json({ error: 'Slot associated with request not found' });
      
      // Re-validate capacity
      if (slot.workers.length + request.workerIds.length > slot.max) {
        return res.status(400).json({ error: 'Ya no hay cupos suficientes para aprobar esta solicitud' });
      }
      
      // Auto-enroll workers
      await slot.addWorkers(request.workerIds);
    }
    
    await request.update({ status });
    res.json({ success: true, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

app.post('/api/v1/enrollments/evaluation', async (req, res) => {
  try {
    const { slotId, evaluations } = req.body; // Array of { workerId, status }
    
    for (const item of evaluations) {
      await Enrollment.update(
        { evaluation: item.status },
        { where: { slotId, workerId: item.workerId } }
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save evaluations' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
