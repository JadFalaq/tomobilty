/**
 * Utility functions for pricing calculations
 */

/**
 * Calculate base rental price
 * @param {number} dailyRate - Daily rental rate
 * @param {number} numberOfDays - Number of rental days
 * @returns {number} Base price
 */
const calculateBasePrice = (dailyRate, numberOfDays) => {
  return dailyRate * numberOfDays;
};

/**
 * Calculate insurance price
 * @param {Object} insurance - Insurance object
 * @param {number} numberOfDays - Number of rental days
 * @returns {number} Insurance price
 */
const calculateInsurancePrice = (insurance, numberOfDays) => {
  if (!insurance) return 0;
  return parseFloat(insurance.price) * numberOfDays;
};

/**
 * Calculate additional drivers fee
 * @param {Array} additionalDrivers - Array of additional drivers
 * @param {number} numberOfDays - Number of rental days
 * @param {number} dailyFeePerDriver - Daily fee per additional driver (default: 50 MAD)
 * @returns {number} Additional drivers fee
 */
const calculateAdditionalDriversFee = (additionalDrivers = [], numberOfDays, dailyFeePerDriver = 50) => {
  return additionalDrivers.length * dailyFeePerDriver * numberOfDays;
};

/**
 * Apply loyalty discount
 * @param {number} amount - Amount to apply discount to
 * @param {number} discountPercent - Discount percentage (0-100)
 * @returns {number} Discount amount
 */
const applyLoyaltyDiscount = (amount, discountPercent) => {
  return Math.round((amount * discountPercent / 100) * 100) / 100;
};

/**
 * Calculate weekend surcharge
 * @param {Date} dateDebut - Start date
 * @param {Date} dateFin - End date
 * @param {number} dailyRate - Daily rate
 * @param {number} surchargePercent - Weekend surcharge percentage (default: 20%)
 * @returns {number} Weekend surcharge amount
 */
const calculateWeekendSurcharge = (dateDebut, dateFin, dailyRate, surchargePercent = 20) => {
  let weekendDays = 0;
  const currentDate = new Date(dateDebut);
  
  while (currentDate <= new Date(dateFin)) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      weekendDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return Math.round((weekendDays * dailyRate * surchargePercent / 100) * 100) / 100;
};

/**
 * Calculate seasonal surcharge
 * @param {Date} dateDebut - Start date
 * @param {Date} dateFin - End date
 * @param {number} basePrice - Base rental price
 * @returns {number} Seasonal surcharge amount
 */
