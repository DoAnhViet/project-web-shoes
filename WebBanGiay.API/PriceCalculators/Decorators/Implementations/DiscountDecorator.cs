namespace WebBanGiay.API.PriceCalculators.Decorators.Implementations
{
    /// <summary>
    /// Decorator that applies a percentage discount to the price
    /// Can be stacked with other decorators to apply multiple discounts
    /// </summary>
    public class DiscountDecorator : PriceCalculatorDecorator
    {
        private readonly decimal _discountPercentage;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="innerCalculator">The calculator to wrap</param>
        /// <param name="discountPercentage">Discount percentage (0-100)</param>
        public DiscountDecorator(IPriceCalculator innerCalculator, decimal discountPercentage)
            : base(innerCalculator)
        {
            if (discountPercentage < 0 || discountPercentage > 100)
            {
                throw new ArgumentException("Discount percentage must be between 0 and 100", nameof(discountPercentage));
            }

            _discountPercentage = discountPercentage;
        }

        /// <summary>
        /// Calculate price by applying discount to the inner calculator's result
        /// </summary>
        /// <param name="basePrice">Base price</param>
        /// <returns>Price after applying discount</returns>
        public override decimal Calculate(decimal basePrice)
        {
            // Get price from inner calculator
            var priceBeforeDiscount = _innerCalculator.Calculate(basePrice);

            // Apply discount
            var discountAmount = priceBeforeDiscount * (_discountPercentage / 100);
            var finalPrice = priceBeforeDiscount - discountAmount;

            return Math.Round(finalPrice, 2);
        }

        /// <summary>
        /// Get description including discount information
        /// </summary>
        /// <returns>Description chain showing discount applied</returns>
        public override string GetDescription()
        {
            return $"{GetInnerDescription()} → Discount {_discountPercentage}%";
        }
    }
}
