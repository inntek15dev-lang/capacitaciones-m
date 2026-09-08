const express = require('express');
const router = express.Router();
const ScheduleSlot = require('../models/ScheduleSlot');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { sendEmail } = require('../utils/mailer');
const { formatSpanishFullDate } = require('../utils/dateFormatter');

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

    // Fetch slot & course details for human-readable email without raw IDs
    const slotObj = await ScheduleSlot.findByPk(slotId, {
      include: [{ model: Course }]
    });

    const courseName = slotObj?.Course?.name || 'Charla de Capacitación';
    const slotDate = formatSpanishFullDate(slotObj?.date);
    const slotTime = (slotObj?.start && slotObj?.end) ? `${slotObj.start} - ${slotObj.end}` : (slotObj?.start || 'Horario programado');
    const modality = slotObj?.modality ? slotObj.modality.toUpperCase() : 'PRESENCIAL';

    // Direct portal URL pre-filtered to Evaluated Requests
    const baseUrl = process.env.FRONT_URL ? process.env.FRONT_URL.split(',')[0].trim() : 'http://localhost:5173';
    const directPortalUrl = `${baseUrl}?tab=requests&status=evaluated`;

    // Send email to each distinct contractor email
    const emailsToNotify = process.env.NODE_ENV === 'preproduction' 
      ? ['ipardo@inntek.cl'] 
      : Object.keys(contractorMap);
      
    const subject = `Evaluación de Charla Completada - ${courseName}`;
    for (const cEmail of emailsToNotify) {
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Capacitaciones Molycop</h2>
            <p style="color: #38bdf8; margin: 6px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Notificación de Evaluación de Charla</p>
          </div>
          
          <div style="padding: 24px; color: #334155; line-height: 1.6;">
            <h3 style="color: #0f172a; font-size: 16px; margin-top: 0;">¡Evaluación de Charla Completada!</h3>
            <p style="font-size: 14px;">Se ha registrado el resultado de las evaluaciones para la siguiente actividad de capacitación:</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 14px 18px; margin: 18px 0; border-radius: 6px;">
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><b>Curso / Charla:</b> ${courseName}</p>
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><b>Fecha de Sesión:</b> ${slotDate}</p>
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><b>Horario:</b> ${slotTime}</p>
              <p style="margin: 0; font-size: 13px; color: #334155;"><b>Modalidad:</b> ${modality}</p>
            </div>

            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 12px; margin: 20px 0;">
              <h4 style="color: #166534; margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">📋 Pasos para Descargar Certificados:</h4>
              <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #15803d; line-height: 1.8;">
                <li>Haga clic en el botón a continuación para ingresar directamente al portal con las <b>Solicitudes Evaluadas</b> seleccionadas.</li>
                <li>En el listado, ubique la solicitud deseada y haga clic en el botón 👁️ <b>(Ver Detalle)</b>.</li>
                <li>En la ventana emergente de detalle, junto a cada trabajador con estado <b>Aprobado</b>, haga clic en el ícono de descarga 📥 <b>(Descargar Certificado)</b> para obtener el certificado PDF.</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${directPortalUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
                Ver Solicitudes Evaluadas y Descargar Certificados
              </a>
            </div>
            
            <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
              Mensaje automático generado por la plataforma Capacitaciones Molycop. Por favor no responda a este correo.
            </p>
          </div>
        </div>
      `;
      await sendEmail(cEmail, subject, htmlContent);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save evaluations' });
  }
});

module.exports = router;
