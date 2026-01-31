namespace WebBanGiay.API.PriceCalculators.Decorators.Implementations
{
    /// <summary>
    /// Decorator that adds tax to the price
    /// Applies tax percentage to the calculated price
    /// </summary>
    public class TaxDecorator : PriceCalculatorDecorator
    {
        private readonly decimal _taxPercentage;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="innerCalculator">The calculator to wrap</param>
        /// <param name="taxPercentage">Tax percentage (e.g., 10 for 10% VAT)</param>
        public TaxDecorator(IPriceCalculator innerCalculator, decimal taxPercentage)
            : base(innerCalculator)
        {
            if (taxPercentage < 0)
            {
                throw new ArgumentException("Tax percentage cannot be negative", nameof(taxPercentage));
            }

            _taxPercentage = taxPercentage;
        }

        /// <summary>
        /// Calculate price by adding tax to the inner calculator's result
        /// </summary>
        /// <param name="basePrice">Base price</param>
        /// <returns>Price after adding tax</returns>
        public override decimal Calculate(decimal basePrice)
        {
            // Get price from inner calculator
            var priceBeforeTax = _innerCalculator.Calculate(basePrice);

            // Apply tax
            var taxAmount = priceBeforeTax * (_taxPercentage / 100);
            var finalPrice = priceBeforeTax + taxAmount;

            return Math.Round(finalPrice, 2);
        }

        /// <summary>
        /// Get description including tax information
        /// </summary>
        /// <returns>Description chain showing tax applied</returns>
        public override string GetDescription()
        {
            return $"{GetInnerDescription()} → Tax {_taxPercentage}%";
        }
    }
}
