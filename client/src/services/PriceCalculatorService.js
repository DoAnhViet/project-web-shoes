/**
 * DECORATOR PATTERN - Price Calculator
 * 
 * Wraps price calculations with additional features (discount, tax, shipping).
 * Mirrors backend PriceCalculatorDecorator pattern.
 */

import logger from './LoggerService';

// Base Component
class BasePriceCalculator {
  constructor(basePrice) {
    this.basePrice = basePrice;
  }

  calculate() {
    return this.basePrice;
  }

  getDescription() {
    return `Giá gốc: ${this.formatPrice(this.basePrice)}`;
  }

  getBreakdown() {
    return [{
      step: 'Giá gốc',
      value: this.basePrice,
      formatted: this.formatPrice(this.basePrice)
    }];
  }

  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
  }
}

// Abstract Decorator
class PriceCalculatorDecorator extends BasePriceCalculator {
  constructor(calculator) {
    super(calculator.basePrice);
    this.wrappedCalculator = calculator;
  }

  calculate() {
    return this.wrappedCalculator.calculate();
  }

  getDescription() {
    return this.wrappedCalculator.getDescription();
  }

  getBreakdown() {
    return this.wrappedCalculator.getBreakdown();
  }
}

// Concrete Decorators
class DiscountDecorator extends PriceCalculatorDecorator {
  constructor(calculator, discountPercent) {
    super(calculator);
    this.discountPercent = discountPercent;
  }

  calculate() {
    const basePrice = this.wrappedCalculator.calculate();
    return basePrice * (1 - this.discountPercent / 100);
  }

  getDescription() {
    return `${this.wrappedCalculator.getDescription()} → Giảm ${this.discountPercent}%`;
  }

  getBreakdown() {
    const breakdown = this.wrappedCalculator.getBreakdown();
    const previousValue = this.wrappedCalculator.calculate();
    const newValue = this.calculate();
    
    breakdown.push({
      step: `Giảm giá ${this.discountPercent}%`,
      value: newValue,
      formatted: this.formatPrice(newValue),
      savings: previousValue - newValue,
      savingsFormatted: `-${this.formatPrice(previousValue - newValue)}`
    });
    
    return breakdown;
  }
}

class BulkDiscountDecorator extends PriceCalculatorDecorator {
  constructor(calculator, quantity) {
    super(calculator);
    this.quantity = quantity;
    this.tiers = [
      { minQty: 10, discount: 20 },
      { minQty: 5, discount: 15 },
      { minQty: 3, discount: 10 },
      { minQty: 2, discount: 5 },
    ];
  }

  getDiscountPercent() {
    const tier = this.tiers.find(t => this.quantity >= t.minQty);
    return tier ? tier.discount : 0;
  }

  calculate() {
    const basePrice = this.wrappedCalculator.calculate();
    const discount = this.getDiscountPercent();
    return basePrice * (1 - discount / 100);
  }

  getDescription() {
    const discount = this.getDiscountPercent();
    if (discount === 0) {
      return this.wrappedCalculator.getDescription();
    }
    return `${this.wrappedCalculator.getDescription()} → Mua ${this.quantity} giảm ${discount}%`;
  }

  getBreakdown() {
    const breakdown = this.wrappedCalculator.getBreakdown();
    const discount = this.getDiscountPercent();
    
    if (discount > 0) {
      const previousValue = this.wrappedCalculator.calculate();
      const newValue = this.calculate();
      
      breakdown.push({
        step: `Giảm số lượng (${this.quantity} sp) -${discount}%`,
        value: newValue,
        formatted: this.formatPrice(newValue),
        savings: previousValue - newValue,
        savingsFormatted: `-${this.formatPrice(previousValue - newValue)}`
      });
    }
    
    return breakdown;
  }
}

class TaxDecorator extends PriceCalculatorDecorator {
  constructor(calculator, taxPercent = 10) {
    super(calculator);
    this.taxPercent = taxPercent;
  }

  calculate() {
    const basePrice = this.wrappedCalculator.calculate();
    return basePrice * (1 + this.taxPercent / 100);
  }

  getDescription() {
    return `${this.wrappedCalculator.getDescription()} → VAT ${this.taxPercent}%`;
  }

