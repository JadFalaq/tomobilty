/**
 * Tests unitaires pour CmiProvider
 */

const CmiProvider = require('../../services/providers/CmiProvider');
const crypto = require('crypto');

describe('CmiProvider', () => {
  let cmiProvider;
  
  beforeEach(() => {
    cmiProvider = new CmiProvider({
      merchantId: 'TEST_MERCHANT',
      storeKey: 'TEST_STORE_KEY_123',
      terminalId: 'TEST_TERMINAL',
      gatewayUrl: 'https://testpayment.cmi.co.ma/fim/est3Dgate',
      currency: 'MAD'
    });
  });

  describe('createPaymentSession', () => {
    it('should create payment session with correct parameters', async () => {
      const orderData = {
        orderId: 123,
        amount: 1500.00,
        currency: 'MAD',
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        description: 'Test payment',
        returnUrl: 'http://localhost:3000/return',
        cancelUrl: 'http://localhost:3000/cancel',
        ipnUrl: 'http://localhost:3001/ipn'
      };

      const result = await cmiProvider.createPaymentSession(orderData);

      expect(result).toHaveProperty('redirectUrl');
      expect(result).toHaveProperty('providerRef');
      expect(result).toHaveProperty('sessionId');
      expect(result.providerRef).toMatch(/^TXN_123_\d+$/);
      expect(result.redirectUrl).toContain('https://testpayment.cmi.co.ma');
    });

    it('should format amount correctly (in centimes)', async () => {
      const orderData = {
        orderId: 123,
        amount: 15.50,
        currency: 'MAD',
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        description: 'Test payment',
        returnUrl: 'http://localhost:3000/return',
        cancelUrl: 'http://localhost:3000/cancel',
        ipnUrl: 'http://localhost:3001/ipn'
      };

      const result = await cmiProvider.createPaymentSession(orderData);
      
      expect(result.paymentData.amount).toBe('1550'); // 15.50 * 100
    });

    it('should generate valid hash signature', async () => {
      const orderData = {
        orderId: 123,
        amount: 100.00,
        currency: 'MAD',
        customerEmail: 'test@example.com',
        customerName: 'John Doe',
        description: 'Test payment',
        returnUrl: 'http://localhost:3000/return',
        cancelUrl: 'http://localhost:3000/cancel',
        ipnUrl: 'http://localhost:3001/ipn'
      };

      const result = await cmiProvider.createPaymentSession(orderData);
      
      expect(result.paymentData.hash).toBeDefined();
      expect(typeof result.paymentData.hash).toBe('string');
      expect(result.paymentData.hash.length).toBeGreaterThan(50);
    });
  });

  describe('handleReturn', () => {
    it('should handle successful payment return', async () => {
      const mockRequest = {
        query: {
          orderId: 'TXN_123_1703123456789',
          amount: '10000',
          ProcReturnCode: '00',
          HASH: 'valid_hash_signature'
        }
      };

      // Mock signature verification
      jest.spyOn(cmiProvider, 'verifyReturnSignature').mockReturnValue(true);

      const result = await cmiProvider.handleReturn(mockRequest);

      expect(result.status).toBe('PAID');
      expect(result.orderId).toBe(123);
      expect(result.transactionId).toBe('TXN_123_1703123456789');
      expect(result.amount).toBe(100.00);
    });

    it('should handle failed payment return', async () => {
      const mockRequest = {
        query: {
          orderId: 'TXN_123_1703123456789',
          amount: '10000',
          ProcReturnCode: '01',
          HASH: 'valid_hash_signature'
        }
      };

      jest.spyOn(cmiProvider, 'verifyReturnSignature').mockReturnValue(true);

      const result = await cmiProvider.handleReturn(mockRequest);

      expect(result.status).toBe('FAILED');
      expect(result.orderId).toBe(123);
    });

    it('should reject invalid signature', async () => {
      const mockRequest = {
        query: {
          orderId: 'TXN_123_1703123456789',
          amount: '10000',
          ProcReturnCode: '00',
          HASH: 'invalid_signature'
        }
      };

      jest.spyOn(cmiProvider, 'verifyReturnSignature').mockReturnValue(false);

      const result = await cmiProvider.handleReturn(mockRequest);

      expect(result.status).toBe('FAILED');
      expect(result.message).toContain('Signature de retour invalide');
    });
  });

  describe('handleNotification', () => {
    it('should handle successful IPN notification', async () => {
      const mockRequest = {
        body: {
          orderId: 'TXN_123_1703123456789',
          amount: '10000',
          ProcReturnCode: '00',
          HASH: 'valid_hash_signature'
        }
      };

      jest.spyOn(cmiProvider, 'verifyIpnSignature').mockReturnValue(true);

      const result = await cmiProvider.handleNotification(mockRequest);

      expect(result.status).toBe('PAID');
      expect(result.orderId).toBe(123);
      expect(result.shouldAck).toBe(true);
      expect(result.ackResponse).toBe('ACTION=POSTAUTH');
    });

    it('should reject invalid IPN signature', async () => {
      const mockRequest = {
        body: {
          orderId: 'TXN_123_1703123456789',
          amount: '10000',
          ProcReturnCode: '00',
          HASH: 'invalid_signature'
        }
      };

      jest.spyOn(cmiProvider, 'verifyIpnSignature').mockReturnValue(false);

      await expect(cmiProvider.handleNotification(mockRequest))
        .rejects.toThrow('Signature IPN invalide');
    });
  });

  describe('normalizeStatus', () => {
    it('should normalize CMI status codes correctly', () => {
      expect(cmiProvider.normalizeStatus('00')).toBe('PAID');
      expect(cmiProvider.normalizeStatus('01')).toBe('FAILED');
      expect(cmiProvider.normalizeStatus('07')).toBe('CANCELED');
      expect(cmiProvider.normalizeStatus('08')).toBe('PENDING');
      expect(cmiProvider.normalizeStatus('99')).toBe('FAILED');
      expect(cmiProvider.normalizeStatus('unknown')).toBe('UNKNOWN');
    });

    it('should handle text status codes', () => {
      expect(cmiProvider.normalizeStatus('success')).toBe('PAID');
      expect(cmiProvider.normalizeStatus('fail')).toBe('FAILED');
      expect(cmiProvider.normalizeStatus('cancel')).toBe('CANCELED');
      expect(cmiProvider.normalizeStatus('pending')).toBe('PENDING');
    });
  });

  describe('formatAmount', () => {
    it('should format amounts to centimes correctly', () => {
      expect(cmiProvider.formatAmount(100)).toBe('10000');
      expect(cmiProvider.formatAmount(15.50)).toBe('1550');
      expect(cmiProvider.formatAmount(0.01)).toBe('1');
      expect(cmiProvider.formatAmount(1234.56)).toBe('123456');
    });
  });

  describe('parseAmount', () => {
    it('should parse CMI amounts from centimes correctly', () => {
      expect(cmiProvider.parseAmount('10000')).toBe(100.00);
      expect(cmiProvider.parseAmount('1550')).toBe(15.50);
      expect(cmiProvider.parseAmount('1')).toBe(0.01);
      expect(cmiProvider.parseAmount('123456')).toBe(1234.56);
    });
  });

  describe('generateTransactionId', () => {
    it('should generate unique transaction IDs', async () => {
      const id1 = cmiProvider.generateTransactionId(123);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      const id2 = cmiProvider.generateTransactionId(123);
      
      expect(id1).toMatch(/^TXN_123_\d+$/);
      expect(id2).toMatch(/^TXN_123_\d+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('extractOrderIdFromTransaction', () => {
    it('should extract order ID from transaction ID', () => {
      const transactionId = 'TXN_123_1703123456789';
      const orderId = cmiProvider.extractOrderIdFromTransaction(transactionId);
      
      expect(orderId).toBe(123);
    });

    it('should return null for invalid transaction ID', () => {
      const orderId = cmiProvider.extractOrderIdFromTransaction('invalid_id');
      expect(orderId).toBeNull();
    });
  });

  describe('generateHash', () => {
    it('should generate consistent hash for same input', () => {
      const data = {
        merchantId: 'TEST_MERCHANT',
        orderId: 'TXN_123_123456',
        amount: '10000',
        okUrl: 'http://localhost:3000/success',
        failUrl: 'http://localhost:3000/fail',
        tranType: 'PreAuth',
        rnd: '123456'
      };

      const hash1 = cmiProvider.generateHash(data);
      const hash2 = cmiProvider.generateHash(data);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(50);
    });

    it('should generate different hash for different input', () => {
      const data1 = {
        merchantId: 'TEST_MERCHANT',
        orderId: 'TXN_123_123456',
        amount: '10000',
        okUrl: 'http://localhost:3000/success',
        failUrl: 'http://localhost:3000/fail',
        tranType: 'PreAuth',
        rnd: '123456'
      };

      const data2 = { ...data1, amount: '20000' };

      const hash1 = cmiProvider.generateHash(data1);
      const hash2 = cmiProvider.generateHash(data2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validateConfig', () => {
    it('should validate complete configuration', () => {
      expect(cmiProvider.validateConfig()).toBe(true);
    });

    it('should reject incomplete configuration', () => {
      const incompleteProvider = new CmiProvider({
        merchantId: 'TEST_MERCHANT',
        // Missing storeKey and gatewayUrl
      });
      
      expect(incompleteProvider.validateConfig()).toBe(false);
    });
  });

  describe('getProviderInfo', () => {
    it('should return provider information', () => {
      const info = cmiProvider.getProviderInfo();
      
      expect(info.name).toBe('CMI');
      expect(info.supportedCurrencies).toContain('MAD');
      expect(info.supportedMethods).toContain('card');
      expect(info.requiresManualRefunds).toBe(true);
    });
  });

  describe('refund', () => {
    it('should indicate manual refund processing required', async () => {
      const result = await cmiProvider.refund('TXN_123_456', 100, 'Test refund');
      
      expect(result.status).toBe('PENDING');
      expect(result.requiresManualProcessing).toBe(true);
      expect(result.message).toContain('traitement manuel');
    });
  });

  describe('verifySignature', () => {
    it('should verify signature correctly', () => {
      const data = {
        orderId: 'TXN_123_456',
        amount: '10000',
        ProcReturnCode: '00'
      };

      const expectedHash = cmiProvider.generateReturnHash(data);
      const isValid = cmiProvider.verifySignature(data, expectedHash);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const data = {
        orderId: 'TXN_123_456',
        amount: '10000',
        ProcReturnCode: '00'
      };

      const isValid = cmiProvider.verifySignature(data, 'invalid_signature');
      
      expect(isValid).toBe(false);
    });
  });
});

describe('CmiProvider Integration', () => {
  let cmiProvider;
  
  beforeEach(() => {
    cmiProvider = new CmiProvider({
      merchantId: process.env.CMI_MERCHANT_ID || 'TEST_MERCHANT',
      storeKey: process.env.CMI_STORE_KEY || 'TEST_STORE_KEY',
      terminalId: process.env.CMI_TERMINAL_ID || 'TEST_TERMINAL',
      gatewayUrl: process.env.CMI_GATEWAY_URL || 'https://testpayment.cmi.co.ma/fim/est3Dgate',
      currency: 'MAD'
    });
  });

  it('should handle complete payment flow', async () => {
    // 1. Create payment session
    const orderData = {
      orderId: 123,
      amount: 100.00,
      currency: 'MAD',
      customerEmail: 'test@example.com',
      customerName: 'John Doe',
      description: 'Integration test',
      returnUrl: 'http://localhost:3000/return',
      cancelUrl: 'http://localhost:3000/cancel',
      ipnUrl: 'http://localhost:3001/ipn'
    };

    const session = await cmiProvider.createPaymentSession(orderData);
    expect(session.redirectUrl).toBeDefined();

    // 2. Simulate successful return
    const returnParams = {
      orderId: session.providerRef,
      amount: '10000',
      ProcReturnCode: '00',
      HASH: 'simulated_hash'
    };

    // Mock signature verification for test
    jest.spyOn(cmiProvider, 'verifyReturnSignature').mockReturnValue(true);

    const returnResult = await cmiProvider.handleReturn({ query: returnParams });
    expect(returnResult.status).toBe('PAID');

    // 3. Simulate IPN notification
    const ipnResult = await cmiProvider.handleNotification({ body: returnParams });
    expect(ipnResult.status).toBe('PAID');
    expect(ipnResult.shouldAck).toBe(true);
  });
});
