namespace WebBanGiay.API.DTOs
{
    /// <summary>
    /// DTO for price calculation response
    /// Includes final price and detailed breakdown of calculations
    /// </summary>
    public class PriceCalculationDto
    {
        /// <summary>
        /// Final calculated price
        /// </summary>
        public decimal FinalPrice { get; set; }

        /// <summary>
        /// Complete description showing all applied decorators
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Breakdown of each calculation step
        /// </summary>
        public List<PriceBreakdownStep> Breakdown { get; set; } = new();

        /// <summary>
        /// Total savings (if discounts applied)
        /// </summary>
        public decimal Savings { get; set; }
    }

    /// <summary>
    /// Represents a single step in the price calculation
    /// </summary>
    public class PriceBreakdownStep
    {
        /// <summary>
        /// Name of the calculation step
        /// </summary>
        public string StepName { get; set; } = string.Empty;

        /// <summary>
        /// Price value at this step
        /// </summary>
        public decimal Value { get; set; }

        /// <summary>
        /// Change from previous step (positive or negative)
        /// </summary>
        public decimal Change { get; set; }
    }
}
