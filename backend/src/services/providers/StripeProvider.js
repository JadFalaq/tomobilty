/**
 * Provider Stripe - Implémentation de l'interface PaymentProvider pour Stripe
 */

const PaymentProvider = require('./PaymentProvider');
const stripe = require('stripe');

class StripeProvider extends PaymentProvider {
  constructor(config) {
    super(config);
    this.stripe = stripe(config.secretKey);
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Créer une session de paiement Stripe
   */
  async createPaymentSession(orderData) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: orderData.currency.toLowerCase(),
            product_data: {
              name: orderData.description,
              description: `Réservation #${orderData.orderId}`
            },
            unit_amount: this.formatAmount(orderData.amount)
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: orderData.returnUrl + '?session_id={CHECKOUT_SESSION_ID}&status=success',
        cancel_url: orderData.cancelUrl + '?session_id={CHECKOUT_SESSION_ID}&status=cancel',
        customer_email: orderData.customerEmail,
        metadata: {
          order_id: orderData.orderId.toString(),
          provider: 'stripe'
        }
      });

      return {
        redirectUrl: session.url,
        providerRef: session.id,
        sessionId: session.id
      };
    } catch (error) {
      throw new Error(`Stripe session creation failed: ${error.message}`);
    }
  }

  /**
   * Traiter le retour navigateur Stripe
   */
  async handleReturn(request) {
    const { session_id, status } = request.query || request.body;

    if (!session_id) {
      return {
        status: 'FAILED',
        message: 'Session ID manquant'
      };
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(session_id);
      
      return {
        status: this.normalizeStatus(session.payment_status),
        orderId: parseInt(session.metadata.order_id),
        transactionId: session.payment_intent,
        amount: session.amount_total / 100,
        message: status === 'cancel' ? 'Paiement annulé par l\'utilisateur' : 'Paiement traité'
      };
    } catch (error) {
      return {
        status: 'FAILED',
        message: `Erreur lors de la récupération de la session: ${error.message}`
      };
    }
  }

  /**
   * Traiter les webhooks Stripe
   */
  async handleNotification(request) {
    const signature = request.headers['stripe-signature'];
    const payload = request.body;

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      
      let result = {
        shouldAck: true,
        status: 'UNKNOWN'
      };

      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          result = {
            status: 'PAID',
            orderId: parseInt(session.metadata.order_id),
            transactionId: session.payment_intent,
            amount: session.amount_total / 100,
            shouldAck: true
          };
          break;

        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          result = {
            status: 'PAID',
            transactionId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            shouldAck: true
          };
          break;

        case 'payment_intent.payment_failed':
          const failedIntent = event.data.object;
          result = {
            status: 'FAILED',
            transactionId: failedIntent.id,
            amount: failedIntent.amount / 100,
            shouldAck: true
          };
          break;

        case 'checkout.session.expired':
          const expiredSession = event.data.object;
          result = {
            status: 'CANCELED',
            orderId: parseInt(expiredSession.metadata.order_id),
            transactionId: expiredSession.payment_intent,
            shouldAck: true
          };
          break;

        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }

      return result;
    } catch (error) {
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }

  /**
   * Effectuer un remboursement Stripe
   */
  async refund(transactionId, amount = null, reason = 'requested_by_customer') {
    try {
      const refundData = {
        payment_intent: transactionId,
        reason: reason
      };

      if (amount) {
        refundData.amount = this.formatAmount(amount);
      }

      const refund = await this.stripe.refunds.create(refundData);

      return {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: this.normalizeStatus(refund.status)
      };
    } catch (error) {
      throw new Error(`Stripe refund failed: ${error.message}`);
    }
  }

  /**
   * Obtenir le statut d'un paiement Stripe
   */
  async getPaymentStatus(transactionId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(transactionId);
      
      return {
        status: this.normalizeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      throw new Error(`Failed to get Stripe payment status: ${error.message}`);
    }
  }

  /**
   * Vérifier la signature Stripe
   */
  verifySignature(data, signature) {
    try {
      this.stripe.webhooks.constructEvent(data, signature, this.webhookSecret);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Normaliser les statuts Stripe
   */
  normalizeStatus(stripeStatus) {
    const statusMap = {
      // Checkout session statuses
      'complete': 'PAID',
      'expired': 'CANCELED',
      'open': 'PENDING',
      
      // Payment intent statuses
      'succeeded': 'PAID',
      'processing': 'PENDING',
      'requires_payment_method': 'PENDING',
      'requires_confirmation': 'PENDING',
      'requires_action': 'PENDING',
      'canceled': 'CANCELED',
      'payment_failed': 'FAILED',
      
      // Refund statuses
      'pending': 'PENDING',
      'succeeded': 'REFUNDED',
      'failed': 'FAILED'
    };

    return statusMap[stripeStatus] || 'UNKNOWN';
  }

  /**
   * Formater le montant pour Stripe (en centimes)
   */
  formatAmount(amount) {
    return Math.round(parseFloat(amount) * 100);
  }

  /**
   * Valider la configuration Stripe
   */
  validateConfig() {
    return !!(this.config.secretKey && this.config.webhookSecret);
  }

  /**
   * Informations du provider Stripe
   */
  getProviderInfo() {
    return {
      name: 'Stripe',
      version: '13.11.0',
      supportedCurrencies: ['MAD', 'EUR', 'USD'],
      supportedMethods: ['card']
    };
  }
}

module.exports = StripeProvider;
