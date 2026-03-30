/**
 * Price Breakdown Component
 * 
 * Displays the detailed breakdown of price calculations using Decorator pattern.
 * Shows each step: Base Price → Discounts → Tax → Shipping → Final Price
 */

import { useMemo } from 'react';
import PriceCalculatorService from '../services/PriceCalculatorService';
import './PriceBreakdown.css';

function PriceBreakdown({ items, discountPercent = 0, showDetails = true }) {
  const calculation = useMemo(() => {
    return PriceCalculatorService.calculateOrderTotal(items, {
      discountPercent,
      shippingFee: 30000,
      freeShippingThreshold: 500000
    });
  }, [items, discountPercent]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
  };

  if (!showDetails) {
    return (
      <div className="price-breakdown-simple">
        <div className="price-final">
          <span>Tổng cộng:</span>
          <span className="price-value">{formatPrice(calculation.finalPrice)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="price-breakdown">
      <h4 className="breakdown-title">📊 Chi tiết thanh toán</h4>
      
      <div className="breakdown-steps">
        {calculation.breakdown.map((step, index) => (
          <div key={index} className={`breakdown-step ${step.savings ? 'has-savings' : ''}`}>
            <div className="step-info">
              <span className="step-name">{step.step}</span>
              {step.note && <span className="step-note">{step.note}</span>}
            </div>
            <div className="step-values">
              {step.savings && (
                <span className="step-savings">{step.savingsFormatted}</span>
              )}
              {step.added && (
                <span className="step-added">{step.addedFormatted}</span>
              )}
              <span className="step-value">{step.formatted}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="breakdown-divider"></div>

      <div className="breakdown-total">
        <span className="total-label">💰 Thành tiền:</span>
        <span className="total-value">{formatPrice(calculation.finalPrice)}</span>
      </div>

      {calculation.savings > 0 && (
        <div className="breakdown-savings">
          <span>🎉 Bạn tiết kiệm được:</span>
          <span className="savings-value">{formatPrice(calculation.savings)}</span>
        </div>
      )}

      <div className="breakdown-description">
        <small>{calculation.description}</small>
      </div>
    </div>
  );
}

export default PriceBreakdown;
