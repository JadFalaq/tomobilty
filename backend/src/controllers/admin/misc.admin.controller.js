const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');

// Car Brands
const listCarBrands = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortOrder } = req.query;

  const result = await listEntities('carBrand', {
    page,
    pageSize,
    search,
    searchFields: ['name'],
    sortBy: sortBy || 'name',
    sortOrder: sortOrder || 'asc',
    include: {
      _count: { select: { cars: true } }
    }
  });

  res.json({ success: true, data: result });
});

const createCarBrand = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['name']);
  const data = whitelistFields(req.body, ['name', 'logo_url']);
  const brand = await createEntity('carBrand', data);
  res.status(201).json({ success: true, data: brand });
});

const updateCarBrand = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, ['name', 'logo_url']);
  const brand = await updateEntity('carBrand', req.params.id, data);
  res.json({ success: true, data: brand });
});

const deleteCarBrand = asyncHandler(async (req, res) => {
  await deleteEntity('carBrand', req.params.id);
  res.json({ success: true, message: 'Car brand deleted successfully' });
});

// Car Categories
const listCarCategories = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortOrder } = req.query;

  const result = await listEntities('carCategory', {
    page,
    pageSize,
    search,
    searchFields: ['name'],
    sortBy: sortBy || 'name',
    sortOrder: sortOrder || 'asc',
    include: {
      _count: { select: { cars: true } }
    }
  });

  res.json({ success: true, data: result });
});

const createCarCategory = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['name']);
  const data = whitelistFields(req.body, ['name', 'description']);
  const category = await createEntity('carCategory', data);
  res.status(201).json({ success: true, data: category });
});

const updateCarCategory = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, ['name', 'description']);
  const category = await updateEntity('carCategory', req.params.id, data);
  res.json({ success: true, data: category });
});

const deleteCarCategory = asyncHandler(async (req, res) => {
  await deleteEntity('carCategory', req.params.id);
  res.json({ success: true, message: 'Car category deleted successfully' });
});

// Car Images
const listCarImages = asyncHandler(async (req, res) => {
  const { page, pageSize, car_id, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (car_id) filters.car_id = parseInt(car_id);

  const result = await listEntities('carImage', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    include: {
      car: { include: { brand: true } }
    }
  });

  res.json({ success: true, data: result });
});

const createCarImage = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['car_id', 'image_url']);
  const data = whitelistFields(req.body, ['car_id', 'image_url', 'alt_text', 'is_primary']);
  if (data.car_id) data.car_id = parseInt(data.car_id);
  if (data.is_primary) {
    await prisma.carImage.updateMany({
      where: { car_id: data.car_id },
      data: { is_primary: false }
    });
  }
  const image = await createEntity('carImage', data);
  res.status(201).json({ success: true, data: image });
});

const deleteCarImage = asyncHandler(async (req, res) => {
  await deleteEntity('carImage', req.params.id);
  res.json({ success: true, message: 'Car image deleted successfully' });
});

// Booking Status
const listBookingStatuses = asyncHandler(async (req, res) => {
  const { page, pageSize, sortBy, sortOrder } = req.query;

  const result = await listEntities('bookingStatus', {
    page,
    pageSize,
    sortBy: sortBy || 'name',
    sortOrder: sortOrder || 'asc',
    include: {
      _count: { select: { bookings: true } }
    }
  });

  res.json({ success: true, data: result });
});

const createBookingStatus = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['name']);
  const data = whitelistFields(req.body, ['name', 'description']);
  const status = await createEntity('bookingStatus', data);
  res.status(201).json({ success: true, data: status });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, ['name', 'description']);
  const status = await updateEntity('bookingStatus', req.params.id, data);
  res.json({ success: true, data: status });
});

// Additional Drivers
const listAdditionalDrivers = asyncHandler(async (req, res) => {
  const { page, pageSize, booking_id, user_id, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (booking_id) filters.booking_id = parseInt(booking_id);
  if (user_id) filters.user_id = parseInt(user_id);

  const result = await listEntities('additionalDriver', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    include: {
      booking: { include: { car: true } },
      user: { select: { nom: true, prenom: true, email: true } }
    }
  });

  res.json({ success: true, data: result });
});

const createAdditionalDriver = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['booking_id', 'user_id', 'nom', 'prenom', 'permis_numero', 'permis_date']);
  const data = whitelistFields(req.body, ['booking_id', 'user_id', 'nom', 'prenom', 'permis_numero', 'permis_date']);
  if (data.booking_id) data.booking_id = parseInt(data.booking_id);
  if (data.user_id) data.user_id = parseInt(data.user_id);
  const driver = await createEntity('additionalDriver', data);
  res.status(201).json({ success: true, data: driver });
});

