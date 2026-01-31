using WebBanGiay.API.PriceCalculators;
using WebBanGiay.API.PriceCalculators.Implementations;
using WebBanGiay.API.PriceCalculators.Decorators.Implementations;

namespace WebBanGiay.API.PriceCalculators.Services
{
    /// <summary>
    /// Service for building and composing price calculators with a fluent API
    /// Enables easy construction of complex pricing scenarios without managing decorators manually
    /// </summary>
    public class PriceCalculationService
    {
        private IPriceCalculator _calculator;
        private readonly List<string> _appliedDecorators = new();

        /// <summary>
        /// Initialize service with base calculator
        /// </summary>
        public PriceCalculationService()
        {
            _calculator = new BasePriceCalculator();
        }

        /// <summary>
        /// Add a discount decorator
        /// </summary>
        /// <param name="discountPercentage">Discount percentage (0-100)</param>
        /// <returns>This service for fluent chaining</returns>
        public PriceCalculationService WithDiscount(decimal discountPercentage)
        {
            _calculator = new DiscountDecorator(_calculator, discountPercentage);
            _appliedDecorators.Add($"Discount {discountPercentage}%");
            return this;
        }

        /// <summary>
        /// Add a tax decorator
        /// </summary>
        /// <param name="taxPercentage">Tax percentage</param>
        /// <returns>This service for fluent chaining</returns>
        public PriceCalculationService WithTax(decimal taxPercentage)
        {
            _calculator = new TaxDecorator(_calculator, taxPercentage);
            _appliedDecorators.Add($"Tax {taxPercentage}%");
            return this;
        }

        /// <summary>
        /// Add a bulk discount decorator
        /// </summary>
        /// <param name="quantity">Quantity for bulk discount calculation</param>
        /// <returns>This service for fluent chaining</returns>
        public PriceCalculationService WithBulkDiscount(int quantity)
        {
            _calculator = new BulkDiscountDecorator(_calculator, quantity);
            _appliedDecorators.Add($"Bulk Discount (Qty: {quantity})");
            return this;
        }

        /// <summary>
        /// Add a flat shipping cost
        /// </summary>
        /// <param name="shippingCost">Fixed shipping cost</param>
        /// <returns>This service for fluent chaining</returns>
        public PriceCalculationService WithFlatShipping(decimal shippingCost)
        {
            _calculator = new ShippingDecorator(_calculator, ShippingDecorator.ShippingType.Flat, shippingCost);
            _appliedDecorators.Add($"Shipping ${shippingCost}");
            return this;
        }

        /// <summary>
        /// Add a percentage-based shipping cost
        /// </summary>
        /// <param name="shippingPercentage">Shipping cost as percentage of price</param>
        /// <returns>This service for fluent chaining</returns>
        public PriceCalculationService WithPercentageShipping(decimal shippingPercentage)
        {
            _calculator = new ShippingDecorator(_calculator, ShippingDecorator.ShippingType.Percentage, shippingPercentage);
            _appliedDecorators.Add($"Shipping {shippingPercentage}%");
            return this;
        }

        /// <summary>
        /// Add a custom calculator decorator
        /// </summary>
        /// <param name="calculator">Custom calculator to add to the chain</param>
        /// <param name="description">Description of the custom calculator</param>
        /// <returns>This service for fluent chaining</returns>
        public PriceCalculationService WithCustomCalculator(IPriceCalculator calculator, string description)
        {
            _calculator = calculator;
            _appliedDecorators.Add(description);
            return this;
        }

        /// <summary>
        /// Calculate the final price
        /// </summary>
        /// <param name="basePrice">Base price before decorators</param>
        /// <returns>Final calculated price</returns>
        public decimal Calculate(decimal basePrice)
        {
            return _calculator.Calculate(basePrice);
        }

        /// <summary>
        /// Get the complete description of all applied decorators
        /// </summary>
        /// <returns>Full calculation description</returns>
        public string GetDescription()
        {
            return _calculator.GetDescription();
        }

        /// <summary>
        /// Get list of applied decorators
        /// </summary>
        /// <returns>List of decorator descriptions</returns>
        public IReadOnlyList<string> GetAppliedDecorators()
        {
            return _appliedDecorators.AsReadOnly();
        }

        /// <summary>
        /// Reset to base calculator
        /// </summary>
        /// <returns>This service for fluent chaining</returns>
        public PriceCalculationService Reset()
        {
            _calculator = new BasePriceCalculator();
            _appliedDecorators.Clear();
            return this;
        }

        /// <summary>
        /// Calculate with breakdown of each step
        /// </summary>
        /// <param name="basePrice">Base price</param>
        /// <returns>Tuple of final price and description</returns>
        public (decimal FinalPrice, string Description) CalculateWithBreakdown(decimal basePrice)
        {
            var finalPrice = Calculate(basePrice);
            var description = GetDescription();
            return (finalPrice, description);
        }
    }
}
