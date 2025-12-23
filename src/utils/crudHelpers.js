const prisma = require('../config/prisma');
const { AppError } = require('../middlewares/errorHandler.middleware');

/**
 * Generic list function with pagination, search, filter, and sort
 */
const listEntities = async (entityName, options = {}) => {
  const {
    page = 1,
    pageSize = 20,
    search = '',
    searchFields = [],
    filters = {},
    sortBy = 'id',
    sortOrder = 'desc',
    include = {}
  } = options;

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  // Build where clause
  const where = { ...filters };

  // Add search conditions
  if (search && searchFields.length > 0) {
    where.OR = searchFields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive'
      }
    }));
  }

  // Execute query with pagination
  const [items, total] = await Promise.all([
    prisma[entityName].findMany({
      where,
      include,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take
    }),
    prisma[entityName].count({ where })
  ]);

  return {
    items,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  };
};

/**
 * Generic get by ID function
 */
const getEntityById = async (entityName, id, include = {}) => {
  const entity = await prisma[entityName].findUnique({
    where: { id: parseInt(id) },
    include
  });

  if (!entity) {
    throw new AppError(`${entityName} not found`, 404, 'NOT_FOUND');
  }

  return entity;
};

/**
 * Generic create function
 */
const createEntity = async (entityName, data) => {
  return await prisma[entityName].create({
    data
  });
};

/**
 * Generic update function
 */
const updateEntity = async (entityName, id, data) => {
  const entity = await prisma[entityName].findUnique({
    where: { id: parseInt(id) }
  });

  if (!entity) {
    throw new AppError(`${entityName} not found`, 404, 'NOT_FOUND');
  }

  return await prisma[entityName].update({
    where: { id: parseInt(id) },
    data
  });
};

/**
 * Generic delete function with cascade warning check
 */
const deleteEntity = async (entityName, id) => {
  const entity = await prisma[entityName].findUnique({
    where: { id: parseInt(id) }
  });

  if (!entity) {
    throw new AppError(`${entityName} not found`, 404, 'NOT_FOUND');
  }

  return await prisma[entityName].delete({
    where: { id: parseInt(id) }
  });
};

/**
 * Validate required fields
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new AppError(
      `Missing required fields: ${missingFields.join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }
};

/**
 * Whitelist fields to prevent mass assignment
 */
const whitelistFields = (data, allowedFields) => {
  const whitelisted = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      whitelisted[field] = data[field];
    }
  });
  return whitelisted;
};

module.exports = {
  listEntities,
  getEntityById,
  createEntity,
  updateEntity,
  deleteEntity,
  validateRequiredFields,
  whitelistFields
};
