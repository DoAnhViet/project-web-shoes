using Microsoft.EntityFrameworkCore;
using WebBanGiay.API.Data;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.Models;
using WebBanGiay.API.Observers;
using WebBanGiay.API.Repositories.Interfaces;

namespace WebBanGiay.API.Repositories.Implementations
{
    /// <summary>
    /// Repository implementation for Review data access operations
    /// Uses Entity Framework Core with MySQL database
    /// Integrates with Observer Pattern to notify subscribers
    /// </summary>
    public class ReviewRepository : IReviewRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly ReviewSubject _reviewSubject;
        private readonly ILogger<ReviewRepository> _logger;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="context">Database context</param>
        /// <param name="reviewSubject">Subject for notifying observers</param>
        /// <param name="logger">Logger for diagnostic messages</param>
        public ReviewRepository(
            ApplicationDbContext context,
            ReviewSubject reviewSubject,
            ILogger<ReviewRepository> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _reviewSubject = reviewSubject ?? throw new ArgumentNullException(nameof(reviewSubject));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Get all reviews for a product with pagination
        /// </summary>
        public async Task<PagedResult<Review>> GetByProductIdAsync(int productId, int pageNumber = 1, int pageSize = 10)
        {
            try
            {
                // Validation
                if (pageNumber < 1) pageNumber = 1;
                if (pageSize < 1) pageSize = 10;
                if (pageSize > 100) pageSize = 100;

                var query = _context.Reviews
                    .AsNoTracking()
                    .Where(r => r.ProductId == productId)
                    .OrderByDescending(r => r.CreatedAt);

                var totalCount = await query.CountAsync();
                var reviews = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return new PagedResult<Review>
                {
                    Items = reviews,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting reviews for product {productId}");
                throw;
            }
        }

        /// <summary>
        /// Get a single review by ID
        /// </summary>
        public async Task<Review?> GetByIdAsync(int id)
        {
            try
            {
                return await _context.Reviews
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r => r.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting review with ID {id}");
                throw;
            }
        }

        /// <summary>
        /// Create a new review
        /// Notifies observers about the new review
        /// </summary>
        public async Task<Review> CreateAsync(Review review)
        {
            try
            {
                if (review == null)
                    throw new ArgumentNullException(nameof(review));

                if (!review.IsValidRating)
                    throw new ArgumentException("Rating must be between 1 and 5");

                if (string.IsNullOrWhiteSpace(review.ReviewerId))
                    throw new ArgumentException("ReviewerId is required");

                // Get the product to include in notification
                var product = await _context.Products
                    .Include(p => p.Reviews)
                    .FirstOrDefaultAsync(p => p.Id == review.ProductId);

                if (product == null)
                    throw new KeyNotFoundException($"Product with ID {review.ProductId} not found");

                // Add review to context
                _context.Reviews.Add(review);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Review {review.Id} created for product {review.ProductId}");

                // Notify observers about new review
                // This triggers the UpdateProductRatingObserver
                await _reviewSubject.NotifyReviewAdded(product, review);

                return review;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating review");
                throw;
            }
        }

        /// <summary>
        /// Update an existing review
        /// Notifies observers about the review update
        /// </summary>
        public async Task<Review> UpdateAsync(Review review)
        {
            try
            {
                if (review == null)
                    throw new ArgumentNullException(nameof(review));

                if (!review.IsValidRating)
                    throw new ArgumentException("Rating must be between 1 and 5");

                var existingReview = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == review.Id);
                if (existingReview == null)
                    throw new KeyNotFoundException($"Review with ID {review.Id} not found");

                // Store old review for comparison
                var oldReview = new Review
                {
                    Id = existingReview.Id,
                    ProductId = existingReview.ProductId,
                    ReviewerId = existingReview.ReviewerId,
                    Rating = existingReview.Rating,
                    Comment = existingReview.Comment,
                    CreatedAt = existingReview.CreatedAt
                };

                // Update properties
                existingReview.Rating = review.Rating;
                existingReview.Comment = review.Comment;
                existingReview.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Review {review.Id} updated");

                // Get product for notification
                var product = await _context.Products
                    .Include(p => p.Reviews)
                    .FirstOrDefaultAsync(p => p.Id == review.ProductId);

                if (product != null)
                {
                    // Notify observers about review update
                    await _reviewSubject.NotifyReviewUpdated(product, oldReview, existingReview);
                }

                return existingReview;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating review with ID {review.Id}");
                throw;
            }
        }

        /// <summary>
        /// Delete a review
        /// Notifies observers about the deletion
        /// </summary>
        public async Task<bool> DeleteAsync(int id)
        {
            try
            {
                var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == id);
                if (review == null)
                    return false;

                // Get product before deleting review
                var product = await _context.Products
                    .Include(p => p.Reviews)
                    .FirstOrDefaultAsync(p => p.Id == review.ProductId);

                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Review {id} deleted");

                // Notify observers about deletion
                if (product != null)
                {
                    await _reviewSubject.NotifyReviewDeleted(product, review);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting review with ID {id}");
                throw;
            }
        }

        /// <summary>
        /// Get average rating for a product
        /// </summary>
        public async Task<decimal> GetAverageRatingAsync(int productId)
        {
            try
            {
                var reviews = await _context.Reviews
                    .AsNoTracking()
                    .Where(r => r.ProductId == productId)
                    .ToListAsync();

                if (!reviews.Any())
                    return 0;

                return (decimal)reviews.Average(r => r.Rating);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting average rating for product {productId}");
                throw;
            }
        }

        /// <summary>
        /// Get review count for a product
        /// </summary>
        public async Task<int> GetReviewCountAsync(int productId)
        {
            try
            {
                return await _context.Reviews
                    .AsNoTracking()
                    .CountAsync(r => r.ProductId == productId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting review count for product {productId}");
                throw;
            }
        }

        /// <summary>
        /// Check if a review exists
        /// </summary>
        public async Task<bool> ExistsAsync(int id)
        {
            try
            {
                return await _context.Reviews.AnyAsync(r => r.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking if review exists with ID {id}");
                throw;
            }
        }
    }
}
