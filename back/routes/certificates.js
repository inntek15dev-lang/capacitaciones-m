const express = require('express');
const router = express.Router();
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const Enrollment = require('../models/Enrollment');
const ScheduleSlot = require('../models/ScheduleSlot');
const Course = require('../models/Course');

router.get('/:slotId/:workerId/download', async (req, res) => {
  try {
    const { slotId, workerId } = req.params;

    const enrollment = await Enrollment.findOne({
      where: { slotId, workerId },
      include: [{
        model: ScheduleSlot,
        include: [{ model: Course }]
      }]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (enrollment.evaluation !== 'passed') {
      return res.status(400).json({ error: 'El trabajador no tiene la charla aprobada' });
    }

    const templatePath = path.join(__dirname, '../assets/template-certificado.pdf');
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: 'Template PDF not found' });
    }

    // --- FUNCIONALIDAD EN STAND BY (INYECCIÓN DE DATOS) ---
    /*
    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Placeholder coordinates. The user will need to adjust these.
    // Red box: Nombre
    firstPage.drawText(enrollment.workerName || 'Sin Nombre', { x: 150, y: 500, size: 12, font, color: rgb(0, 0, 0) });
    // Blue box: RUT
    firstPage.drawText(enrollment.workerRut || 'Sin RUT', { x: 150, y: 470, size: 12, font, color: rgb(0, 0, 0) });
    // Green box: Contractor
    firstPage.drawText(enrollment.contractor || 'Sin Empresa', { x: 150, y: 440, size: 12, font, color: rgb(0, 0, 0) });
    
    // Purple boxes: Induction Date
    const scheduleDate = enrollment.ScheduleSlot ? new Date(enrollment.ScheduleSlot.date) : new Date();
    const day = String(scheduleDate.getDate()).padStart(2, '0');
    const month = String(scheduleDate.getMonth() + 1).padStart(2, '0');
    const year = String(scheduleDate.getFullYear());
    firstPage.drawText(`${day} / ${month} / ${year}`, { x: 150, y: 410, size: 12, font, color: rgb(0, 0, 0) });

    // Orange box: Evaluation Date
    const evalDate = new Date(enrollment.updatedAt);
    const eDay = String(evalDate.getDate()).padStart(2, '0');
    const eMonth = String(evalDate.getMonth() + 1).padStart(2, '0');
    const eYear = String(evalDate.getFullYear());
    firstPage.drawText(`${eDay} / ${eMonth} / ${eYear}`, { x: 150, y: 380, size: 12, font, color: rgb(0, 0, 0) });

    const pdfBytes = await pdfDoc.save();
    */
    // ------------------------------------------------------

    // Descarga directa del template original
    const pdfBytes = fs.readFileSync(templatePath);

    res.setHeader('Content-Disposition', `attachment; filename=Certificado_${enrollment.workerRut}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
