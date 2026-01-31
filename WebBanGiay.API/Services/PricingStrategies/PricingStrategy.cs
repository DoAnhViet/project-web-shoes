namespace WebBanGiay.API.Services.PricingStrategies
{
    /// <summary>
    /// Strategy pattern for different pricing/discount calculations
    /// </summary>
    public interface IPricingStrategy
    {
        decimal CalculatePrice(decimal basePrice, int quantity);
        string GetName();
    }

    /// <summary>
    /// Standard pricing (no discount)
    /// </summary>
    public class StandardPricingStrategy : IPricingStrategy
    {
        public decimal CalculatePrice(decimal basePrice, int quantity)
        {
            return basePrice * quantity;
        }

        public string GetName() => "Standard";
    }

    /// <summary>
    /// Bulk discount - 10% off for orders >= 10 items
    /// </summary>
    public class BulkDiscountStrategy : IPricingStrategy
    {
        public decimal CalculatePrice(decimal basePrice, int quantity)
        {
            if (quantity >= 10)
            {
                return basePrice * quantity * 0.9m; // 10% discount
            }
            return basePrice * quantity;
        }

        public string GetName() => "BulkDiscount (10% off for 10+)";
    }

    /// <summary>
    /// VIP discount - 15% off
    /// </summary>
    public class VIPDiscountStrategy : IPricingStrategy
    {
        public decimal CalculatePrice(decimal basePrice, int quantity)
        {
            return basePrice * quantity * 0.85m; // 15% discount
        }

        public string GetName() => "VIPDiscount (15% off)";
    }

    /// <summary>
    /// Seasonal discount - 20% off during sale periods
    /// </summary>
    public class SeasonalDiscountStrategy : IPricingStrategy
    {
        public decimal CalculatePrice(decimal basePrice, int quantity)
        {
            return basePrice * quantity * 0.8m; // 20% discount
        }

        public string GetName() => "SeasonalDiscount (20% off)";
    }
}
