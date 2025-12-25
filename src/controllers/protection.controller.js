const prisma = require('../config/prisma');
const { asyncHandler } = require('../middlewares/errorHandler.middleware');

const listProtections = asyncHandler(async (req, res) => {
  const protections = await prisma.protection.findMany({
    orderBy: { frais_par_jour: 'asc' }
  });
  res.json({
    success: true,
    data: { protections }
  });
});

module.exports = {
  listProtections
};
