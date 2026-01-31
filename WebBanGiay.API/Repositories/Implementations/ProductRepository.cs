using Microsoft.EntityFrameworkCore;
using WebBanGiay.API.Data;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.Models;
using WebBanGiay.API.Repositories.Interfaces;
using WebBanGiay.API.Repositories.Strategies;
using WebBanGiay.API.Repositories.Strategies.Implementations;

namespace WebBanGiay.API.Repositories.Implementations
{
    /// <summary>
    /// Repository implementation for Product entity
    /// Handles all database operations for products using Entity Framework Core
    /// Implements filtering using the Strategy Pattern for extensibility
    /// </summary>
    public class ProductRepository : IProductRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProductRepository> _logger;

        public ProductRepository(ApplicationDbContext context, ILogger<ProductRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<PagedResult<Product>> GetProductsAsync(ProductFilter filter)
        {
            try
            {
                // Validate pagination parameters
                int pageNumber = Math.Max(1, filter.PageNumber);
                int pageSize = Math.Max(1, Math.Min(filter.PageSize, 100)); // Max 100 items per page

                // Build base query with eager loading
                IQueryable<Product> query = _context.Products
                    .Include(p => p.Category)
                    .AsQueryable();

                // Apply filter strategies using Strategy Pattern
                // Each strategy is responsible for a specific filter concern
                query = ApplyFilterStrategies(query, filter);

                // Get total count before pagination
                int totalCount = await query.CountAsync();

                // Apply pagination
                var products = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return new PagedResult<Product>(products, totalCount, pageNumber, pageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting products with filter");
                throw;
            }
        }

        /// <summary>
        /// Apply all filter strategies to the query
        /// Demonstrates the Strategy Pattern for composable filtering logic
        /// Strategies are applied in sequence, each filtering based on specific criteria
        /// </summary>
        /// <param name="query">Base product query</param>
        /// <param name="filter">Filter criteria containing all filter parameters</param>
        /// <returns>Filtered query with all strategies applied</returns>
        private IQueryable<Product> ApplyFilterStrategies(IQueryable<Product> query, ProductFilter filter)
        {
            // Create filter chain and add strategies
            var filterChain = new FilterChain()
                .Add(new KeywordFilterStrategy(filter.SearchKeyword))
                .Add(new CategoryFilterStrategy(filter.CategoryId))
                .Add(new BrandFilterStrategy(filter.Brand))
                .Add(new PriceFilterStrategy(filter.MinPrice, filter.MaxPrice));

            // Apply advanced filters using LINQ
            // Gender filter
            if (!string.IsNullOrWhiteSpace(filter.Gender))
            {
                // Note: Gender would need to be added to Product model or determined by category
                // For now, we'll skip this or implement as a future enhancement
                // query = query.Where(p => p.Gender == filter.Gender);
            }

            // Size filter
            if (!string.IsNullOrWhiteSpace(filter.Size))
            {
                query = query.Where(p => p.Size != null && p.Size.Contains(filter.Size));
            }

            // Color filter
            if (!string.IsNullOrWhiteSpace(filter.Color))
            {
                query = query.Where(p => p.Color != null && p.Color.Contains(filter.Color));
            }

            // Apply all strategies to the query
            return filterChain.Apply(query);
        }

        /// <inheritdoc />
        public async Task<Product?> GetByIdAsync(int id)
        {
            try
            {
                return await _context.Products
                    .Include(p => p.Category)
                    .FirstOrDefaultAsync(p => p.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting product by ID: {ProductId}", id);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<List<string>> GetSuggestionsAsync(string keyword)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(keyword))
                {
                    return new List<string>();
                }

                string normalizedKeyword = keyword.ToLower();

                return await _context.Products
                    .Where(p => p.Name.ToLower().Contains(normalizedKeyword))
                    .Select(p => p.Name)
                    .Distinct()
                    .Take(10) // Limit suggestions to 10 results
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting product suggestions for keyword: {Keyword}", keyword);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<List<Product>> GetSuggestionsWithDetailsAsync(string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                {
                    return new List<Product>();
                }

                string normalizedQuery = query.ToLower();

                return await _context.Products
                    .Where(p => p.Name.ToLower().Contains(normalizedQuery) || 
                                p.Brand.ToLower().Contains(normalizedQuery))
                    .OrderBy(p => p.Name)
                    .Take(10) // Limit suggestions to 10 results
                    .Select(p => new Product
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Price = p.Price,
                        Brand = p.Brand,
                        ImageUrl = p.ImageUrl,
                        Description = p.Description,
                        Stock = p.Stock,
                        Size = p.Size,
                        Color = p.Color,
                        CategoryId = p.CategoryId,
                        CreatedAt = p.CreatedAt,
                        AverageRating = p.AverageRating,
                        ReviewCount = p.ReviewCount
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting product suggestions with details for query: {Query}", query);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<Product> CreateAsync(Product product)
        {
            try
            {
                product.CreatedAt = DateTime.UtcNow;
                _context.Products.Add(product);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Product created successfully with ID: {ProductId}", product.Id);
                return product;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating product");
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<Product> UpdateAsync(Product product)
        {
            try
            {
                // Check if product exists
                var existingProduct = await _context.Products.FindAsync(product.Id);
                if (existingProduct == null)
                {
                    throw new KeyNotFoundException($"Product with ID {product.Id} not found");
                }

                _context.Entry(product).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Product updated successfully with ID: {ProductId}", product.Id);
                return product;
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error occurred while updating product with ID: {ProductId}", product.Id);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating product with ID: {ProductId}", product.Id);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(int id)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                {
                    return false;
                }

                _context.Products.Remove(product);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Product deleted successfully with ID: {ProductId}", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting product with ID: {ProductId}", id);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<bool> ExistsAsync(int id)
        {
            try
            {
                return await _context.Products.AnyAsync(p => p.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while checking if product exists with ID: {ProductId}", id);
                throw;
            }
        }
    }
}
