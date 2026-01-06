const prisma = require('../config/prisma');
const { AppError, asyncHandler } = require('../middlewares/errorHandler.middleware');

// Get user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      loyaltyAccount: {
        include: {
          tier: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: { user }
  });
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const { nom, prenom, telephone } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(nom && { nom }),
      ...(prenom && { prenom }),
      ...(telephone && { telephone })
    },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      telephone: true,
      role: true,
      email_verified: true,
      phone_verified: true,
      date_creation: true
    }
  });

  res.json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: { user }
  });
});

// Get user's bookings
const getUserBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    user_id: req.user.id
  };

  if (status) {
    where.status = {
      name: status
    };
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        car: {
          include: {
            brand: true,
            category: true,
            images: {
              where: { is_primary: true },
              take: 1
            }
          }
        },
        status: true,
        payments: true
      },
      orderBy: {
        date_creation: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.booking.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Get user notifications
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread_only } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    user_id: req.user.id
  };

  if (unread_only === 'true') {
    where.is_read = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        user_id: req.user.id,
        is_read: false
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      notifications,
      unread_count: unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Mark notification as read
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.update({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    },
    data: {
      is_read: true
    }
  });

  res.json({
    success: true,
    message: 'Notification marquée comme lue',
    data: { notification }
  });
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.notification.delete({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    }
  });

  res.json({
    success: true,
    message: 'Notification supprimée avec succès'
  });
});

// Get all users (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      {
        email: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        nom: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        prenom: {
          contains: search,
          mode: 'insensitive'
        }
      }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        loyaltyAccount: {
          include: {
            tier: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        role: true,
        email_verified: true,
        phone_verified: true,
        date_creation: true,
        loyaltyAccount: true,
        _count: true
      },
      orderBy: {
        date_creation: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Get user by ID (Admin only)
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    include: {
      loyaltyAccount: {
        include: {
          tier: true,
          transactions: {
            take: 10,
            orderBy: {
              created_at: 'desc'
            }
          }
        }
      },
      bookings: {
        include: {
          car: {
            include: {
              brand: true
            }
          },
          status: true
        },
        orderBy: {
          date_creation: 'desc'
        },
        take: 5
      },
      _count: {
        select: {
          bookings: true,
          notifications: true
        }
      }
    },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      telephone: true,
      adresse: true,
      role: true,
      email_verified: true,
      phone_verified: true,
      permis_conduire: true,
      date_creation: true,
      date_modification: true,
      loyaltyAccount: true,
      bookings: true,
      _count: true
    }
  });

  if (!user) {
    throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: { user }
  });
});

// Update user role (Admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['CLIENT', 'AGENT', 'ADMIN'].includes(role)) {
    throw new AppError('Rôle invalide', 400, 'INVALID_ROLE');
  }

  // Prevent admin from changing their own role
  if (parseInt(id) === req.user.id) {
    throw new AppError('Impossible de modifier votre propre rôle', 400, 'CANNOT_MODIFY_OWN_ROLE');
  }

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { role },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true
    }
  });

  res.json({
    success: true,
    message: 'Rôle utilisateur mis à jour avec succès',
    data: { user }
  });
});

// Delete user (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (parseInt(id) === req.user.id) {
    throw new AppError('Impossible de supprimer votre propre compte', 400, 'CANNOT_DELETE_SELF');
  }

  // Check if user has active bookings
  const activeBookings = await prisma.booking.count({
    where: {
      user_id: parseInt(id),
      status: {
        name: {
          notIn: ['CANCELLED', 'COMPLETED']
        }
      }
    }
  });

  if (activeBookings > 0) {
    throw new AppError('Impossible de supprimer un utilisateur avec des réservations actives', 400, 'USER_HAS_ACTIVE_BOOKINGS');
  }

  await prisma.user.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Utilisateur supprimé avec succès'
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getUserBookings,
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser
};
