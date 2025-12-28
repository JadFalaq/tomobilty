const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');

const allowedFields = ['nom', 'prenom', 'email', 'telephone', 'role', 'email_verified', 'phone_verified', 'adresse', 'permis_conduire'];

const listUsers = asyncHandler(async (req, res) => {
  const { page, pageSize, search, role, email_verified, phone_verified, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (role) filters.role = role;
  if (email_verified !== undefined) filters.email_verified = email_verified === 'true';
  if (phone_verified !== undefined) filters.phone_verified = phone_verified === 'true';

  const result = await listEntities('user', {
    page,
    pageSize,
    search,
    searchFields: ['nom', 'prenom', 'email', 'telephone'],
    filters,
    sortBy: sortBy || 'date_creation',
    sortOrder: sortOrder || 'desc',
    include: {
      loyaltyAccount: { include: { tier: true } },
      _count: { select: { bookings: true, payments: true, reviews: true } }
    }
  });

  res.json({ success: true, data: result });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await getEntityById('user', req.params.id, {
    loyaltyAccount: { include: { tier: true, transactions: true } },
    bookings: { include: { car: true, status: true } },
    payments: true,
    invoices: true,
    reviews: true,
    documents: true,
    notifications: true,
    oauthAccounts: true
  });

  res.json({ success: true, data: user });
});

const createUser = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['email', 'mot_de_passe']);
  
  const data = whitelistFields(req.body, [...allowedFields, 'mot_de_passe']);
  
  if (data.mot_de_passe) {
    data.mot_de_passe = await bcrypt.hash(data.mot_de_passe, 10);
  }

  const user = await createEntity('user', data);
  
  res.status(201).json({ success: true, data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  
  const user = await updateEntity('user', req.params.id, data);
  
  res.json({ success: true, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  await deleteEntity('user', req.params.id);
  
  res.json({ success: true, message: 'User deleted successfully' });
});

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
