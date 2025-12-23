const prisma = require('../config/prisma');

/**
 * Middleware to capture old values before update/delete operations
 */
const captureOldValues = (entityName) => {
  return async (req, res, next) => {
    try {
      if (!req.params.id) {
        return next();
      }

      const id = parseInt(req.params.id);
      const entity = await prisma[entityName].findUnique({
        where: { id }
      });

      if (entity) {
        req.oldValues = entity;
      }

      next();
    } catch (error) {
      console.error('Error capturing old values:', error);
      next();
    }
  };
};

/**
 * Middleware to log admin actions to audit log
 */
const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const logData = {
            admin_id: req.user?.id || 0,
            action,
            entity_type: entityType,
            entity_id: req.params.id ? parseInt(req.params.id) : null,
            old_values: req.oldValues ? JSON.stringify(req.oldValues) : null,
            new_values: req.body ? JSON.stringify(req.body) : null,
            ip_address: req.ip || req.connection?.remoteAddress || null,
            user_agent: req.get('user-agent') || null
          };

          await prisma.auditLog.create({ data: logData });
        } catch (error) {
          console.error('Audit log error:', error);
          // Don't fail the request if audit logging fails
        }
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  captureOldValues,
  auditLog
};
