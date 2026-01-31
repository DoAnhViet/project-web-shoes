using WebBanGiay.API.Models;
using WebBanGiay.API.Repositories.Interfaces;

namespace WebBanGiay.API.Observers.Implementations
{
    /// <summary>
    /// Observer that updates product rating when reviews change
    /// Implements IReviewObserver to recalculate average rating
    /// </summary>
    public class UpdateProductRatingObserver : IReviewObserver
    {
        private readonly IProductRepository _productRepository;
        private readonly ILogger<UpdateProductRatingObserver> _logger;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="productRepository">Repository for product operations</param>
        /// <param name="logger">Logger for diagnostic messages</param>
        public UpdateProductRatingObserver(
            IProductRepository productRepository,
            ILogger<UpdateProductRatingObserver> logger)
        {
            _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Recalculates product average rating when a new review is added
        /// </summary>
        /// <param name="product">Product that received the new review</param>
        /// <param name="review">The new review that was added</param>
        public async Task OnReviewAdded(Product product, Review review)
        {
            try
            {
                _logger.LogInformation($"UpdateProductRatingObserver: Processing new review for product {product.Id}");

                // Calculate new average rating
                await RecalculateProductRating(product);

                _logger.LogInformation(
                    $"UpdateProductRatingObserver: Updated product {product.Id} rating to {product.AverageRating}, ReviewCount: {product.ReviewCount}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating product rating for product {product.Id} on review add");
                throw;
            }
        }

        /// <summary>
        /// Recalculates product average rating when a review is updated
        /// </summary>
        /// <param name="product">Product whose review was updated</param>
        /// <param name="oldReview">The original review before update</param>
        /// <param name="newReview">The updated review</param>
        public async Task OnReviewUpdated(Product product, Review oldReview, Review newReview)
        {
            try
            {
                _logger.LogInformation($"UpdateProductRatingObserver: Processing review update for product {product.Id}");

                // Recalculate average rating with updated review
                await RecalculateProductRating(product);

                _logger.LogInformation(
                    $"UpdateProductRatingObserver: Updated product {product.Id} rating to {product.AverageRating}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating product rating for product {product.Id} on review update");
                throw;
            }
        }

        /// <summary>
        /// Recalculates product average rating when a review is deleted
        /// </summary>
        /// <param name="product">Product whose review was deleted</param>
        /// <param name="review">The deleted review</param>
        public async Task OnReviewDeleted(Product product, Review review)
        {
            try
            {
                _logger.LogInformation($"UpdateProductRatingObserver: Processing review deletion for product {product.Id}");

                // Recalculate average rating after deletion
                await RecalculateProductRating(product);

                _logger.LogInformation(
                    $"UpdateProductRatingObserver: Updated product {product.Id} rating to {product.AverageRating}, ReviewCount: {product.ReviewCount}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating product rating for product {product.Id} on review delete");
                throw;
            }
        }

        /// <summary>
        /// Recalculates the average rating and review count for a product
        /// Uses LINQ to calculate from existing reviews
        /// </summary>
        /// <param name="product">Product to recalculate rating for</param>
        private async Task RecalculateProductRating(Product product)
        {
            try
            {
                // Calculate statistics from reviews
                if (product.Reviews != null && product.Reviews.Any())
                {
                    product.AverageRating = (decimal)product.Reviews.Average(r => r.Rating);
                    product.ReviewCount = product.Reviews.Count;
                }
                else
                {
                    product.AverageRating = 0;
                    product.ReviewCount = 0;
                }

                // Update product in repository
                // This uses the existing UpdateAsync method
                await _productRepository.UpdateAsync(product);

                _logger.LogDebug(
                    $"Product {product.Id} rating recalculated: AverageRating={product.AverageRating:F2}, ReviewCount={product.ReviewCount}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error recalculating rating for product {product.Id}");
                throw;
            }
        }
    }
}
