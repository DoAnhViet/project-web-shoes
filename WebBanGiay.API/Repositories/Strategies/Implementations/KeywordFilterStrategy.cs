using WebBanGiay.API.Models;
using WebBanGiay.API.Repositories.Strategies;

namespace WebBanGiay.API.Repositories.Strategies.Implementations
{
    /// <summary>
    /// Strategy for filtering products by keyword (search term)
    /// Searches in product name and description
    /// </summary>
    public class KeywordFilterStrategy : IFilterStrategy
    {
        private readonly string? _keyword;

        public KeywordFilterStrategy(string? keyword)
        {
            _keyword = keyword;
        }

        /// <inheritdoc />
        public IQueryable<Product> Apply(IQueryable<Product> query)
        {
            if (string.IsNullOrWhiteSpace(_keyword))
                return query;

            string normalizedKeyword = _keyword.ToLower();
            return query.Where(p =>
                p.Name.ToLower().Contains(normalizedKeyword) ||
                p.Description.ToLower().Contains(normalizedKeyword));
        }
    }
}
