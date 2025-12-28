const prisma = require('../config/prisma');

const minutes = parseInt(process.env.BOOKING_PAYMENT_TIMEOUT_MINUTES || '30', 10);
const intervalMs = 60 * 1000;

const runOnce = async () => {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  await prisma.booking.updateMany({
    where: {
      status_name: 'EN_ATTENTE',
      date_creation: { lt: cutoff },
      payments: {
        none: { status: { in: ['COMPLETED'] } }
      }
    },
    data: {
      status_name: 'ANNULE'
    }
  });
};

const start = () => {
  runOnce().catch(err => { console.error('[BOOKING_CLEANUP_FAILED]', err); });
  setInterval(() => {
    runOnce().catch(err => { console.error('[BOOKING_CLEANUP_FAILED]', err); });
  }, intervalMs);
};

module.exports = { start, runOnce };
