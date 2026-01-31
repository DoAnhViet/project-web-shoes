using WebBanGiay.API.DTOs;
using WebBanGiay.API.Models;

namespace WebBanGiay.API.Repositories.Interfaces
{
    /// <summary>
    /// Repository interface for Review data access operations
    /// </summary>
    public interface IReviewRepository
    {
        /// <summary>
        /// Get all reviews for a specific product with pagination
        /// </summary>
        /// <param name="productId">Product ID</param>
        /// <param name="pageNumber">Page number (default 1)</param>
        /// <param name="pageSize">Items per page (default 10)</param>
        /// <returns>PagedResult containing reviews and pagination metadata</returns>
        Task<PagedResult<Review>> GetByProductIdAsync(int productId, int pageNumber = 1, int pageSize = 10);

        /// <summary>
        /// Get a single review by ID
        /// </summary>
        /// <param name="id">Review ID</param>
        /// <returns>Review if found; null otherwise</returns>
        Task<Review?> GetByIdAsync(int id);

        /// <summary>
        /// Create a new review
        /// </summary>
        /// <param name="review">Review to create</param>
        /// <returns>Created review with assigned ID</returns>
        Task<Review> CreateAsync(Review review);

        /// <summary>
        /// Update an existing review
        /// </summary>
        /// <param name="review">Review with updated values</param>
        /// <returns>Updated review</returns>
        Task<Review> UpdateAsync(Review review);

        /// <summary>
        /// Delete a review by ID
        /// </summary>
        /// <param name="id">Review ID to delete</param>
        /// <returns>True if deleted; false if not found</returns>
        Task<bool> DeleteAsync(int id);

        /// <summary>
        /// Get average rating for a product
        /// </summary>
        /// <param name="productId">Product ID</param>
        /// <returns>Average rating (0 if no reviews)</returns>
        Task<decimal> GetAverageRatingAsync(int productId);

        /// <summary>
        /// Get total review count for a product
        /// </summary>
        /// <param name="productId">Product ID</param>
        /// <returns>Number of reviews</returns>
        Task<int> GetReviewCountAsync(int productId);

        /// <summary>
        /// Check if a review exists
        /// </summary>
        /// <param name="id">Review ID</param>
        /// <returns>True if exists; false otherwise</returns>
        Task<bool> ExistsAsync(int id);
    }
}
