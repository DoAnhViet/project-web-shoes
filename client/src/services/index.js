/**
 * Services Index
 * 
 * Export all design pattern services:
 * - LoggerService (Singleton)
 * - PaymentService (Factory)
 * - PricingService (Strategy)
 * - OrderService (Command)
 * - PriceCalculatorService (Decorator)
 */

export { default as logger, LoggerService } from './LoggerService';
export { default as PaymentService, PaymentProcessorFactory } from './PaymentService';
export { default as PricingService, PricingContext } from './PricingService';
export { default as OrderService, CreateOrderCommand, CancelOrderCommand } from './OrderService';
export { default as PriceCalculatorService, PriceCalculatorBuilder } from './PriceCalculatorService';
