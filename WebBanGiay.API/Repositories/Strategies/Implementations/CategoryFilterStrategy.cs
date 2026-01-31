using WebBanGiay.API.Models;
using WebBanGiay.API.Repositories.Strategies;

namespace WebBanGiay.API.Repositories.Strategies.Implementations
{
    /// <summary>
    /// Strategy for filtering products by category
    /// Filters products belonging to a specific category
    /// </summary>
    public class CategoryFilterStrategy : IFilterStrategy
    {
        private readonly int? _categoryId;

        public CategoryFilterStrategy(int? categoryId)
        {
            _categoryId = categoryId;
        }

        /// <inheritdoc />
        public IQueryable<Product> Apply(IQueryable<Product> query)
        {
            if (!_categoryId.HasValue)
                return query;

            return query.Where(p => p.CategoryId == _categoryId.Value);
        }
    }
}
