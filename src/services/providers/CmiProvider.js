/**
 * Provider CMI - Implémentation de l'interface PaymentProvider pour CMI
 * Compatible avec les spécifications CMI du Maroc
 */

const PaymentProvider = require('./PaymentProvider');
const crypto = require('crypto');

class CmiProvider extends PaymentProvider {
  constructor(config) {
    super(config);
    this.merchantId = config.merchantId;
    this.storeKey = config.storeKey;
    this.terminalId = config.terminalId;
    this.gatewayUrl = config.gatewayUrl;
    this.currency = config.currency || 'MAD';
  }

  /**
   * Créer une session de paiement CMI
   */
  async createPaymentSession(orderData) {
    try {
      const transactionId = this.generateTransactionId(orderData.orderId);
      const amount = this.formatAmount(orderData.amount);
      
      // Préparer les données pour CMI
      const paymentData = {
        // Données obligatoires CMI
        merchantId: this.merchantId,
        terminalId: this.terminalId,
        orderId: transactionId,
        amount: amount,
        currency: this.currency,
        
        // URLs de retour
        okUrl: orderData.returnUrl + `?orderId=${transactionId}&status=success`,
        failUrl: orderData.returnUrl + `?orderId=${transactionId}&status=fail`,
        cancelUrl: orderData.cancelUrl + `?orderId=${transactionId}&status=cancel`,
        
        // URL de notification serveur (IPN)
        callbackUrl: orderData.ipnUrl,
        
        // Informations client
        email: orderData.customerEmail,
        customerName: orderData.customerName,
        
        // Description
        description: orderData.description,
        
        // Langue
        lang: 'fr',
        
        // Type de transaction
        tranType: 'PreAuth', // ou 'Auth' selon la configuration
        
        // Données additionnelles
        rnd: Date.now().toString(),
        encoding: 'UTF-8'
      };

      // Générer la signature/hash
      paymentData.hash = this.generateHash(paymentData);

      // Construire l'URL de redirection avec les paramètres
      const redirectUrl = this.buildRedirectUrl(paymentData);

      return {
        redirectUrl: redirectUrl,
        providerRef: transactionId,
        sessionId: transactionId,
        paymentData: paymentData // Pour debug/logs
      };
    } catch (error) {
      throw new Error(`CMI session creation failed: ${error.message}`);
    }
  }

  /**
   * Traiter le retour navigateur CMI
   */
  async handleReturn(request) {
    const params = request.query || request.body;
    
    try {
      // Vérifier la signature de retour
      if (!this.verifyReturnSignature(params)) {
        return {
          status: 'FAILED',
          message: 'Signature de retour invalide'
        };
      }

      const orderId = this.extractOrderIdFromTransaction(params.orderId);
      const status = this.normalizeStatus(params.ProcReturnCode || params.status);
      
      return {
        status: status,
        orderId: orderId,
        transactionId: params.orderId,
        amount: this.parseAmount(params.amount),
        message: this.getStatusMessage(params.ProcReturnCode, params.ErrMsg),
        rawResponse: params
      };
    } catch (error) {
      return {
        status: 'FAILED',
        message: `Erreur lors du traitement du retour: ${error.message}`
      };
    }
  }

  /**
   * Traiter la notification serveur CMI (IPN)
   */
  async handleNotification(request) {
    const params = request.body || request.query;
    
    try {
      // Vérifier la signature IPN
      if (!this.verifyIpnSignature(params)) {
        throw new Error('Signature IPN invalide');
      }

      const orderId = this.extractOrderIdFromTransaction(params.orderId);
      const status = this.normalizeStatus(params.ProcReturnCode);
      
      return {
        status: status,
        orderId: orderId,
        transactionId: params.orderId,
        amount: this.parseAmount(params.amount),
        shouldAck: true,
        ackResponse: 'ACTION=POSTAUTH', // Réponse CMI standard
        rawNotification: params
      };
    } catch (error) {
      throw new Error(`IPN processing failed: ${error.message}`);
    }
  }

  /**
   * Effectuer un remboursement CMI
   * Note: CMI ne supporte pas toujours les remboursements automatiques
   */
  async refund(transactionId, amount = null, reason = 'requested_by_customer') {
    // CMI nécessite souvent des remboursements manuels
    // Cette implémentation est un stub qui peut être étendu selon les capacités CMI
    
    console.warn('CMI refund requested but not automatically supported');
    
    return {
      refundId: `MANUAL_${Date.now()}`,
      amount: amount || 0,
      status: 'PENDING',
      message: 'Remboursement CMI nécessite un traitement manuel',
      requiresManualProcessing: true
    };
  }

