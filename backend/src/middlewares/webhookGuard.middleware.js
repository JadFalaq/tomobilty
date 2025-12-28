module.exports = (allowedIps = []) => (req, res, next) => {
  if (!allowedIps.length) return next();
  const ip = req.ip || req.connection?.remoteAddress;
  if (!allowedIps.includes(ip)) {
    req.log?.warn({ ip }, 'Webhook IP rejected');
    return res.status(403).json({
      success: false,
      error: { code: 'WEBHOOK_IP_BLOCKED', message: 'Forbidden' }
    });
  }
  next();
};