  getBreakdown() {
    const breakdown = this.wrappedCalculator.getBreakdown();
    const previousValue = this.wrappedCalculator.calculate();
    const newValue = this.calculate();
    
    breakdown.push({
      step: `Thuế VAT ${this.taxPercent}%`,
      value: newValue,
      formatted: this.formatPrice(newValue),
      added: newValue - previousValue,
      addedFormatted: `+${this.formatPrice(newValue - previousValue)}`
    });
    
    return breakdown;
  }
}

class ShippingDecorator extends PriceCalculatorDecorator {
  constructor(calculator, shippingFee, freeShippingThreshold = 500000) {
    super(calculator);
    this.shippingFee = shippingFee;
    this.freeShippingThreshold = freeShippingThreshold;
  }

  calculate() {
    const basePrice = this.wrappedCalculator.calculate();
    // Free shipping if over threshold
    if (basePrice >= this.freeShippingThreshold) {
      return basePrice;
    }
    return basePrice + this.shippingFee;
  }

  getDescription() {
    const basePrice = this.wrappedCalculator.calculate();
    if (basePrice >= this.freeShippingThreshold) {
      return `${this.wrappedCalculator.getDescription()} → Miễn phí ship`;
    }
    return `${this.wrappedCalculator.getDescription()} → Ship ${this.formatPrice(this.shippingFee)}`;
  }

  getBreakdown() {
    const breakdown = this.wrappedCalculator.getBreakdown();
    const previousValue = this.wrappedCalculator.calculate();
    
    if (previousValue >= this.freeShippingThreshold) {
      breakdown.push({
        step: 'Phí vận chuyển',
        value: previousValue,
        formatted: 'Miễn phí',
        note: `Miễn phí cho đơn từ ${this.formatPrice(this.freeShippingThreshold)}`
      });
    } else {
      breakdown.push({
        step: 'Phí vận chuyển',
        value: this.calculate(),
        formatted: this.formatPrice(this.calculate()),
        added: this.shippingFee,
        addedFormatted: `+${this.formatPrice(this.shippingFee)}`
      });
    }
    
    return breakdown;
  }
}

/**
 * Price Calculator Builder - Fluent API for building decorated calculators
 */
class PriceCalculatorBuilder {
  constructor(basePrice) {
    this.calculator = new BasePriceCalculator(basePrice);
  }

  withDiscount(percent) {
    if (percent > 0) {
      this.calculator = new DiscountDecorator(this.calculator, percent);
    }
    return this;
  }

  withBulkDiscount(quantity) {
    if (quantity > 1) {
      this.calculator = new BulkDiscountDecorator(this.calculator, quantity);
    }
    return this;
  }

  withTax(percent = 10) {
    this.calculator = new TaxDecorator(this.calculator, percent);
    return this;
  }

  withShipping(fee, freeThreshold = 500000) {
    this.calculator = new ShippingDecorator(this.calculator, fee, freeThreshold);
    return this;
  }

  build() {
    return this.calculator;
  }

  calculate() {
    return this.calculator.calculate();
  }

  getBreakdown() {
    return this.calculator.getBreakdown();
  }

  getDescription() {
    return this.calculator.getDescription();
  }
}

// Price Calculator Service
const PriceCalculatorService = {
  create: (basePrice) => new PriceCalculatorBuilder(basePrice),

  calculateOrderTotal: (items, options = {}) => {
    const {
      discountPercent = 0,
      taxPercent = 0,
      shippingFee = 30000,
      freeShippingThreshold = 500000
    } = options;

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Build calculator with decorators
    let builder = PriceCalculatorService.create(subtotal);

    if (discountPercent > 0) {
      builder = builder.withDiscount(discountPercent);
    }

    if (taxPercent > 0) {
      builder = builder.withTax(taxPercent);
    }

    builder = builder.withShipping(shippingFee, freeShippingThreshold);

    const calculator = builder.build();

    logger.info('Order total calculated with decorators', {
      subtotal,
      finalPrice: calculator.calculate(),
      breakdown: calculator.getBreakdown()
    });

    return {
      subtotal,
      finalPrice: calculator.calculate(),
      breakdown: calculator.getBreakdown(),
      description: calculator.getDescription(),
      savings: subtotal - calculator.calculate() + (subtotal >= freeShippingThreshold ? shippingFee : 0)
    };
  }
};

export default PriceCalculatorService;
export { 
  BasePriceCalculator, 
  DiscountDecorator, 
  BulkDiscountDecorator, 
  TaxDecorator, 
  ShippingDecorator,
  PriceCalculatorBuilder 
};