  /**
   * Obtenir le statut d'un paiement CMI
   * Note: CMI ne fournit pas toujours d'API de statut
   */
  async getPaymentStatus(transactionId) {
    // Implémentation basique - peut être étendue si CMI fournit une API de statut
    console.warn('CMI status check not implemented - relying on IPN notifications');
    
    return {
      status: 'UNKNOWN',
      message: 'Vérification de statut CMI non disponible'
    };
  }

  /**
   * Vérifier la signature de retour navigateur
   */
  verifyReturnSignature(params) {
    if (!params.HASH && !params.hash) {
      return false;
    }
    
    const expectedHash = this.generateReturnHash(params);
    const receivedHash = params.HASH || params.hash;
    
    return expectedHash === receivedHash;
  }

  /**
   * Vérifier la signature IPN
   */
  verifyIpnSignature(params) {
    return this.verifyReturnSignature(params); // Même logique pour CMI
  }

  /**
   * Vérifier une signature générique
   */
  verifySignature(data, signature) {
    const expectedHash = this.generateReturnHash(data);
    return expectedHash === signature;
  }

  /**
   * Normaliser les statuts CMI
   */
  normalizeStatus(cmiStatus) {
    // Codes de retour CMI typiques
    const statusMap = {
      '00': 'PAID',        // Succès
      '01': 'FAILED',      // Échec générique
      '02': 'FAILED',      // Carte expirée
      '03': 'FAILED',      // Carte invalide
      '04': 'FAILED',      // Fonds insuffisants
      '05': 'FAILED',      // Carte refusée
      '06': 'FAILED',      // Erreur système
      '07': 'CANCELED',    // Transaction annulée
      '08': 'PENDING',     // En attente
      '99': 'FAILED',      // Erreur inconnue
      
      // Statuts textuels
      'success': 'PAID',
      'fail': 'FAILED',
      'cancel': 'CANCELED',
      'pending': 'PENDING'
    };

    return statusMap[cmiStatus] || 'UNKNOWN';
  }

  /**
   * Formater le montant pour CMI (généralement en centimes)
   */
  formatAmount(amount) {
    return Math.round(parseFloat(amount) * 100).toString();
  }

  /**
   * Parser le montant depuis CMI
   */
  parseAmount(cmiAmount) {
    return parseFloat(cmiAmount) / 100;
  }

  /**
   * Générer un ID de transaction unique
   */
  generateTransactionId(orderId) {
    const timestamp = Date.now();
    return `TXN_${orderId}_${timestamp}`;
  }

  /**
   * Extraire l'ID de commande depuis l'ID de transaction
   */
  extractOrderIdFromTransaction(transactionId) {
    const match = transactionId.match(/TXN_(\d+)_/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Générer le hash de sécurité CMI
   */
  generateHash(data) {
    // Algorithme de hash CMI typique
    const hashString = [
      data.merchantId,
      data.orderId,
      data.amount,
      data.okUrl,
      data.failUrl,
      data.tranType,
      data.rnd,
      this.storeKey
    ].join('|');

    return crypto.createHash('sha512').update(hashString, 'utf8').digest('base64');
  }

  /**
   * Générer le hash de retour
   */
  generateReturnHash(params) {
    const hashString = [
      params.orderId,
      params.amount,
      params.ProcReturnCode || '00',
      this.storeKey
    ].join('|');

    return crypto.createHash('sha512').update(hashString, 'utf8').digest('base64');
  }

  /**
   * Construire l'URL de redirection avec paramètres
   */
  buildRedirectUrl(paymentData) {
    const params = new URLSearchParams();
    
    Object.keys(paymentData).forEach(key => {
      if (paymentData[key] !== null && paymentData[key] !== undefined) {
        params.append(key, paymentData[key]);
      }
    });

    return `${this.gatewayUrl}?${params.toString()}`;
  }

  /**
   * Obtenir le message de statut
   */
  getStatusMessage(code, errorMsg) {
    const messages = {
      '00': 'Paiement effectué avec succès',
      '01': 'Paiement refusé',
      '02': 'Carte expirée',
      '03': 'Numéro de carte invalide',
      '04': 'Fonds insuffisants',
      '05': 'Carte refusée par la banque',
      '06': 'Erreur système',
      '07': 'Transaction annulée',
      '08': 'Transaction en attente',
      '99': 'Erreur inconnue'
    };

    return errorMsg || messages[code] || 'Statut inconnu';
  }

  /**
   * Valider la configuration CMI
   */
  validateConfig() {
    return !!(
      this.config.merchantId &&
      this.config.storeKey &&
      this.config.gatewayUrl
    );
  }

  /**
   * Informations du provider CMI
   */
  getProviderInfo() {
    return {
      name: 'CMI',
      version: '1.0.0',
      supportedCurrencies: ['MAD'],
      supportedMethods: ['card'],
      requiresManualRefunds: true
    };
  }
}

module.exports = CmiProvider;
