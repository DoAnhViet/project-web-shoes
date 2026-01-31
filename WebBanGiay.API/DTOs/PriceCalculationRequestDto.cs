namespace WebBanGiay.API.DTOs
{
    /// <summary>
    /// Request DTO for calculating product price with various modifiers
    /// </summary>
    public class PriceCalculationRequestDto
    {
        /// <summary>
        /// Base price before any decorators
        /// </summary>
        public decimal BasePrice { get; set; }

        /// <summary>
        /// Discount percentage to apply (0-100)
        /// Optional
        /// </summary>
        public decimal? DiscountPercentage { get; set; }

        /// <summary>
        /// Tax percentage to apply
        /// Optional
        /// </summary>
        public decimal? TaxPercentage { get; set; }

        /// <summary>
        /// Quantity for bulk discount calculation
        /// Optional
        /// </summary>
        public int? Quantity { get; set; }

        /// <summary>
        /// Flat shipping cost
        /// Optional
        /// </summary>
        public decimal? FlatShippingCost { get; set; }

        /// <summary>
        /// Shipping percentage (percentage of price)
        /// Optional
        /// </summary>
        public decimal? ShippingPercentage { get; set; }
    }
}
