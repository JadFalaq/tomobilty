const prisma = require('../config/prisma');
const { AppError, asyncHandler } = require('../middlewares/errorHandler.middleware');
const contractService = require('../services/contract.service');
const { sendContractEmail } = require('../utils/email.util');
const path = require('path');
const fs = require('fs').promises;

// Get contract by booking ID
const getContractByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  // Verify booking belongs to user
  const booking = await prisma.booking.findFirst({
    where: {
      id: parseInt(bookingId),
      user_id: req.user.id
    }
  });

  if (!booking) {
    throw new AppError('Réservation non trouvée', 404, 'BOOKING_NOT_FOUND');
  }

  const contract = await prisma.rentalContract.findUnique({
    where: { booking_id: parseInt(bookingId) },
    include: {
      booking: {
        include: {
          car: {
            include: {
              brand: true
            }
          },
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true
            }
          }
        }
      },
      template: true
    }
  });

  if (!contract) {
    throw new AppError('Contrat non trouvé', 404, 'CONTRACT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: { contract }
  });
});

// Generate contract for booking
const generateContract = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { template_id = 1 } = req.body;

  // Verify booking belongs to user
  const booking = await prisma.booking.findFirst({
    where: {
      id: parseInt(bookingId),
      user_id: req.user.id
    },
    include: {
      user: true,
      car: {
        include: {
          brand: true
        }
      },
      status: true
    }
  });

  if (!booking) {
    throw new AppError('Réservation non trouvée', 404, 'BOOKING_NOT_FOUND');
  }

  // Check if booking is confirmed
  if (booking.status.name !== 'CONFIRMED') {
    throw new AppError('Le contrat ne peut être généré que pour les réservations confirmées', 400, 'BOOKING_NOT_CONFIRMED');
  }

  // Check if contract already exists
  const existingContract = await prisma.rentalContract.findUnique({
    where: { booking_id: parseInt(bookingId) }
  });

  if (existingContract) {
    throw new AppError('Un contrat existe déjà pour cette réservation', 400, 'CONTRACT_EXISTS');
  }

  // Validate driver's license (must be at least 2 years old)
  if (!booking.user.permis_conduire) {
    throw new AppError('Informations du permis de conduire manquantes', 400, 'MISSING_LICENSE_INFO');
  }

  try {
    // Generate contract
    const result = await contractService.generateRentalContract(parseInt(bookingId), parseInt(template_id));

    // Send contract by email
    try {
      await sendContractEmail(booking.user.email, result.pdfPath, booking);
    } catch (emailError) {
      console.error('Failed to send contract email:', emailError);
      // Don't fail contract generation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Contrat généré avec succès',
      data: {
        contract: result.contract,
        contract_number: result.contractData.contract_number
      }
    });
  } catch (error) {
    console.error('Contract generation error:', error);
    throw new AppError('Erreur lors de la génération du contrat', 500, 'CONTRACT_GENERATION_ERROR');
  }
});

// Download contract PDF
const downloadContract = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contract = await prisma.rentalContract.findFirst({
    where: { id: parseInt(id) },
    include: {
      booking: {
        where: {
          user_id: req.user.id
        }
      }
    }
  });

  if (!contract || !contract.booking) {
    throw new AppError('Contrat non trouvé', 404, 'CONTRACT_NOT_FOUND');
  }

  const filePath = path.join(process.cwd(), 'public', contract.pdf_path);

  try {
    await fs.access(filePath);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contrat-${contract.contract_number}.pdf"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    throw new AppError('Fichier de contrat non trouvé', 404, 'CONTRACT_FILE_NOT_FOUND');
  }
});

// Get all contracts (Admin only)
const getAllContracts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, user_id, booking_id } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (user_id) {
    where.booking = {
      user_id: parseInt(user_id)
    };
  }

  if (booking_id) {
    where.booking_id = parseInt(booking_id);
  }

  const [contracts, total] = await Promise.all([
    prisma.rentalContract.findMany({
      where,
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true
              }
            },
            car: {
              include: {
                brand: true
              }
            }
          }
        },
        template: true
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.rentalContract.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      contracts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Get contract templates (Admin only)
const getContractTemplates = asyncHandler(async (req, res) => {
  const templates = await prisma.contractTemplate.findMany({
    orderBy: {
      created_at: 'desc'
    }
  });

  res.json({
    success: true,
    data: { templates }
  });
});

// Create contract template (Admin only)
const createContractTemplate = asyncHandler(async (req, res) => {
  const { name, template, version } = req.body;

  if (!name || !template || !version) {
    throw new AppError('Nom, template et version requis', 400, 'MISSING_DATA');
  }

  const contractTemplate = await prisma.contractTemplate.create({
    data: {
      name,
      template,
      version,
      is_active: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Modèle de contrat créé avec succès',
    data: { template: contractTemplate }
  });
});

// Update contract template (Admin only)
const updateContractTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, template, version, is_active } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (template) updateData.template = template;
  if (version) updateData.version = version;
  if (is_active !== undefined) updateData.is_active = is_active === true || is_active === 'true';

  const contractTemplate = await prisma.contractTemplate.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  res.json({
    success: true,
    message: 'Modèle de contrat mis à jour avec succès',
    data: { template: contractTemplate }
  });
});

// Delete contract template (Admin only)
const deleteContractTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if template is used in contracts
  const contractsCount = await prisma.rentalContract.count({
    where: { template_id: parseInt(id) }
  });

  if (contractsCount > 0) {
    throw new AppError('Impossible de supprimer un modèle utilisé dans des contrats', 400, 'TEMPLATE_IN_USE');
  }

  await prisma.contractTemplate.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Modèle de contrat supprimé avec succès'
  });
});

module.exports = {
  getContractByBooking,
  generateContract,
  downloadContract,
  getAllContracts,
  getContractTemplates,
  createContractTemplate,
  updateContractTemplate,
  deleteContractTemplate
};
