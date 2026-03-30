/**
 * STRATEGY PATTERN - Pricing Service
 * 
 * Different pricing strategies that can be applied to calculate prices.
 * Mirrors backend PricingStrategies pattern.
 */

import api from '../api/api';
import logger from './LoggerService';

// Strategy Interface
class PricingStrategy {
  // eslint-disable-next-line no-unused-vars
  calculatePrice(basePrice, quantity) {
    throw new Error('calculatePrice() must be implemented');
  }

  getName() {
    throw new Error('getName() must be implemented');
  }

  getDescription() {
    return '';
  }
}

// Concrete Strategies
class StandardPricingStrategy extends PricingStrategy {
  calculatePrice(basePrice, quantity) {
    return basePrice * quantity;
  }

  getName() {
    return 'Giá tiêu chuẩn';
  }

  getDescription() {
    return 'Không áp dụng giảm giá';
  }
}

class BulkDiscountStrategy extends PricingStrategy {
  constructor() {
    super();
    this.tiers = [
      { minQty: 10, discount: 0.20, label: '20% (10+ sản phẩm)' },
      { minQty: 5, discount: 0.15, label: '15% (5-9 sản phẩm)' },
      { minQty: 3, discount: 0.10, label: '10% (3-4 sản phẩm)' },
      { minQty: 2, discount: 0.05, label: '5% (2 sản phẩm)' },
    ];
  }

  calculatePrice(basePrice, quantity) {
    const tier = this.tiers.find(t => quantity >= t.minQty);
    const discount = tier ? tier.discount : 0;
    return basePrice * quantity * (1 - discount);
  }

  getDiscount(quantity) {
    const tier = this.tiers.find(t => quantity >= t.minQty);
    return tier || { discount: 0, label: 'Không giảm giá' };
  }

  getName() {
    return 'Giảm giá số lượng';
  }

  getDescription() {
    return 'Mua nhiều giảm nhiều';
  }
}

class VIPDiscountStrategy extends PricingStrategy {
  constructor(vipLevel = 1) {
    super();
    this.vipLevel = vipLevel;
    this.discounts = {
      1: 0.05,  // VIP 1: 5%
      2: 0.10,  // VIP 2: 10%
      3: 0.15,  // VIP 3: 15%
      4: 0.20,  // VIP 4: 20%
    };
  }

  calculatePrice(basePrice, quantity) {
    const discount = this.discounts[this.vipLevel] || 0;
    return basePrice * quantity * (1 - discount);
  }

  getName() {
    return `Giảm giá VIP ${this.vipLevel}`;
  }

  getDescription() {
    const discount = (this.discounts[this.vipLevel] || 0) * 100;
    return `Giảm ${discount}% cho khách VIP`;
  }
}

class SeasonalDiscountStrategy extends PricingStrategy {
  constructor(discountPercent = 10) {
    super();
    this.discountPercent = discountPercent;
  }

  calculatePrice(basePrice, quantity) {
    return basePrice * quantity * (1 - this.discountPercent / 100);
  }

  getName() {
    return 'Khuyến mãi theo mùa';
  }

  getDescription() {
    return `Giảm ${this.discountPercent}% - Ưu đãi có thời hạn`;
  }
}

/**
 * Pricing Context - Uses strategies
 */
class PricingContext {
  constructor(strategy = new StandardPricingStrategy()) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
    logger.debug('Pricing strategy changed', { strategy: strategy.getName() });
  }

  calculate(basePrice, quantity) {
    const result = this.strategy.calculatePrice(basePrice, quantity);
    logger.info('Price calculated', {
      strategy: this.strategy.getName(),
      basePrice,
      quantity,
      result
    });
    return result;
  }

  getStrategyInfo() {
    return {
      name: this.strategy.getName(),
      description: this.strategy.getDescription()
    };
  }
}

// Pricing Service
const PricingService = {
  strategies: {
    standard: new StandardPricingStrategy(),
    bulk: new BulkDiscountStrategy(),
    vip: (level) => new VIPDiscountStrategy(level),
    seasonal: (percent) => new SeasonalDiscountStrategy(percent)
  },

  calculateWithStrategy: (strategyName, basePrice, quantity, options = {}) => {
    let strategy;
    switch (strategyName) {
      case 'bulk':
        strategy = PricingService.strategies.bulk;
        break;
      case 'vip':
        strategy = PricingService.strategies.vip(options.vipLevel || 1);
        break;
      case 'seasonal':
        strategy = PricingService.strategies.seasonal(options.discountPercent || 10);
        break;
      default:
        strategy = PricingService.strategies.standard;
    }
    
    const context = new PricingContext(strategy);
    return {
      finalPrice: context.calculate(basePrice, quantity),
      strategy: context.getStrategyInfo(),
      originalPrice: basePrice * quantity,
      savings: (basePrice * quantity) - context.calculate(basePrice, quantity)
    };
  },

  // Call backend API for full calculation with decorators
  calculateFromAPI: async (basePrice, quantity, options = {}) => {
    try {
      const response = await api.post('/pricecalculation/calculate', {
        basePrice,
        quantity,
        discountPercentage: options.discountPercentage || 0,
        taxPercentage: options.taxPercentage || 0,
        shippingCost: options.shippingCost || 0
      });
      logger.info('Price calculated from API', response.data);
      return response.data;
    } catch (error) {
      logger.error('Failed to calculate price from API', error);
      // Fallback to local calculation
      return PricingService.calculateWithStrategy('standard', basePrice, quantity);
    }
  },

  getBulkDiscount: (quantity) => {
    return PricingService.strategies.bulk.getDiscount(quantity);
  }
};

export default PricingService;
export { PricingContext, StandardPricingStrategy, BulkDiscountStrategy, VIPDiscountStrategy, SeasonalDiscountStrategy };
