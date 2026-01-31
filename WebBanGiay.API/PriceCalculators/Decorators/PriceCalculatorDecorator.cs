namespace WebBanGiay.API.PriceCalculators.Decorators
{
    /// <summary>
    /// Abstract base class for price calculator decorators
    /// Implements the Decorator Pattern to wrap IPriceCalculator instances
    /// </summary>
    public abstract class PriceCalculatorDecorator : IPriceCalculator
    {
        /// <summary>
        /// The wrapped price calculator
        /// </summary>
        protected readonly IPriceCalculator _innerCalculator;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="innerCalculator">The calculator to wrap</param>
        protected PriceCalculatorDecorator(IPriceCalculator innerCalculator)
        {
            _innerCalculator = innerCalculator ?? throw new ArgumentNullException(nameof(innerCalculator));
        }

        /// <summary>
        /// Calculate price by delegating to inner calculator first, then applying decoration
        /// </summary>
        /// <param name="basePrice">Base price</param>
        /// <returns>Decorated price</returns>
        public abstract decimal Calculate(decimal basePrice);

        /// <summary>
        /// Get description including the inner calculator's description
        /// </summary>
        /// <returns>Complete description chain</returns>
        public abstract string GetDescription();

        /// <summary>
        /// Helper method to get description from inner calculator
        /// </summary>
        /// <returns>Inner calculator's description</returns>
        protected string GetInnerDescription()
        {
            return _innerCalculator.GetDescription();
        }
    }
}
