const express = require('express');
const router = express.Router();
const ScheduleSlot = require('../models/ScheduleSlot');
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
      include: [{ model: Enrollment, as: 'enrollments' }]
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    // Check capacity
    const currentEnrolled = (slot.enrollments || []).length;
    const available = slot.max - currentEnrolled;

    if (workerIds.length > available) {
      return res.status(400).json({ error: 'Not enough capacity' });
    }

    // Add workers directly by inserting into Enrollments
    for (const w of workerIds) {
      const wid = typeof w === 'object' ? w.id : w;
      const wname = typeof w === 'object' ? w.name : `Trabajador ${wid}`;
      const wrut = typeof w === 'object' ? (w.rut || w.id) : wid;
      const wcargo = typeof w === 'object' ? w.cargo : null;
      const wcontractor = typeof w === 'object' ? w.contractor : null;

      await Enrollment.findOrCreate({
        where: { slotId, workerId: wid },
        defaults: {
          slotId,
          workerId: wid,
          workerName: wname,
          workerRut: wrut,
          workerCargo: wcargo,
          contractor: wcontractor,
          evaluation: 'pending'
        }
      });
    }

    const updatedSlot = await ScheduleSlot.findByPk(slotId, {
      include: [{ model: Enrollment, as: 'enrollments' }]
    });

    res.json({ success: true, enrolledCount: updatedSlot.enrollments.length });
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
