import { PDFDocument, rgb } from 'pdf-lib';

export async function downloadCertificate(workerName, workerRut, contractorName, inductionDate, evaluationDate) {
  try {
    const response = await fetch('/template-certificado.pdf');
    const arrayBuffer = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log('[PDF] Found form fields in template:', fields.map(f => f.getName()));

    // Parse inductionDate (expected format: YYYY-MM-DD or DD/MM/YYYY)
    let day = '', month = '', year = '';
    if (inductionDate) {
      const parts = inductionDate.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          year = parts[0];
          month = parts[1];
          day = parts[2];
        } else {
          // DD/MM/YYYY
          day = parts[0];
          month = parts[1];
          year = parts[2];
        }
      }
    }

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
      fillField('dia', day);
      fillField('mes', month);
      fillField('ano', year);
      fillField('fecha de induccion', inductionDate);
      
      try {
        const fechaField = fields.find(f => {
          const name = f.getName().toLowerCase();
          return name === 'fecha' || (name.includes('fecha') && !name.includes('induccion'));
        });
        if (fechaField) {
          form.getTextField(fechaField.getName()).setText(evaluationDate);
        }
      } catch (e) {}
      
      form.flatten();
    } else {
      // Fallback: draw text directly based on exact coordinate matching of the landscape template
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      console.log(`[PDF] Drawing text directly on A4/Letter page. Width: ${width}, Height: ${height}`);

      // Base font configuration (standard Helvetica)
      const fontSize = 10;
      const fontColor = rgb(0.1, 0.1, 0.1);

      // Relative coordinate layout matching the image layout
      // Red box (Nombre trabajador) - Row 1 left
      firstPage.drawText(workerName, {
        x: width * 0.185,
        y: height * 0.785,
        size: fontSize,
        color: fontColor
      });

      // Blue box (RUT/RUN) - Row 1 center
      firstPage.drawText(workerRut, {
        x: width * 0.445,
        y: height * 0.785,
        size: fontSize,
        color: fontColor
      });

      // Purple boxes (Fecha Induccion Dia/Mes/Año) - Row 1 right
      if (day) {
        firstPage.drawText(day, {
          x: width * 0.812,
          y: height * 0.785,
          size: fontSize,
          color: fontColor
        });
      }
      if (month) {
        firstPage.drawText(month, {
          x: width * 0.852,
          y: height * 0.785,
          size: fontSize,
          color: fontColor
        });
      }
      if (year) {
        firstPage.drawText(year, {
          x: width * 0.895,
          y: height * 0.785,
          size: fontSize,
          color: fontColor
        });
      }

      // Green box (Empresa Contratista) - Row 2 left
      firstPage.drawText(contractorName, {
        x: width * 0.185,
        y: height * 0.725,
        size: fontSize,
        color: fontColor
      });

      // Orange box (Fecha Evaluacion) - Bottom left row
      firstPage.drawText(evaluationDate, {
        x: width * 0.185,
        y: height * 0.18,
        size: fontSize,
        color: fontColor
      });
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
