const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const ScheduleSlot = require('../models/ScheduleSlot');
const Worker = require('../models/Worker');

// Get requests
router.get('/', async (req, res) => {
  try {
    const requests = await Request.findAll();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read requests' });
  }
});

// Create request
router.post('/', async (req, res) => {
  try {
    const { slotId, courseId, contractorId, contractorName, workerIds } = req.body;

    // Optional: Validate capacity here too
    const slot = await ScheduleSlot.findByPk(slotId, {
      include: [{ model: Worker, as: 'workers', through: { attributes: [] } }]
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    const currentEnrolled = (slot.workers || slot.Workers || []).length;
    if (currentEnrolled + workerIds.length > slot.max) {
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
    console.error('API Request failed:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Update request status (Approve/Reject)
router.put('/:id', async (req, res) => {
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
      const currentEnrolled = (slot.workers || slot.Workers || []).length;
      if (currentEnrolled + request.workerIds.length > slot.max) {
        return res.status(400).json({ error: 'Ya no hay cupos suficientes para aprobar esta solicitud' });
      }

      // Auto-enroll workers (extracting IDs if stored as objects)
      const ids = [];
      for (const w of (request.workerIds || [])) {
        const wid = typeof w === 'object' ? w.id : w;
        const wname = typeof w === 'object' ? w.name : 'Trabajador Externo';
        const wrut = typeof w === 'object' ? (w.rut || w.id) : w;
        const wcontractor = typeof w === 'object' ? w.contractor : null;

        await Worker.findOrCreate({
          where: { id: wid },
          defaults: {
            id: wid,
            name: wname,
            rut: wrut,
            contractor: wcontractor
          }
        });
        ids.push(wid);
      }
      await slot.addWorkers(ids);
    }

    await request.update({ status });
    res.json({ success: true, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// Delete request
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findByPk(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    await request.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

module.exports = router;
