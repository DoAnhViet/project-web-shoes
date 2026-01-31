using WebBanGiay.API.Models;
using WebBanGiay.API.Repositories.Strategies;

namespace WebBanGiay.API.Repositories.Strategies.Implementations
{
    /// <summary>
    /// Strategy for filtering products by brand
    /// Filters products matching the specified brand name
    /// </summary>
    public class BrandFilterStrategy : IFilterStrategy
    {
        private readonly string? _brand;

        public BrandFilterStrategy(string? brand)
        {
            _brand = brand;
        }

        /// <inheritdoc />
        public IQueryable<Product> Apply(IQueryable<Product> query)
        {
            if (string.IsNullOrWhiteSpace(_brand))
                return query;

            return query.Where(p => p.Brand == _brand);
        }
    }
}
