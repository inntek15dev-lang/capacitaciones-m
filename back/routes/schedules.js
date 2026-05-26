const express = require('express');
const router = express.Router();
const ScheduleSlot = require('../models/ScheduleSlot');
const Worker = require('../models/Worker');
const Enrollment = require('../models/Enrollment');

// Update schedules (Create/Update slot)
router.post('/schedules', async (req, res) => {
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
router.delete('/schedules/:courseId/:slotId', async (req, res) => {
  try {
    const { slotId } = req.params;
    await ScheduleSlot.destroy({ where: { id: slotId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete slot' });
  }
});

// Enroll workers in a slot
router.post('/enroll', async (req, res) => {
  try {
    const { courseId, slotId, workerIds } = req.body;

    const slot = await ScheduleSlot.findByPk(slotId, {
      include: [{ model: Worker, as: 'workers', through: { attributes: [] } }]
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    // Check capacity
    const currentEnrolled = (slot.workers || slot.Workers || []).length;
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

// Enrollments evaluations update
router.post('/enrollments/evaluation', async (req, res) => {
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

module.exports = router;
