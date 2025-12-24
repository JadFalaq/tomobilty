/**
 * Interface abstraite pour les providers de paiement
 * Définit les méthodes communes que tous les providers doivent implémenter
 */

class PaymentProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Créer une session de paiement
   * @param {Object} orderData - Données de la commande/réservation
   * @param {number} orderData.orderId - ID de la réservation
   * @param {number} orderData.amount - Montant en MAD
   * @param {string} orderData.currency - Devise (MAD)
   * @param {string} orderData.customerEmail - Email client
   * @param {string} orderData.customerName - Nom client
   * @param {string} orderData.description - Description de la commande
   * @param {string} orderData.returnUrl - URL de retour
   * @param {string} orderData.cancelUrl - URL d'annulation
   * @param {string} orderData.ipnUrl - URL de notification serveur
   * @returns {Promise<Object>} {redirectUrl, providerRef, sessionId}
   */
  async createPaymentSession(orderData) {
    throw new Error('createPaymentSession must be implemented by subclass');
  }

  /**
   * Traiter le retour navigateur (success/cancel/fail)
   * @param {Object} request - Données de la requête de retour
   * @returns {Promise<Object>} {status, orderId, transactionId, amount, message}
   */
  async handleReturn(request) {
    throw new Error('handleReturn must be implemented by subclass');
  }

  /**
   * Traiter la notification serveur (IPN/webhook)
   * @param {Object} request - Données de la notification
   * @returns {Promise<Object>} {status, orderId, transactionId, amount, shouldAck}
   */
  async handleNotification(request) {
    throw new Error('handleNotification must be implemented by subclass');
  }

  /**
   * Effectuer un remboursement
   * @param {string} transactionId - ID de la transaction à rembourser
   * @param {number} amount - Montant à rembourser (optionnel, total si non spécifié)
   * @param {string} reason - Raison du remboursement
   * @returns {Promise<Object>} {refundId, amount, status}
   */
  async refund(transactionId, amount = null, reason = 'requested_by_customer') {
    throw new Error('refund must be implemented by subclass');
  }

  /**
   * Obtenir le statut d'un paiement
   * @param {string} transactionId - ID de la transaction
   * @returns {Promise<Object>} {status, amount, currency, metadata}
   */
  async getPaymentStatus(transactionId) {
    throw new Error('getPaymentStatus must be implemented by subclass');
  }

  /**
   * Vérifier la signature/intégrité d'une notification
   * @param {Object} data - Données à vérifier
   * @param {string} signature - Signature reçue
   * @returns {boolean} true si valide
   */
  verifySignature(data, signature) {
    throw new Error('verifySignature must be implemented by subclass');
  }

  /**
   * Normaliser les statuts de paiement vers notre format interne
   * @param {string} providerStatus - Statut du provider
   * @returns {string} Statut normalisé (PENDING, PAID, FAILED, CANCELED, REFUNDED)
   */
  normalizeStatus(providerStatus) {
    throw new Error('normalizeStatus must be implemented by subclass');
  }

  /**
   * Formater le montant selon les exigences du provider
   * @param {number} amount - Montant en MAD
   * @returns {number} Montant formaté
   */
  formatAmount(amount) {
    // Par défaut, retourne le montant tel quel
    // Certains providers demandent en centimes, d'autres en unités
    return amount;
  }

  /**
   * Valider les données de configuration du provider
   * @returns {boolean} true si la configuration est valide
   */
  validateConfig() {
    throw new Error('validateConfig must be implemented by subclass');
  }

  /**
   * Obtenir les informations du provider
   * @returns {Object} {name, version, supportedCurrencies, supportedMethods}
   */
  getProviderInfo() {
    throw new Error('getProviderInfo must be implemented by subclass');
  }
}

module.exports = PaymentProvider;
