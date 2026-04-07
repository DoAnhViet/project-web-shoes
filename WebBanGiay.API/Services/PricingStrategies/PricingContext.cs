namespace WebBanGiay.API.Services.PricingStrategies
{
    /// <summary>
    /// Strategy Pattern - Context class for pricing strategies
    /// Selects and applies the appropriate pricing strategy based on order characteristics
    /// </summary>
    public interface IPricingContext
    {
        void SetStrategy(IPricingStrategy strategy);
        decimal CalculatePrice(decimal basePrice, int quantity);
        IPricingStrategy ResolveStrategy(int totalQuantity, bool isVip, bool isSeasonalSale);
    }

    public class PricingContext : IPricingContext
    {
        private IPricingStrategy _strategy;

        public PricingContext()
        {
            _strategy = new StandardPricingStrategy();
        }

        public void SetStrategy(IPricingStrategy strategy)
        {
            _strategy = strategy;
        }

        public decimal CalculatePrice(decimal basePrice, int quantity)
        {
            return _strategy.CalculatePrice(basePrice, quantity);
        }

        /// <summary>
        /// Automatically resolves the best pricing strategy based on order characteristics
        /// Priority: Seasonal > VIP > Bulk > Standard
        /// </summary>
        public IPricingStrategy ResolveStrategy(int totalQuantity, bool isVip, bool isSeasonalSale)
        {
            if (isSeasonalSale) return new SeasonalDiscountStrategy();
            if (isVip) return new VIPDiscountStrategy();
            if (totalQuantity >= 10) return new BulkDiscountStrategy();
            return new StandardPricingStrategy();
        }
    }
}
