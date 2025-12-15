const { OAuth2Client } = require('google-auth-library');

let client;

const getClient = () => {
  if (client) return client;
  const cid = process.env.GOOGLE_CLIENT_ID;
  client = new OAuth2Client(cid);
  return client;
};

const verifyGoogleIdToken = async (idToken) => {
  const c = getClient();
  const ticket = await c.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  return payload;
};

module.exports = { verifyGoogleIdToken };
