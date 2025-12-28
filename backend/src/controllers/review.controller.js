const prisma = require('../config/prisma');
const { AppError, asyncHandler } = require('../middlewares/errorHandler.middleware');

// Get all reviews with pagination and filters
const getReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, rating, verified_only } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (rating) {
    where.rating = parseInt(rating);
  }

  if (verified_only === 'true') {
    where.is_verified = true;
  }

  const [reviews, total, averageRating] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({
      where,
      _avg: { rating: true }
    })
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      average_rating: averageRating._avg.rating || 0,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Get reviews for a specific car
const getReviewsByCar = asyncHandler(async (req, res) => {
  const { carId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    car_id: parseInt(carId)
  };

  const [reviews, total, averageRating, ratingDistribution] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({
      where,
      _avg: { rating: true }
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: true,
      orderBy: {
        rating: 'desc'
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      average_rating: averageRating._avg.rating || 0,
      rating_distribution: ratingDistribution.map(item => ({
        rating: item.rating,
        count: item._count
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Create new review
const createReview = asyncHandler(async (req, res) => {
  const { car_id, rating, comment } = req.body;

  // Check if user has completed a booking for this car
  if (car_id) {
    const completedBooking = await prisma.booking.findFirst({
      where: {
        user_id: req.user.id,
        car_id: parseInt(car_id),
        status: {
          name: 'COMPLETED'
        }
      }
    });

    if (!completedBooking) {
      throw new AppError('Vous ne pouvez évaluer que les voitures que vous avez louées', 400, 'NO_COMPLETED_BOOKING');
    }

    // Check if user already reviewed this car
    const existingReview = await prisma.review.findFirst({
      where: {
        user_id: req.user.id,
        car_id: parseInt(car_id)
      }
    });

    if (existingReview) {
      throw new AppError('Vous avez déjà évalué cette voiture', 400, 'REVIEW_EXISTS');
    }
  }

  const review = await prisma.review.create({
    data: {
      user_id: req.user.id,
      car_id: car_id ? parseInt(car_id) : null,
      rating: parseInt(rating),
      comment,
      is_verified: false
    },
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Avis créé avec succès',
    data: { review }
  });
});

// Get user's reviews
const getUserReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: {
        user_id: req.user.id
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.review.count({
      where: {
        user_id: req.user.id
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Update user's review
const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const updateData = {};
  if (rating !== undefined) updateData.rating = parseInt(rating);
  if (comment !== undefined) updateData.comment = comment;

  const review = await prisma.review.update({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    },
    data: {
      ...updateData,
      is_verified: false // Reset verification when updated
    },
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Avis mis à jour avec succès',
    data: { review }
  });
});

// Delete user's review
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.review.delete({
    where: {
      id: parseInt(id),
      user_id: req.user.id
    }
  });

  res.json({
    success: true,
    message: 'Avis supprimé avec succès'
  });
});

// Get all reviews (Admin only)
const getAllReviews = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    rating, 
    verified, 
    user_id, 
    car_id 
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  if (rating) {
    where.rating = parseInt(rating);
  }

  if (verified !== undefined) {
    where.is_verified = verified === 'true';
  }

  if (user_id) {
    where.user_id = parseInt(user_id);
  }

  if (car_id) {
    where.car_id = parseInt(car_id);
  }

  const [reviews, total, statistics] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: true
    })
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      statistics: {
        total_reviews: statistics._count,
        average_rating: statistics._avg.rating || 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// Verify review (Admin only)
const verifyReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_verified = true } = req.body;

  const review = await prisma.review.update({
    where: { id: parseInt(id) },
    data: {
      is_verified: is_verified === true || is_verified === 'true'
    },
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: `Avis ${is_verified ? 'vérifié' : 'non vérifié'} avec succès`,
    data: { review }
  });
});

// Delete review (Admin only)
const deleteReviewAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.review.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Avis supprimé avec succès'
  });
});

module.exports = {
  getReviews,
  getReviewsByCar,
  createReview,
  getUserReviews,
  updateReview,
  deleteReview,
  getAllReviews,
  verifyReview,
  deleteReviewAdmin
};
