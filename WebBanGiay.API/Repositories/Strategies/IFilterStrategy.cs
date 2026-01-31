using WebBanGiay.API.Models;

namespace WebBanGiay.API.Repositories.Strategies
{
    /// <summary>
    /// Strategy interface for filtering products
    /// Implements the Strategy Pattern to allow flexible, composable filtering logic
    /// Each concrete implementation handles a specific filter type
    /// </summary>
    public interface IFilterStrategy
    {
        /// <summary>
        /// Apply filter logic to the product query
        /// </summary>
        /// <param name="query">Current queryable collection</param>
        /// <returns>Filtered queryable collection</returns>
        IQueryable<Product> Apply(IQueryable<Product> query);
    }
}
