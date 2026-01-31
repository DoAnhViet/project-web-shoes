using WebBanGiay.API.Models;
using WebBanGiay.API.Repositories.Strategies;

namespace WebBanGiay.API.Repositories.Strategies.Implementations
{
    /// <summary>
    /// Strategy for filtering products by price range
    /// Filters products within minimum and/or maximum price limits
    /// </summary>
    public class PriceFilterStrategy : IFilterStrategy
    {
        private readonly decimal? _minPrice;
        private readonly decimal? _maxPrice;

        public PriceFilterStrategy(decimal? minPrice = null, decimal? maxPrice = null)
        {
            _minPrice = minPrice;
            _maxPrice = maxPrice;
        }

        /// <inheritdoc />
        public IQueryable<Product> Apply(IQueryable<Product> query)
        {
            if (_minPrice.HasValue)
                query = query.Where(p => p.Price >= _minPrice.Value);

            if (_maxPrice.HasValue)
                query = query.Where(p => p.Price <= _maxPrice.Value);

            return query;
        }
    }
}
