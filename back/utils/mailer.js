const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter using SendGrid credentials
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || '',
  port: process.env.MAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME || '',
    pass: process.env.MAIL_PASSWORD || '',
  },
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const fromAddress = process.env.MAIL_FROM_ADDRESS || '';
    const fromName = process.env.MAIL_FROM_NAME || '';

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`[MAILER] Correo enviado exitosamente a ${to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[MAILER] Error al enviar correo a ${to}:`, error);
    return false;
  }
};

module.exports = { sendEmail };
