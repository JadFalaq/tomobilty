const router = require('express').Router();
const prisma = require('../config/prisma');

router.get('/health', async (_, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ success: true, data: { status: 'ok' } });
});

module.exports = router;
