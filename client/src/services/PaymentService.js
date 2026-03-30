/**
 * FACTORY PATTERN - Payment Service
 * 
 * Creates appropriate payment processor based on payment method.
 * Mirrors the backend PaymentProcessorFactory pattern.
 */

import logger from './LoggerService';

// Payment processor interface (simulated)
class PaymentProcessor {
  constructor(method) {
    this.method = method;
  }

  // eslint-disable-next-line no-unused-vars
  async process(orderData) {
    throw new Error('process() must be implemented');
  }

  getMethodName() {
    return this.method;
  }
}

// Concrete processors
class CODPaymentProcessor extends PaymentProcessor {
  constructor() {
    super('cod');
  }

  async process(orderData) {
    logger.info('Processing COD payment', { orderId: orderData.id });
    return {
      success: true,
      method: 'cod',
      status: 'pending',
      message: 'Thanh toán khi nhận hàng'
    };
  }
}

class BankTransferPaymentProcessor extends PaymentProcessor {
  constructor() {
    super('bank');
  }

  async process(orderData) {
    logger.info('Processing Bank Transfer payment', { orderId: orderData.id });
    return {
      success: true,
      method: 'bank',
      status: 'pending',
      message: 'Vui lòng chuyển khoản theo thông tin bên dưới',
      bankInfo: {
        bank: 'Vietcombank',
        accountNumber: '1234567890',
        accountName: 'KICKS SHOE STORE',
        content: `${orderData.id} - ${orderData.customerInfo?.phone || ''}`
      }
    };
  }
}

class CardPaymentProcessor extends PaymentProcessor {
  constructor() {
    super('card');
  }

  async process(orderData) {
    logger.info('Processing Card payment', { orderId: orderData.id });
    return {
      success: true,
      method: 'card',
      status: 'processing',
      message: 'Đang xử lý thanh toán thẻ...'
    };
  }
}

class MoMoPaymentProcessor extends PaymentProcessor {
  constructor() {
    super('momo');
  }

  async process(orderData) {
    logger.info('Processing MoMo payment', { orderId: orderData.id });
    return {
      success: true,
      method: 'momo',
      status: 'pending',
      message: 'Quét mã QR để thanh toán qua MoMo',
      qrCode: `momo://payment?order=${orderData.id}`
    };
  }
}

/**
 * FACTORY - Creates payment processor based on method
 */
class PaymentProcessorFactory {
  static create(paymentMethod) {
    logger.debug('Creating payment processor', { method: paymentMethod });
    
    switch (paymentMethod.toLowerCase()) {
      case 'cod':
        return new CODPaymentProcessor();
      case 'bank':
        return new BankTransferPaymentProcessor();
      case 'card':
        return new CardPaymentProcessor();
      case 'momo':
        return new MoMoPaymentProcessor();
      default:
        logger.warn('Unknown payment method, defaulting to COD', { method: paymentMethod });
        return new CODPaymentProcessor();
    }
  }

  static getAvailableMethods() {
    return [
      { id: 'cod', name: '💵 Thanh toán khi nhận hàng', icon: '💵' },
      { id: 'bank', name: '🏦 Chuyển khoản ngân hàng', icon: '🏦' },
      { id: 'card', name: '💳 Thẻ tín dụng/Ghi nợ', icon: '💳' },
      { id: 'momo', name: '📱 Ví MoMo', icon: '📱' }
    ];
  }
}

// Payment Service - Uses Factory
const PaymentService = {
  processPayment: async (paymentMethod, orderData) => {
    const processor = PaymentProcessorFactory.create(paymentMethod);
    return await processor.process(orderData);
  },

  getPaymentMethods: () => {
    return PaymentProcessorFactory.getAvailableMethods();
  }
};

export default PaymentService;
export { PaymentProcessorFactory };
