namespace WebBanGiay.API.PriceCalculators.Decorators.Implementations
{
    /// <summary>
    /// Decorator that applies bulk discount based on quantity
    /// Offers tiered discounts for larger quantities
    /// </summary>
    public class BulkDiscountDecorator : PriceCalculatorDecorator
    {
        private readonly int _quantity;

        // Discount tiers: quantity -> discount percentage
        private static readonly Dictionary<int, decimal> DiscountTiers = new()
        {
            { 5, 5 },      // 5% off for 5+ items
            { 10, 10 },    // 10% off for 10+ items
            { 20, 15 },    // 15% off for 20+ items
            { 50, 20 }     // 20% off for 50+ items
        };

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="innerCalculator">The calculator to wrap</param>
        /// <param name="quantity">Quantity of items</param>
        public BulkDiscountDecorator(IPriceCalculator innerCalculator, int quantity)
            : base(innerCalculator)
        {
            if (quantity < 1)
            {
                throw new ArgumentException("Quantity must be at least 1", nameof(quantity));
            }

            _quantity = quantity;
        }

        /// <summary>
        /// Get applicable discount based on quantity
        /// </summary>
        /// <returns>Discount percentage</returns>
        private decimal GetApplicableDiscount()
        {
            var applicableTier = DiscountTiers
                .Where(tier => _quantity >= tier.Key)
                .OrderByDescending(tier => tier.Key)
                .FirstOrDefault();

            return applicableTier.Value;
        }

        /// <summary>
        /// Calculate price with bulk discount applied
        /// </summary>
        /// <param name="basePrice">Base price</param>
        /// <returns>Price with bulk discount</returns>
        public override decimal Calculate(decimal basePrice)
        {
            // Get price from inner calculator
            var priceBeforeDiscount = _innerCalculator.Calculate(basePrice);

            // Get applicable discount
            var discount = GetApplicableDiscount();

            if (discount > 0)
            {
                var discountAmount = priceBeforeDiscount * (discount / 100);
                var finalPrice = priceBeforeDiscount - discountAmount;
                return Math.Round(finalPrice, 2);
            }

            return priceBeforeDiscount;
        }

        /// <summary>
        /// Get description including bulk discount information
        /// </summary>
        /// <returns>Description chain showing bulk discount</returns>
        public override string GetDescription()
        {
            var discount = GetApplicableDiscount();
            var discountInfo = discount > 0 ? $"Bulk Discount {discount}% (Qty: {_quantity})" : "No Bulk Discount";
            return $"{GetInnerDescription()} → {discountInfo}";
        }
    }
}