const deleteAdditionalDriver = asyncHandler(async (req, res) => {
  await deleteEntity('additionalDriver', req.params.id);
  res.json({ success: true, message: 'Additional driver deleted successfully' });
});

// Rental Contracts
const listRentalContracts = asyncHandler(async (req, res) => {
  const { page, pageSize, booking_id, template_id, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (booking_id) filters.booking_id = parseInt(booking_id);
  if (template_id) filters.template_id = parseInt(template_id);

  const result = await listEntities('rentalContract', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    include: {
      booking: { include: { user: true, car: true } },
      template: true
    }
  });

  res.json({ success: true, data: result });
});

const getRentalContractById = asyncHandler(async (req, res) => {
  const contract = await getEntityById('rentalContract', req.params.id, {
    booking: { include: { user: true, car: { include: { brand: true } } } },
    template: true
  });

  res.json({ success: true, data: contract });
});

// Contract Templates
const listContractTemplates = asyncHandler(async (req, res) => {
  const { page, pageSize, is_active, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (is_active !== undefined) filters.is_active = is_active === 'true';

  const result = await listEntities('contractTemplate', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    include: {
      _count: { select: { contracts: true } }
    }
  });

  res.json({ success: true, data: result });
});

const createContractTemplate = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['name', 'template', 'version']);
  const data = whitelistFields(req.body, ['name', 'template', 'version', 'is_active']);
  const template = await createEntity('contractTemplate', data);
  res.status(201).json({ success: true, data: template });
});

const updateContractTemplate = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, ['name', 'template', 'version', 'is_active']);
  const template = await updateEntity('contractTemplate', req.params.id, data);
  res.json({ success: true, data: template });
});

const deleteContractTemplate = asyncHandler(async (req, res) => {
  await deleteEntity('contractTemplate', req.params.id);
  res.json({ success: true, message: 'Contract template deleted successfully' });
});

// Insurance
const listInsurances = asyncHandler(async (req, res) => {
  const { page, pageSize, is_active, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (is_active !== undefined) filters.is_active = is_active === 'true';

  const result = await listEntities('insurance', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'name',
    sortOrder: sortOrder || 'asc'
  });

  res.json({ success: true, data: result });
});

const createInsurance = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['name', 'coverage', 'price']);
  const data = whitelistFields(req.body, ['name', 'description', 'coverage', 'price', 'is_active']);
  const insurance = await createEntity('insurance', data);
  res.status(201).json({ success: true, data: insurance });
});

const updateInsurance = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, ['name', 'description', 'coverage', 'price', 'is_active']);
  const insurance = await updateEntity('insurance', req.params.id, data);
  res.json({ success: true, data: insurance });
});

const deleteInsurance = asyncHandler(async (req, res) => {
  await deleteEntity('insurance', req.params.id);
  res.json({ success: true, message: 'Insurance deleted successfully' });
});

// Drivers
const listDrivers = asyncHandler(async (req, res) => {
  const { page, pageSize, search, sortBy, sortOrder } = req.query;

  const result = await listEntities('driver', {
    page,
    pageSize,
    search,
    searchFields: ['nom', 'prenom', 'permis_numero'],
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc'
  });

  res.json({ success: true, data: result });
});

const createDriver = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['nom', 'prenom', 'permis_numero', 'permis_date']);
  const data = whitelistFields(req.body, ['nom', 'prenom', 'permis_numero', 'permis_date']);
  const driver = await createEntity('driver', data);
  res.status(201).json({ success: true, data: driver });
});

const updateDriver = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, ['nom', 'prenom', 'permis_numero', 'permis_date']);
  const driver = await updateEntity('driver', req.params.id, data);
  res.json({ success: true, data: driver });
});

const deleteDriver = asyncHandler(async (req, res) => {
  await deleteEntity('driver', req.params.id);
  res.json({ success: true, message: 'Driver deleted successfully' });
});

// OAuth Accounts
const listOAuthAccounts = asyncHandler(async (req, res) => {
  const { page, pageSize, user_id, provider, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (user_id) filters.user_id = parseInt(user_id);
  if (provider) filters.provider = provider;

  const result = await listEntities('oauthAccount', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    include: {
      user: { select: { nom: true, prenom: true, email: true } }
    }
  });

  res.json({ success: true, data: result });
});

const deleteOAuthAccount = asyncHandler(async (req, res) => {
  await deleteEntity('oauthAccount', req.params.id);
  res.json({ success: true, message: 'OAuth account deleted successfully' });
});

