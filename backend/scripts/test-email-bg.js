const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sendEmailVerification } = require('../src/utils/email.util');

const email = 'falaqjad7@gmail.com';
const code = '888888';

console.log('Testing email sending (Black Background Fix)...');
console.log('Target Email:', email);

if (!process.env.EMAIL_USER) {
  console.error('EMAIL_USER not found in environment variables.');
  process.exit(1);
}

sendEmailVerification(email, code)
  .then(info => {
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
  })
  .catch(err => {
    console.error('Failed to send email:', err);
  });
