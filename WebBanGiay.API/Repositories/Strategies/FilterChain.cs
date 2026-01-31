using WebBanGiay.API.Models;
using WebBanGiay.API.Repositories.Strategies;

namespace WebBanGiay.API.Repositories.Strategies
{
    /// <summary>
    /// Filter chain composer that applies multiple strategies sequentially
    /// Implements the Chain of Responsibility pattern to compose strategies
    /// </summary>
    public class FilterChain
    {
        private readonly List<IFilterStrategy> _strategies = new();

        /// <summary>
        /// Add a filter strategy to the chain
        /// </summary>
        /// <param name="strategy">Strategy to add</param>
        /// <returns>Self for fluent chaining</returns>
        public FilterChain Add(IFilterStrategy strategy)
        {
            if (strategy != null)
                _strategies.Add(strategy);

            return this;
        }

        /// <summary>
        /// Add multiple filter strategies to the chain
        /// </summary>
        /// <param name="strategies">Strategies to add</param>
        /// <returns>Self for fluent chaining</returns>
        public FilterChain AddMultiple(params IFilterStrategy[] strategies)
        {
            foreach (var strategy in strategies.Where(s => s != null))
                _strategies.Add(strategy);

            return this;
        }

        /// <summary>
        /// Apply all strategies in sequence to the query
        /// </summary>
        /// <param name="query">Base product query</param>
        /// <returns>Filtered query with all strategies applied</returns>
        public IQueryable<Product> Apply(IQueryable<Product> query)
        {
            return _strategies.Aggregate(query, (current, strategy) => strategy.Apply(current));
        }

        /// <summary>
        /// Get the number of strategies in the chain
        /// </summary>
        public int Count => _strategies.Count;

        /// <summary>
        /// Check if chain has any strategies
        /// </summary>
        public bool IsEmpty => _strategies.Count == 0;

        /// <summary>
        /// Clear all strategies from the chain
        /// </summary>
        public FilterChain Clear()
        {
            _strategies.Clear();
            return this;
        }
    }
}
