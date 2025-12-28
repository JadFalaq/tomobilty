const rateLimit = require('express-rate-limit');

const buildLimiter = ({ windowMs, max, code }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_, res) => {
      res.status(429).json({
        success: false,
        error: {
          code,
          message: 'Too many requests'
        }
      });
    }
  });

module.exports = {
  authLimiter: buildLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    code: 'RATE_LIMIT_AUTH'
  }),
  paymentLimiter: buildLimiter({
    windowMs: 5 * 60 * 1000,
    max: 10,
    code: 'RATE_LIMIT_PAYMENT'
  })
};
