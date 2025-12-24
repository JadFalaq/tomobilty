/**
 * Custom error classes for the booking system
 */

class BookingError extends Error {
  constructor(message, code = 'BOOKING_ERROR') {
    super(message);
    this.name = 'BookingError';
    this.code = code;
  }
}

class CarNotAvailableError extends BookingError {
  constructor(carId, dateDebut, dateFin, reason = 'Voiture non disponible') {
    super(`Voiture ${carId} non disponible du ${dateDebut} au ${dateFin}: ${reason}`);
    this.name = 'CarNotAvailableError';
    this.code = 'CAR_NOT_AVAILABLE';
    this.carId = carId;
    this.dateDebut = dateDebut;
    this.dateFin = dateFin;
    this.reason = reason;
  }
}

class InvalidDriverLicenseError extends BookingError {
  constructor(driverName, reason) {
    super(`Permis de conduire invalide pour ${driverName}: ${reason}`);
    this.name = 'InvalidDriverLicenseError';
    this.code = 'INVALID_DRIVER_LICENSE';
    this.driverName = driverName;
    this.reason = reason;
  }
}

class BookingNotFoundError extends BookingError {
  constructor(bookingId) {
    super(`Réservation ${bookingId} introuvable`);
    this.name = 'BookingNotFoundError';
    this.code = 'BOOKING_NOT_FOUND';
    this.bookingId = bookingId;
  }
}

class InvalidBookingStatusError extends BookingError {
  constructor(currentStatus, requiredStatus) {
    super(`Status de réservation invalide. Actuel: ${currentStatus}, Requis: ${requiredStatus}`);
    this.name = 'InvalidBookingStatusError';
    this.code = 'INVALID_BOOKING_STATUS';
    this.currentStatus = currentStatus;
    this.requiredStatus = requiredStatus;
  }
}

class PaymentFailedError extends BookingError {
  constructor(paymentId, reason) {
    super(`Paiement ${paymentId} échoué: ${reason}`);
    this.name = 'PaymentFailedError';
    this.code = 'PAYMENT_FAILED';
    this.paymentId = paymentId;
    this.reason = reason;
  }
}

class InvalidBookingDatesError extends BookingError {
  constructor(dateDebut, dateFin) {
    super(`Dates de réservation invalides: début ${dateDebut}, fin ${dateFin}`);
    this.name = 'InvalidBookingDatesError';
    this.code = 'INVALID_BOOKING_DATES';
    this.dateDebut = dateDebut;
    this.dateFin = dateFin;
  }
}

class BookingCancellationError extends BookingError {
  constructor(bookingId, reason) {
    super(`Impossible d'annuler la réservation ${bookingId}: ${reason}`);
    this.name = 'BookingCancellationError';
    this.code = 'BOOKING_CANCELLATION_ERROR';
    this.bookingId = bookingId;
    this.reason = reason;
  }
}

class ContractGenerationError extends BookingError {
  constructor(bookingId, reason) {
    super(`Erreur lors de la génération du contrat pour la réservation ${bookingId}: ${reason}`);
    this.name = 'ContractGenerationError';
    this.code = 'CONTRACT_GENERATION_ERROR';
    this.bookingId = bookingId;
    this.reason = reason;
  }
}

class InvoiceGenerationError extends BookingError {
  constructor(bookingId, reason) {
    super(`Erreur lors de la génération de la facture pour la réservation ${bookingId}: ${reason}`);
    this.name = 'InvoiceGenerationError';
    this.code = 'INVOICE_GENERATION_ERROR';
    this.bookingId = bookingId;
    this.reason = reason;
  }
}

class AdditionalDriverLimitError extends BookingError {
  constructor(currentCount, maxAllowed = 3) {
    super(`Limite de conducteurs additionnels atteinte: ${currentCount}/${maxAllowed}`);
    this.name = 'AdditionalDriverLimitError';
    this.code = 'ADDITIONAL_DRIVER_LIMIT';
    this.currentCount = currentCount;
    this.maxAllowed = maxAllowed;
  }
}

class MaintenanceConflictError extends BookingError {
  constructor(carId, maintenanceDate) {
    super(`Maintenance programmée pour la voiture ${carId} le ${maintenanceDate}`);
    this.name = 'MaintenanceConflictError';
    this.code = 'MAINTENANCE_CONFLICT';
    this.carId = carId;
    this.maintenanceDate = maintenanceDate;
  }
}

module.exports = {
  BookingError,
  CarNotAvailableError,
  InvalidDriverLicenseError,
  BookingNotFoundError,
  InvalidBookingStatusError,
  PaymentFailedError,
  InvalidBookingDatesError,
  BookingCancellationError,
  ContractGenerationError,
  InvoiceGenerationError,
  AdditionalDriverLimitError,
  MaintenanceConflictError
};
