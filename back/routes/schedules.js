const express = require('express');
const router = express.Router();
const ScheduleSlot = require('../models/ScheduleSlot');
const Enrollment = require('../models/Enrollment');
const { sendEmail } = require('../utils/mailer');

// Update schedules (Create/Update slot)
router.post('/schedules', async (req, res) => {
  try {
    const { courseId, slot, adminEmail } = req.body;

    let savedSlot;
    const existingSlot = await ScheduleSlot.findByPk(slot.id);

    if (existingSlot) {
      await existingSlot.update({
        ...slot,
        adminEmail
      });
      savedSlot = existingSlot;
    } else {
      savedSlot = await ScheduleSlot.create({
        ...slot,
        courseId,
        adminEmail
      });
    }

    res.json({ success: true, slot: savedSlot });
  } catch (err) {
    console.error('Error saving slot:', err);
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

    // SEND EMAIL ALERT TO CONTRACTORS
    // We fetch Requests associated with this slot to get contractorEmails
    const Request = require('../models/Request');
    const relatedRequests = await Request.findAll({ where: { slotId } });
    
    // Group workers by contractor
    const contractorMap = {};
    for (const reqObj of relatedRequests) {
      if (reqObj.contractorEmail) {
        contractorMap[reqObj.contractorEmail] = true;
      }
    }

    // Send email to each distinct contractor email
    const emailsToNotify = process.env.NODE_ENV === 'preproduction' 
      ? ['ipardo@inntek.cl'] 
      : Object.keys(contractorMap);
      
    const subject = `Evaluación de Charla Completada`;
    for (const cEmail of emailsToNotify) {
      const htmlContent = `
        <h3>Evaluación de Charla</h3>
        <p>Se han evaluado los trabajadores de la Charla asociada al horario <b>${slotId}</b>.</p>
        <p>Los certificados correspondientes ya se encuentran disponibles para su descarga en la plataforma.</p>
      `;
      await sendEmail(cEmail, subject, htmlContent);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save evaluations' });
  }
});

module.exports = router;
