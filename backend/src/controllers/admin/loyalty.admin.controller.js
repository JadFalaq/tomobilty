const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');
const prisma = require('../../config/prisma');

// Loyalty Accounts
const listLoyaltyAccounts = asyncHandler(async (req, res) => {
  const { page, pageSize, user_id, tier_id, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (user_id) filters.user_id = parseInt(user_id);
  if (tier_id) filters.tier_id = parseInt(tier_id);

  const result = await listEntities('loyaltyAccount', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    include: {
      user: { select: { nom: true, prenom: true, email: true } },
      tier: true,
      _count: { select: { transactions: true } }
    }
  });

  res.json({ success: true, data: result });
});

const getLoyaltyAccountById = asyncHandler(async (req, res) => {
  const account = await getEntityById('loyaltyAccount', req.params.id, {
    user: true,
    tier: true,
    transactions: { orderBy: { created_at: 'desc' }, take: 50 }
  });

  res.json({ success: true, data: account });
});

// Loyalty Tiers
const listLoyaltyTiers = asyncHandler(async (req, res) => {
  const { page, pageSize, sortBy, sortOrder } = req.query;

  const result = await listEntities('loyaltyTier', {
    page,
    pageSize,
    sortBy: sortBy || 'min_points',
    sortOrder: sortOrder || 'asc',
    include: {
      _count: { select: { loyaltyAccounts: true } }
    }
  });

  res.json({ success: true, data: result });
});

const createLoyaltyTier = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['name', 'min_points', 'discount_percent']);
  
  const data = whitelistFields(req.body, ['name', 'min_points', 'discount_percent', 'benefits']);
  
  if (data.min_points) data.min_points = parseInt(data.min_points);

  const tier = await createEntity('loyaltyTier', data);
  
  res.status(201).json({ success: true, data: tier });
});

const updateLoyaltyTier = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, ['name', 'min_points', 'discount_percent', 'benefits']);
  
  if (data.min_points) data.min_points = parseInt(data.min_points);
  
  const tier = await updateEntity('loyaltyTier', req.params.id, data);
  
  res.json({ success: true, data: tier });
});

const deleteLoyaltyTier = asyncHandler(async (req, res) => {
  await deleteEntity('loyaltyTier', req.params.id);
  
  res.json({ success: true, message: 'Loyalty tier deleted successfully' });
});

// Loyalty Rewards
const listLoyaltyRewards = asyncHandler(async (req, res) => {
  const { page, pageSize, is_active, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (is_active !== undefined) filters.is_active = is_active === 'true';

  const result = await listEntities('loyaltyReward', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc'
  });

  res.json({ success: true, data: result });
});

const createLoyaltyReward = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['name', 'points_cost', 'reward_type']);
  
  const data = whitelistFields(req.body, ['name', 'description', 'points_cost', 'reward_type', 'reward_value', 'is_active']);
  
  if (data.points_cost) data.points_cost = parseInt(data.points_cost);

  const reward = await createEntity('loyaltyReward', data);
  
  res.status(201).json({ success: true, data: reward });
});

const updateLoyaltyReward = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, ['name', 'description', 'points_cost', 'reward_type', 'reward_value', 'is_active']);
  
  if (data.points_cost) data.points_cost = parseInt(data.points_cost);
  
  const reward = await updateEntity('loyaltyReward', req.params.id, data);
  
  res.json({ success: true, data: reward });
});

const deleteLoyaltyReward = asyncHandler(async (req, res) => {
  await deleteEntity('loyaltyReward', req.params.id);
  
  res.json({ success: true, message: 'Loyalty reward deleted successfully' });
});

// Loyalty Transactions
const listLoyaltyTransactions = asyncHandler(async (req, res) => {
  const { page, pageSize, loyalty_account_id, transaction_type, sortBy, sortOrder } = req.query;
  
  const filters = {};
  if (loyalty_account_id) filters.loyalty_account_id = parseInt(loyalty_account_id);
  if (transaction_type) filters.transaction_type = transaction_type;

  const result = await listEntities('loyaltyTransaction', {
    page,
    pageSize,
    filters,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'desc',
    include: {
      loyaltyAccount: { include: { user: { select: { nom: true, prenom: true, email: true } } } },
      booking: true
    }
  });

  res.json({ success: true, data: result });
});

module.exports = {
  listLoyaltyAccounts,
  getLoyaltyAccountById,
  listLoyaltyTiers,
  createLoyaltyTier,
  updateLoyaltyTier,
  deleteLoyaltyTier,
  listLoyaltyRewards,
  createLoyaltyReward,
  updateLoyaltyReward,
  deleteLoyaltyReward,
  listLoyaltyTransactions
};
