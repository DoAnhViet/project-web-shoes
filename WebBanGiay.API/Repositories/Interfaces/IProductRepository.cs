using WebBanGiay.API.DTOs;
using WebBanGiay.API.Models;

namespace WebBanGiay.API.Repositories.Interfaces
{
    /// <summary>
    /// Repository interface for Product data access operations
    /// Defines contract for product-related database operations
    /// </summary>
    public interface IProductRepository
    {
        /// <summary>
        /// Get paginated list of products with filtering, sorting, and search capabilities
        /// </summary>
        /// <param name="filter">Product filter criteria including search, category, brand, and pagination</param>
        /// <returns>PagedResult containing products and pagination metadata</returns>
        Task<PagedResult<Product>> GetProductsAsync(ProductFilter filter);

        /// <summary>
        /// Get a single product by ID with related category data
        /// </summary>
        /// <param name="id">Product ID</param>
        /// <returns>Product if found; null otherwise</returns>
        Task<Product?> GetByIdAsync(int id);

        /// <summary>
        /// Get search suggestions based on keyword
        /// Returns list of unique product names matching the keyword
        /// </summary>
        /// <param name="keyword">Search keyword</param>
        /// <returns>List of product name suggestions</returns>
        Task<List<string>> GetSuggestionsAsync(string keyword);

        /// <summary>
        /// Get search suggestions with product details for autocomplete dropdown
        /// Returns list of products matching the keyword with id, name, brand, price, and image
        /// </summary>
        /// <param name="query">Search query keyword</param>
        /// <returns>List of products with essential details for autocomplete</returns>
        Task<List<Product>> GetSuggestionsWithDetailsAsync(string query);

        /// <summary>
        /// Create a new product
        /// </summary>
        /// <param name="product">Product to create</param>
        /// <returns>Created product with assigned ID</returns>
        Task<Product> CreateAsync(Product product);

        /// <summary>
        /// Update an existing product
        /// </summary>
        /// <param name="product">Product with updated values</param>
        /// <returns>Updated product</returns>
        Task<Product> UpdateAsync(Product product);

        /// <summary>
        /// Delete a product by ID
        /// </summary>
        /// <param name="id">Product ID</param>
        /// <returns>True if deletion succeeded; false if product not found</returns>
        Task<bool> DeleteAsync(int id);

        /// <summary>
        /// Check if product exists by ID
        /// </summary>
        /// <param name="id">Product ID</param>
        /// <returns>True if product exists; false otherwise</returns>
        Task<bool> ExistsAsync(int id);
    }
}
