const rateLimit = require('express-rate-limit');

const buildLimiter = ({ windowMs, max, code, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
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

const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  code: 'RATE_LIMIT_LOGIN',
  skipSuccessfulRequests: true
});

const publicGetLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  code: 'RATE_LIMIT_PUBLIC_GET'
});

const writeLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  code: 'RATE_LIMIT_WRITE'
});

const sensitiveLimiter = buildLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  code: 'RATE_LIMIT_SENSITIVE'
});

module.exports = {
  loginLimiter,
  publicGetLimiter,
  writeLimiter,
  sensitiveLimiter,
  paymentLimiter: sensitiveLimiter
};
