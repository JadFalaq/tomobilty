let client;

const getTwilio = () => {
  if (client) return client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  client = require('twilio')(sid, token);
  return client;
};

const sendSMS = async (to, body) => {
  const tw = getTwilio();
  if (!tw) return { sid: null };
  const from = process.env.TWILIO_FROM;
  const res = await tw.messages.create({ to, from, body });
  return { sid: res.sid };
};

module.exports = { sendSMS };
