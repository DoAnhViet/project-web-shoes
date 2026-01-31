namespace WebBanGiay.API.PriceCalculators.Implementations
{
    /// <summary>
    /// Base price calculator that returns the price as-is
    /// Serves as the foundation for decorator pattern
    /// </summary>
    public class BasePriceCalculator : IPriceCalculator
    {
        /// <summary>
        /// Returns the base price without any modifications
        /// </summary>
        /// <param name="basePrice">The base price</param>
        /// <returns>The same base price</returns>
        public decimal Calculate(decimal basePrice)
        {
            if (basePrice < 0)
            {
                throw new ArgumentException("Price cannot be negative", nameof(basePrice));
            }

            return basePrice;
        }

        /// <summary>
        /// Get description of this calculator
        /// </summary>
        /// <returns>Description string</returns>
        public string GetDescription()
        {
            return "Base Price";
        }
    }
}
