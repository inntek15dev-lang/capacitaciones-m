const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const ScheduleSlot = require('../models/ScheduleSlot');
const Enrollment = require('../models/Enrollment');
const { sendEmail } = require('../utils/mailer');

// Get requests
router.get('/', async (req, res) => {
  try {
    const requests = await Request.findAll();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read requests' });
  }
});

// Helper to check if current time is within allowed range (07:00 to 17:00 America/Santiago)
function isWithinAllowedTime() {
  try {
    const options = { timeZone: 'America/Santiago', hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
    if (hour < 7 || hour >= 17) {
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error checking time restrictions:', e);
    const hour = new Date().getHours();
    if (hour < 7 || hour >= 17) {
      return false;
    }
    return true;
  }
}

// Create request
router.post('/', async (req, res) => {
  try {
    if (!isWithinAllowedTime()) {
      return res.status(400).json({
        error: 'No se aceptan solicitudes fuera del horario establecido de 7AM a 17:00 y NO procesarán excepciones para asegurar su planificación.'
      });
    }

    const { slotId, courseId, contractorId, contractorName, contractorEmail, workerIds } = req.body;

    const slot = await ScheduleSlot.findByPk(slotId, {
      include: [{ model: Enrollment, as: 'enrollments' }]
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    const currentEnrolled = (slot.enrollments || []).length;
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
      contractorEmail, // Saved to DB
      workerIds
    });

    // SEND EMAIL ALERT TO ADMIN
    const emailTo = process.env.NODE_ENV === 'preproduction' ? 'psolis@inntek.cl' : slot.adminEmail;
    if (emailTo) {
      const subject = `Solicitud de Enrolamiento para Charla`;
      const htmlContent = `
        <h3>Nueva Solicitud de Enrolamiento</h3>
        <p>Se ha generado una nueva solicitud de enrolamiento por parte del contratista <b>${contractorName}</b>.</p>
        <p><b>Horario (Slot ID):</b> ${slotId}</p>
        <p>Por favor revise y apruebe/rechace la solicitud en la plataforma.</p>
      `;
      await sendEmail(emailTo, subject, htmlContent);
    } else {
      console.warn(`No adminEmail found to send notification for slot ${slotId}`);
    }

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
        include: [{ model: Enrollment, as: 'enrollments' }]
      });

      if (!slot) return res.status(404).json({ error: 'Slot associated with request not found' });

      let workerArray = [];
      if (typeof request.workerIds === 'string') {
        try { workerArray = JSON.parse(request.workerIds); } catch(e) { workerArray = []; }
      } else {
        workerArray = request.workerIds || [];
      }

      // Re-validate capacity
      const currentEnrolled = (slot.enrollments || []).length;
      if (currentEnrolled + workerArray.length > slot.max) {
        return res.status(400).json({ error: 'Ya no hay cupos suficientes para aprobar esta solicitud' });
      }

      // Auto-enroll workers
      for (const w of workerArray) {
        const wid = typeof w === 'object' ? w.id : w;
        const wname = typeof w === 'object' ? (w.name || 'Trabajador Externo') : 'Trabajador Externo';
        const wrut = typeof w === 'object' ? (w.rut || w.id) : w;
        const wcargo = typeof w === 'object' ? (w.cargo || null) : null;
        const wcontractor = typeof w === 'object' ? (w.contractor || request.contractorName) : request.contractorName;

        try {
          await Enrollment.findOrCreate({
            where: { slotId: request.slotId, workerId: String(wid) },
            defaults: {
              slotId: request.slotId,
              workerId: String(wid),
              workerName: String(wname),
              workerRut: String(wrut),
              workerCargo: wcargo ? String(wcargo) : null,
              contractor: String(wcontractor),
              evaluation: 'pending'
            }
          });
        } catch (enrollErr) {
          console.error("Error creating enrollment for worker:", wid, enrollErr);
          throw enrollErr;
        }
      }
    }

    await request.update({ status });
    
    // SEND EMAIL ALERT
    const emailTo = process.env.NODE_ENV === 'preproduction' ? 'ipardo@inntek.cl' : request.contractorEmail;
    if (emailTo) {
      const statusText = status === 'approved' ? 'Aprobada' : 'Rechazada';
      const subject = `Solicitud de Enrolamiento ${statusText}`;
      const htmlContent = `
        <h3>Solicitud de Enrolamiento ${statusText}</h3>
        <p>Su solicitud para la charla en el horario <b>${request.slotId}</b> ha sido <b>${statusText}</b> por el administrador.</p>
      `;
      await sendEmail(emailTo, subject, htmlContent);
    } else {
      console.warn(`No contractorEmail found to send notification for request ${request.id}`);
    }
    
    res.json({ success: true, status });
  } catch (err) {
    console.error('Failed to update request status:', err);
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
