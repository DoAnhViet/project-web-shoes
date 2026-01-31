namespace WebBanGiay.API.PriceCalculators.Decorators.Implementations
{
    /// <summary>
    /// Decorator that adds shipping cost to the calculated price
    /// Supports both flat and percentage-based shipping calculations
    /// </summary>
    public class ShippingDecorator : PriceCalculatorDecorator
    {
        public enum ShippingType
        {
            Flat,      // Fixed shipping amount
            Percentage // Percentage of product price
        }

        private readonly ShippingType _shippingType;
        private readonly decimal _shippingCost;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="innerCalculator">The calculator to wrap</param>
        /// <param name="shippingType">Type of shipping calculation</param>
        /// <param name="shippingCost">Shipping cost (amount or percentage)</param>
        public ShippingDecorator(IPriceCalculator innerCalculator, ShippingType shippingType, decimal shippingCost)
            : base(innerCalculator)
        {
            if (shippingCost < 0)
            {
                throw new ArgumentException("Shipping cost cannot be negative", nameof(shippingCost));
            }

            _shippingType = shippingType;
            _shippingCost = shippingCost;
        }

        /// <summary>
        /// Calculate price with shipping cost added
        /// </summary>
        /// <param name="basePrice">Base price</param>
        /// <returns>Price with shipping cost</returns>
        public override decimal Calculate(decimal basePrice)
        {
            var priceBeforeShipping = _innerCalculator.Calculate(basePrice);

            decimal shippingAmount = _shippingType switch
            {
                ShippingType.Flat => _shippingCost,
                ShippingType.Percentage => priceBeforeShipping * (_shippingCost / 100),
                _ => 0
            };

            var finalPrice = priceBeforeShipping + shippingAmount;
            return Math.Round(finalPrice, 2);
        }

        /// <summary>
        /// Get description including shipping information
        /// </summary>
        /// <returns>Description chain showing shipping cost</returns>
        public override string GetDescription()
        {
            var shippingInfo = _shippingType switch
            {
                ShippingType.Flat => $"Shipping ${_shippingCost}",
                ShippingType.Percentage => $"Shipping {_shippingCost}%",
                _ => "Unknown Shipping"
            };

            return $"{GetInnerDescription()} → {shippingInfo}";
        }
    }
}
