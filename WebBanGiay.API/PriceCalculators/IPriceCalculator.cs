namespace WebBanGiay.API.PriceCalculators
{
    /// <summary>
    /// Interface for price calculation
    /// Defines the contract for all price calculators and decorators
    /// </summary>
    public interface IPriceCalculator
    {
        /// <summary>
        /// Calculate the final price based on base price
        /// </summary>
        /// <param name="basePrice">Base price before any calculations</param>
        /// <returns>Calculated final price</returns>
        decimal Calculate(decimal basePrice);

        /// <summary>
        /// Get description of the price calculation
        /// Used for displaying what modifiers are applied
        /// </summary>
        /// <returns>Description of calculation</returns>
        string GetDescription();
    }
}
