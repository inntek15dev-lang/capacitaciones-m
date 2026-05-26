import { PDFDocument } from 'pdf-lib';

export async function downloadCertificate(workerName, workerRut, contractorName, inductionDate, evaluationDate) {
  try {
    const response = await fetch('/template-certificado.pdf');
    const arrayBuffer = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log('[PDF] Found form fields in template:', fields.map(f => f.getName()));

    const fillField = (searchName, value) => {
      try {
        const field = fields.find(f => f.getName().toLowerCase().includes(searchName.toLowerCase()));
        if (field) {
          const textField = form.getTextField(field.getName());
          if (textField) {
            textField.setText(value);
          }
        }
      } catch (e) {
        console.error(`[PDF] Error filling field with search name "${searchName}":`, e);
      }
    };

    if (fields.length > 0) {
      fillField('nombre', workerName);
      fillField('rut', workerRut);
      fillField('empresa', contractorName);
      fillField('contratista', contractorName);
      fillField('induccion', inductionDate);
      fillField('fecha de induccion', inductionDate);
      
      // Look for field specifically named "fecha" or containing "fecha" but NOT "induccion"
      try {
        const fechaField = fields.find(f => {
          const name = f.getName().toLowerCase();
          return name === 'fecha' || (name.includes('fecha') && !name.includes('induccion'));
        });
        if (fechaField) {
          form.getTextField(fechaField.getName()).setText(evaluationDate);
        }
      } catch (e) {}
      
      // Flatten the fields so they become part of the PDF content and not editable anymore
      form.flatten();
    } else {
      // Fallback: draw text if PDF template doesn't have form fields
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      console.log(`[PDF] No form fields found. Drawing text directly on A4/Letter page. Width: ${width}, Height: ${height}`);

      // Draw text centered/aligned on the page as metadata
      firstPage.drawText(`Nombre: ${workerName}`, { x: 80, y: height - 180, size: 14 });
      firstPage.drawText(`RUT: ${workerRut}`, { x: 80, y: height - 205, size: 14 });
      firstPage.drawText(`Contratista: ${contractorName}`, { x: 80, y: height - 230, size: 14 });
      firstPage.drawText(`Fecha Inducción: ${inductionDate}`, { x: 80, y: height - 255, size: 14 });
      firstPage.drawText(`Fecha Evaluación: ${evaluationDate}`, { x: 80, y: height - 280, size: 14 });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Certificado-${workerName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('[PDF] Critical error generating PDF:', err);
    // Fallback: download template directly if pdf-lib fails completely
    const link = document.createElement('a');
    link.href = '/template-certificado.pdf';
    link.download = `Certificado-${workerName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