const calculateSeasonalSurcharge = (dateDebut, dateFin, basePrice) => {
  const start = new Date(dateDebut);
  const end = new Date(dateFin);
  
  // High season periods (summer and holidays)
  const highSeasonPeriods = [
    { start: new Date(start.getFullYear(), 5, 15), end: new Date(start.getFullYear(), 8, 15) }, // June 15 - Sept 15
    { start: new Date(start.getFullYear(), 11, 20), end: new Date(start.getFullYear() + 1, 0, 5) } // Dec 20 - Jan 5
  ];
  
  let highSeasonDays = 0;
  let totalDays = 0;
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    totalDays++;
    
    // Check if current date falls in high season
    const isHighSeason = highSeasonPeriods.some(period => 
      currentDate >= period.start && currentDate <= period.end
    );
    
    if (isHighSeason) {
      highSeasonDays++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Apply 30% surcharge for high season days
  const surchargePercent = 30;
  const dailyRate = basePrice / totalDays;
  
  return Math.round((highSeasonDays * dailyRate * surchargePercent / 100) * 100) / 100;
};

/**
 * Calculate long-term rental discount
 * @param {number} numberOfDays - Number of rental days
 * @param {number} basePrice - Base rental price
 * @returns {Object} Discount information
 */
const calculateLongTermDiscount = (numberOfDays, basePrice) => {
  let discountPercent = 0;
  let discountName = '';
  
  if (numberOfDays >= 30) {
    discountPercent = 15;
    discountName = 'Réduction location longue durée (30+ jours)';
  } else if (numberOfDays >= 14) {
    discountPercent = 10;
    discountName = 'Réduction location moyenne durée (14+ jours)';
  } else if (numberOfDays >= 7) {
    discountPercent = 5;
    discountName = 'Réduction location hebdomadaire (7+ jours)';
  }
  
  const discountAmount = Math.round((basePrice * discountPercent / 100) * 100) / 100;
  
  return {
    discountPercent,
    discountAmount,
    discountName,
    hasDiscount: discountPercent > 0
  };
};

/**
 * Calculate fuel surcharge based on current fuel prices
 * @param {number} numberOfDays - Number of rental days
 * @param {string} fuelType - Fuel type (essence, diesel)
 * @returns {number} Fuel surcharge amount
 */
const calculateFuelSurcharge = (numberOfDays, fuelType = 'essence') => {
  // Base fuel surcharge per day
  const fuelSurcharges = {
    essence: 15, // 15 MAD per day for gasoline
    diesel: 12   // 12 MAD per day for diesel
  };
  
  const dailySurcharge = fuelSurcharges[fuelType] || fuelSurcharges.essence;
  return dailySurcharge * numberOfDays;
};

/**
 * Calculate comprehensive pricing breakdown
 * @param {Object} params - Pricing parameters
 * @returns {Object} Complete pricing breakdown
 */
const calculateComprehensivePricing = (params) => {
  const {
    car,
    dateDebut,
    dateFin,
    insurance,
    additionalDrivers = [],
    loyaltyDiscountPercent = 0,
    usePoints = 0,
    pointsValue = 0,
    mileageOption = 'KM_340',
    paymentMode = 'EN_LIGNE'
  } = params;
  
  const numberOfDays = Math.ceil((new Date(dateFin) - new Date(dateDebut)) / (1000 * 60 * 60 * 24));
  
  // Base calculations
  const basePrice = calculateBasePrice(parseFloat(car.tarif_journalier), numberOfDays);
  const insurancePrice = calculateInsurancePrice(insurance, numberOfDays);
  const additionalDriversPrice = calculateAdditionalDriversFee(additionalDrivers, numberOfDays);
  const fuelSurcharge = calculateFuelSurcharge(numberOfDays, car.fuel_type);
  const mileageFeePerDay = mileageOption === 'KM_UNLIMITED' ? 50 : 0;
  const mileageFeeTotal = Math.round(mileageFeePerDay * numberOfDays * 100) / 100;
  
  // Surcharges
  const weekendSurcharge = calculateWeekendSurcharge(dateDebut, dateFin, parseFloat(car.tarif_journalier));
  const seasonalSurcharge = calculateSeasonalSurcharge(dateDebut, dateFin, basePrice);
  
  // Subtotal before discounts
  const subtotalBeforeDiscounts = basePrice + insurancePrice + additionalDriversPrice + 
                                 fuelSurcharge + weekendSurcharge + seasonalSurcharge + mileageFeeTotal;
  
  // Discounts
  const longTermDiscount = calculateLongTermDiscount(numberOfDays, basePrice);
  const loyaltyDiscount = applyLoyaltyDiscount(subtotalBeforeDiscounts, loyaltyDiscountPercent);
  const pointsDiscount = pointsValue;
  
  const totalDiscounts = longTermDiscount.discountAmount + loyaltyDiscount + pointsDiscount;
  
  // Final calculations
  const subtotal = subtotalBeforeDiscounts - totalDiscounts;
  const agencyFeePercent = paymentMode === 'EN_AGENCE' ? 0.025 : 0;
  const agencyFeeAmount = Math.round(subtotal * agencyFeePercent * 100) / 100;
  const deposit = Math.round((subtotal + agencyFeeAmount) * 0.20 * 100) / 100;
  const totalPrice = subtotal + agencyFeeAmount;
  
  return {
    numberOfDays,
    breakdown: {
      basePrice: Math.round(basePrice * 100) / 100,
      insurancePrice: Math.round(insurancePrice * 100) / 100,
      additionalDriversPrice: Math.round(additionalDriversPrice * 100) / 100,
      fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
      weekendSurcharge: Math.round(weekendSurcharge * 100) / 100,
      seasonalSurcharge: Math.round(seasonalSurcharge * 100) / 100,
      mileageFeePerDay,
      mileageFeeTotal,
      agencyFeePercent: agencyFeePercent * 100,
      agencyFeeAmount
    },
    subtotalBeforeDiscounts: Math.round(subtotalBeforeDiscounts * 100) / 100,
    discounts: {
      longTermDiscount: longTermDiscount,
      loyaltyDiscount: Math.round(loyaltyDiscount * 100) / 100,
      pointsDiscount: Math.round(pointsDiscount * 100) / 100,
      totalDiscounts: Math.round(totalDiscounts * 100) / 100
    },
    subtotal: Math.round(subtotal * 100) / 100,
    deposit: deposit,
    totalPrice: Math.round(totalPrice * 100) / 100,
    dailyRate: parseFloat(car.tarif_journalier)
  };
};

/**
 * Calculate refund amount based on cancellation policy
 * @param {number} totalPaid - Total amount paid
 * @param {number} penaltyPercent - Penalty percentage (0-100)
 * @returns {Object} Refund breakdown
 */
const calculateRefundAmount = (totalPaid, penaltyPercent) => {
  const penaltyAmount = Math.round((totalPaid * penaltyPercent / 100) * 100) / 100;
  const refundAmount = Math.round((totalPaid - penaltyAmount) * 100) / 100;
  
  return {
    totalPaid: Math.round(totalPaid * 100) / 100,
    penaltyPercent,
    penaltyAmount,
    refundAmount,
    refundPercent: Math.round(((refundAmount / totalPaid) * 100) * 100) / 100
  };
};

module.exports = {
  calculateBasePrice,
  calculateInsurancePrice,
  calculateAdditionalDriversFee,
  applyLoyaltyDiscount,
  calculateWeekendSurcharge,
  calculateSeasonalSurcharge,
  calculateLongTermDiscount,
  calculateFuelSurcharge,
  calculateComprehensivePricing,
  calculateRefundAmount
};
