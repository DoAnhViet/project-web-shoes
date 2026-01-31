using WebBanGiay.API.Models;
using WebBanGiay.API.Repositories.Strategies;

namespace WebBanGiay.API.Repositories.Strategies.Implementations
{
    /// <summary>
    /// Strategy for filtering products by stock availability
    /// Filters products that are in stock or out of stock
    /// </summary>
    public class StockFilterStrategy : IFilterStrategy
    {
        private readonly bool _inStockOnly;

        public StockFilterStrategy(bool inStockOnly = true)
        {
            _inStockOnly = inStockOnly;
        }

        /// <inheritdoc />
        public IQueryable<Product> Apply(IQueryable<Product> query)
        {
            if (!_inStockOnly)
                return query;

            return query.Where(p => p.Stock > 0);
        }
    }
}
