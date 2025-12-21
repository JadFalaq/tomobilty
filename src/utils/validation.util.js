// Common validation utilities

// Validate Moroccan phone number
const isValidMoroccanPhone = (phone) => {
  const phoneRegex = /^(\+212|0)[5-7][0-9]{8}$/;
  return phoneRegex.test(phone);
};

// Validate Moroccan license plate
const isValidMoroccanPlate = (plate) => {
  const plateRegex = /^[0-9]{1,6}-[A-Z]{1,3}-[0-9]{2}$/;
  return plateRegex.test(plate);
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Validate date range
const isValidDateRange = (startDate, endDate, maxDays = 30) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start date cannot be in the past
  if (start < today) {
    return { valid: false, error: 'La date de début ne peut pas être dans le passé' };
  }

  // End date must be after start date
  if (end <= start) {
    return { valid: false, error: 'La date de fin doit être après la date de début' };
  }

  // Check maximum duration
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > maxDays) {
    return { valid: false, error: `La durée ne peut pas dépasser ${maxDays} jours` };
  }

  return { valid: true, days: diffDays };
};

// Validate driver's license age (minimum 2 years)
const isValidLicenseAge = (licenseDate) => {
  const license = new Date(licenseDate);
  const today = new Date();
  const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
  
  return license <= twoYearsAgo;
};

// Sanitize string input
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

// Validate file type
const isValidFileType = (filename, allowedTypes) => {
  const extension = filename.split('.').pop().toLowerCase();
  return allowedTypes.includes(extension);
};

// Validate file size (in bytes)
const isValidFileSize = (size, maxSize = 5 * 1024 * 1024) => { // 5MB default
  return size <= maxSize;
};

// Generate random verification code
const generateVerificationCode = (length = 6) => {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
};

// Calculate age from birth date
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Validate minimum age (18 for car rental)
const isValidAge = (birthDate, minAge = 18) => {
  return calculateAge(birthDate) >= minAge;
};

// Format price for display
const formatPrice = (price, currency = 'MAD') => {
  return `${parseFloat(price).toFixed(2)} ${currency}`;
};

// Calculate rental duration in days
const calculateRentalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Generate unique booking reference
const generateBookingReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `TOM-${timestamp}-${random}`.toUpperCase();
};

// Validate Moroccan CIN (Carte d'Identité Nationale)
const isValidMoroccanCIN = (cin) => {
  const cinRegex = /^[A-Z]{1,2}[0-9]{6}$/;
  return cinRegex.test(cin);
};

module.exports = {
  isValidMoroccanPhone,
  isValidMoroccanPlate,
  isValidEmail,
  isStrongPassword,
  isValidDateRange,
  isValidLicenseAge,
  sanitizeString,
  isValidFileType,
  isValidFileSize,
  generateVerificationCode,
  calculateAge,
  isValidAge,
  formatPrice,
  calculateRentalDays,
  generateBookingReference,
  isValidMoroccanCIN
};
