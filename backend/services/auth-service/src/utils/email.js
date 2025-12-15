const nodemailer = require('nodemailer');

let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;
  if (process.env.EMAIL_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: process.env.EMAIL_USER ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } : undefined
    });
    return transporter;
  }
  
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
  } catch (e) {
    console.warn('Failed to create Ethereal account, falling back to JSON transport:', e.message);
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
  }
  
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const t = await getTransporter();
  const from = process.env.EMAIL_FROM || 'Tomobilty <noreply@tomobilty.ma>';
  const info = await t.sendMail({ from, to, subject, html });
  const preview = nodemailer.getTestMessageUrl(info) || 'Console (JSON Transport)';
  if (!nodemailer.getTestMessageUrl(info)) {
    console.log(`[Email Mock] To: ${to}, Subject: ${subject}, Preview: ${preview}`);
  }
  return { messageId: info.messageId, previewUrl: preview };
};

module.exports = { sendEmail };
