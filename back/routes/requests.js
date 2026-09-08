const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const ScheduleSlot = require('../models/ScheduleSlot');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { sendEmail } = require('../utils/mailer');
const { formatSpanishFullDate } = require('../utils/dateFormatter');

// Get requests
router.get('/', async (req, res) => {
  try {
    const requests = await Request.findAll({
      order: [['createdAt', 'DESC'], ['id', 'DESC']]
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read requests' });
  }
});

// Helper to check if current time is within allowed range (07:00 to 16:00 America/Santiago)
function isWithinAllowedTime() {
  try {
    const options = { timeZone: 'America/Santiago', hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
    if (hour < 7 || hour >= 16) {
      return false;
    }
    return true;
  } catch (e) {
    const hour = new Date().getHours();
    if (hour < 7 || hour >= 16) {
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
        error: 'No se aceptan solicitudes fuera del horario establecido de 7AM a 16:00 y NO procesarán excepciones para asegurar su planificación.'
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
      const slotCourse = await Course.findByPk(courseId);
      const courseName = slotCourse?.name || 'Charla de Capacitación';
      const slotDate = formatSpanishFullDate(slot.date);
      const slotTime = (slot.start && slot.end) ? `${slot.start} - ${slot.end}` : (slot.start || 'Horario programado');
      const modality = slot.modality ? slot.modality.toUpperCase() : 'PRESENCIAL';

      const baseUrl = process.env.FRONT_URL ? process.env.FRONT_URL.split(',')[0].trim() : 'http://localhost:5173';
      const directAdminUrl = `${baseUrl}?tab=requests&status=pending`;

      const subject = `Nueva Solicitud de Enrolamiento - ${courseName}`;
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Capacitaciones Molycop</h2>
            <p style="color: #38bdf8; margin: 6px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Nueva Solicitud de Enrolamiento</p>
          </div>
          
          <div style="padding: 24px; color: #334155; line-height: 1.6;">
            <h3 style="color: #0f172a; font-size: 16px; margin-top: 0;">Solicitud de Enrolamiento Recibida</h3>
            <p style="font-size: 14px;">El contratista <b>${contractorName}</b> ha generado una nueva solicitud de enrolamiento para la siguiente actividad:</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><b>Curso / Charla:</b> ${courseName}</p>
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><b>Fecha de Sesión:</b> ${slotDate}</p>
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><b>Horario:</b> ${slotTime}</p>
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><b>Modalidad:</b> ${modality}</p>
              <p style="margin: 0; font-size: 13px; color: #334155;"><b>Trabajadores Solicitados:</b> ${workerArray.length}</p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${directAdminUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                Ver Solicitudes Pendientes en la Plataforma
              </a>
            </div>
            
            <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
              Mensaje automático generado por la plataforma Capacitaciones Molycop. Por favor no responda a este correo.
            </p>
          </div>
        </div>
      `;
      await sendEmail(emailTo, subject, htmlContent);
    } else {
    }

    res.json(newRequest);
  } catch (err) {
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
          throw enrollErr;
        }
      }
    }

    await request.update({ status });
    
    // SEND EMAIL ALERT
    const emailTo = process.env.NODE_ENV === 'preproduction' ? 'ipardo@inntek.cl' : request.contractorEmail;
    if (emailTo) {
      const targetSlot = await ScheduleSlot.findByPk(request.slotId, {
        include: [{ model: Course }]
      });
      const courseName = targetSlot?.Course?.name || 'Charla de Capacitación';
      const slotDate = formatSpanishFullDate(targetSlot?.date);
      const slotTime = (targetSlot?.start && targetSlot?.end) ? `${targetSlot.start} - ${targetSlot.end}` : (targetSlot?.start || 'Horario programado');
      const modality = targetSlot?.modality ? targetSlot.modality.toUpperCase() : 'PRESENCIAL';

      const statusText = status === 'approved' ? 'Aprobada' : 'Rechazada';
      const statusColor = status === 'approved' ? '#059669' : '#dc2626';
      const statusBg = status === 'approved' ? '#f0fdf4' : '#fef2f2';
      const statusBorder = status === 'approved' ? '#10b981' : '#ef4444';

      const baseUrl = process.env.FRONT_URL ? process.env.FRONT_URL.split(',')[0].trim() : 'http://localhost:5173';
      const directContractorUrl = `${baseUrl}?tab=requests&status=${status}`;

      const subject = `Solicitud de Enrolamiento ${statusText} - ${courseName}`;
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Capacitaciones Molycop</h2>
            <p style="color: #38bdf8; margin: 6px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Respuesta a Solicitud de Enrolamiento</p>
          </div>
          
          <div style="padding: 24px; color: #334155; line-height: 1.6;">
            <h3 style="color: #0f172a; font-size: 16px; margin-top: 0;">Estado de Solicitud: <span style="color: ${statusColor};">${statusText}</span></h3>
            <p style="font-size: 14px;">Estimado contratista <b>${request.contractorName}</b>, su solicitud ha sido <b>${statusText.toLowerCase()}</b> por el administrador.</p>
            
            <div style="background-color: ${statusBg}; border-left: 4px solid ${statusBorder}; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><b>Curso / Charla:</b> ${courseName}</p>
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><b>Fecha de Sesión:</b> ${slotDate}</p>
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><b>Horario:</b> ${slotTime}</p>
              <p style="margin: 0; font-size: 13px; color: #334155;"><b>Modalidad:</b> ${modality}</p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${directContractorUrl}" style="background-color: ${statusColor}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                Ver Mis Solicitudes ${statusText}s en la Plataforma
              </a>
            </div>
            
            <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
              Mensaje automático generado por la plataforma Capacitaciones Molycop. Por favor no responda a este correo.
            </p>
          </div>
        </div>
      `;
      await sendEmail(emailTo, subject, htmlContent);
    } else {
    }
    
    res.json({ success: true, status });
  } catch (err) {
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
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

module.exports = router;
