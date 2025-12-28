/**
 * Factory pour créer les instances de providers de paiement
 */

const StripeProvider = require('./StripeProvider');
const CmiProvider = require('./CmiProvider');

class PaymentProviderFactory {
  /**
   * Créer une instance du provider de paiement configuré
   * @param {string} providerName - Nom du provider (stripe|cmi)
   * @returns {PaymentProvider} Instance du provider
   */
  static createProvider(providerName = null) {
    const provider = providerName || process.env.PAYMENT_PROVIDER || 'cmi';
    
    switch (provider.toLowerCase()) {
      case 'stripe':
        return new StripeProvider({
          secretKey: process.env.STRIPE_SECRET_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
        });
        
      case 'cmi':
        return new CmiProvider({
          merchantId: process.env.CMI_MERCHANT_ID,
          storeKey: process.env.CMI_STORE_KEY,
          terminalId: process.env.CMI_TERMINAL_ID,
          gatewayUrl: process.env.CMI_GATEWAY_URL,
          currency: process.env.CMI_CURRENCY || 'MAD'
        });
        
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  /**
   * Obtenir la liste des providers disponibles
   * @returns {Array} Liste des providers
   */
  static getAvailableProviders() {
    return ['stripe', 'cmi'];
  }

  /**
   * Vérifier si un provider est disponible
   * @param {string} providerName - Nom du provider
   * @returns {boolean} true si disponible
   */
  static isProviderAvailable(providerName) {
    return this.getAvailableProviders().includes(providerName.toLowerCase());
  }

  /**
   * Valider la configuration d'un provider
   * @param {string} providerName - Nom du provider
   * @returns {boolean} true si la configuration est valide
   */
  static validateProviderConfig(providerName) {
    try {
      const provider = this.createProvider(providerName);
      return provider.validateConfig();
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtenir les informations de tous les providers
   * @returns {Object} Informations des providers
   */
  static getAllProvidersInfo() {
    const providers = {};
    
    this.getAvailableProviders().forEach(name => {
      try {
        const provider = this.createProvider(name);
        providers[name] = {
          ...provider.getProviderInfo(),
          configured: provider.validateConfig()
        };
      } catch (error) {
        providers[name] = {
          name: name,
          configured: false,
          error: error.message
        };
      }
    });
    
    return providers;
  }
}

module.exports = PaymentProviderFactory;