// Phone Verifications
const listPhoneVerifications = asyncHandler(async (req, res) => {
  const { page, pageSize, phone, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (phone) filters.phone = { contains: phone };

  const result = await listEntities('phoneVerification', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc'
  });

  res.json({ success: true, data: result });
});

const deletePhoneVerification = asyncHandler(async (req, res) => {
  await deleteEntity('phoneVerification', req.params.id);
  res.json({ success: true, message: 'Phone verification deleted successfully' });
});

// System Settings
const listSystemSettings = asyncHandler(async (req, res) => {
  const { page, pageSize, category, search, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (category) filters.category = category;

  const result = await listEntities('systemSetting', {
    page,
    pageSize,
    search,
    searchFields: ['key', 'value'],
    filters,
    sortBy: sortBy || 'key',
    sortOrder: sortOrder || 'asc'
  });

  res.json({ success: true, data: result });
});

const getSystemSettingById = asyncHandler(async (req, res) => {
  const setting = await getEntityById('systemSetting', req.params.id);
  res.json({ success: true, data: setting });
});

const createSystemSetting = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['key', 'value', 'category']);
  const data = whitelistFields(req.body, ['key', 'value', 'category', 'updated_by']);
  if (data.updated_by) data.updated_by = parseInt(data.updated_by);
  const setting = await createEntity('systemSetting', data);
  res.status(201).json({ success: true, data: setting });
});

const updateSystemSetting = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, ['key', 'value', 'category', 'updated_by']);
  if (data.updated_by) data.updated_by = parseInt(data.updated_by);
  const setting = await updateEntity('systemSetting', req.params.id, data);
  res.json({ success: true, data: setting });
});

const deleteSystemSetting = asyncHandler(async (req, res) => {
  await deleteEntity('systemSetting', req.params.id);
  res.json({ success: true, message: 'System setting deleted successfully' });
});

// Audit Logs
const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, pageSize, admin_id, action, entity_type, date_from, date_to, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (admin_id) filters.admin_id = parseInt(admin_id);
  if (action) filters.action = action;
  if (entity_type) filters.entity_type = entity_type;
  if (date_from || date_to) {
    filters.created_at = {};
    if (date_from) filters.created_at.gte = new Date(date_from);
    if (date_to) filters.created_at.lte = new Date(date_to);
  }

  const result = await listEntities('auditLog', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc'
  });

  res.json({ success: true, data: result });
});

const getAuditLogById = asyncHandler(async (req, res) => {
  const log = await getEntityById('auditLog', req.params.id);
  res.json({ success: true, data: log });
});

// Admins
const listAdmins = asyncHandler(async (req, res) => {
  const { page, pageSize, sortBy, sortOrder } = req.query;

  const result = await listEntities('admin', {
    page,
    pageSize,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc'
  });

  res.json({ success: true, data: result });
});

const createAdmin = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['user_id', 'permissions']);
  const data = whitelistFields(req.body, ['user_id', 'permissions']);
  if (data.user_id) data.user_id = parseInt(data.user_id);
  const admin = await createEntity('admin', data);
  res.status(201).json({ success: true, data: admin });
});

const updateAdmin = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, ['permissions']);
  const admin = await updateEntity('admin', req.params.id, data);
  res.json({ success: true, data: admin });
});

const deleteAdmin = asyncHandler(async (req, res) => {
  await deleteEntity('admin', req.params.id);
  res.json({ success: true, message: 'Admin deleted successfully' });
});

module.exports = {
  listCarBrands,
  createCarBrand,
  updateCarBrand,
  deleteCarBrand,
  listCarCategories,
  createCarCategory,
  updateCarCategory,
  deleteCarCategory,
  listCarImages,
  createCarImage,
  deleteCarImage,
  listBookingStatuses,
  createBookingStatus,
  updateBookingStatus,
  listAdditionalDrivers,
  createAdditionalDriver,
  deleteAdditionalDriver,
  listRentalContracts,
  getRentalContractById,
  listContractTemplates,
  createContractTemplate,
  updateContractTemplate,
  deleteContractTemplate,
  listInsurances,
  createInsurance,
  updateInsurance,
  deleteInsurance,
  listDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  listOAuthAccounts,
  deleteOAuthAccount,
  listPhoneVerifications,
  deletePhoneVerification,
  listSystemSettings,
  getSystemSettingById,
  createSystemSetting,
  updateSystemSetting,
  deleteSystemSetting,
  listAuditLogs,
  getAuditLogById,
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin
};
