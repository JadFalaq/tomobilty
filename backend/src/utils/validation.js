const { z } = require('zod');

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

const userFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['CLIENT', 'ADMIN', 'AGENT']).optional(),
  emailVerified: z.coerce.boolean().optional(),
  phoneVerified: z.coerce.boolean().optional()
}).merge(paginationSchema).merge(dateRangeSchema);

const carFilterSchema = z.object({
  search: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE']).optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minYear: z.coerce.number().optional(),
  maxYear: z.coerce.number().optional()
}).merge(paginationSchema);

const bookingFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  userId: z.coerce.number().optional(),
  carId: z.coerce.number().optional(),
  paymentStatus: z.enum(['CREATED', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional()
}).merge(paginationSchema).merge(dateRangeSchema);

const paymentFilterSchema = z.object({
  status: z.enum(['CREATED', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  provider: z.string().optional(),
  userId: z.coerce.number().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional()
}).merge(paginationSchema).merge(dateRangeSchema);

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.validatedQuery = validated;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres de requête invalides',
        errors: error.errors
      });
    }
  };
};

const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.validatedParams = validated;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: error.errors
      });
    }
  };
};

module.exports = {
  paginationSchema,
  dateRangeSchema,
  idParamSchema,
  userFilterSchema,
  carFilterSchema,
  bookingFilterSchema,
  paymentFilterSchema,
  validateQuery,
  validateBody,
  validateParams
};
