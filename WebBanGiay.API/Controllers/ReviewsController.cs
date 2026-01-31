using Microsoft.AspNetCore.Mvc;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.Models;
using WebBanGiay.API.Repositories.Interfaces;

namespace WebBanGiay.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewRepository _reviewRepository;
        private readonly IProductRepository _productRepository;
        private readonly ILogger<ReviewsController> _logger;

        /// <summary>
        /// Constructor
        /// </summary>
        public ReviewsController(
            IReviewRepository reviewRepository,
            IProductRepository productRepository,
            ILogger<ReviewsController> logger)
        {
            _reviewRepository = reviewRepository ?? throw new ArgumentNullException(nameof(reviewRepository));
            _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Get all reviews for a product with pagination
        /// GET /api/reviews?productId=1&pageNumber=1&pageSize=10
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<PagedResult<Review>>> GetReviews(
            [FromQuery] int productId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (productId <= 0)
                {
                    return BadRequest(new { message = "Product ID must be greater than 0" });
                }

                // Check if product exists
                var product = await _productRepository.GetByIdAsync(productId);
                if (product == null)
                {
                    return NotFound(new { message = "Product not found" });
                }

                var result = await _reviewRepository.GetByProductIdAsync(productId, pageNumber, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching reviews");
                return StatusCode(500, new { message = "Error occurred while fetching reviews" });
            }
        }

        /// <summary>
        /// Get a single review by ID
        /// GET /api/reviews/5
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Review>> GetReview(int id)
        {
            try
            {
                var review = await _reviewRepository.GetByIdAsync(id);
                if (review == null)
                {
                    return NotFound(new { message = "Review not found" });
                }

                return Ok(review);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while fetching review with ID: {id}");
                return StatusCode(500, new { message = "Error occurred while fetching review" });
            }
        }

        /// <summary>
        /// Create a new review
        /// POST /api/reviews
        /// Body: { "productId": 1, "reviewerId": "user123", "rating": 5, "comment": "Great product!" }
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Review>> PostReview(Review review)
        {
            try
            {
                // Validate product exists
                var product = await _productRepository.GetByIdAsync(review.ProductId);
                if (product == null)
                {
                    return BadRequest(new { message = "Product not found" });
                }

                // Validate rating
                if (!review.IsValidRating)
                {
                    return BadRequest(new { message = "Rating must be between 1 and 5" });
                }

                // Validate reviewer ID
                if (string.IsNullOrWhiteSpace(review.ReviewerId))
                {
                    return BadRequest(new { message = "Reviewer ID is required" });
                }

                // Validate comment
                if (string.IsNullOrWhiteSpace(review.Comment))
                {
                    return BadRequest(new { message = "Comment is required" });
                }

                var createdReview = await _reviewRepository.CreateAsync(review);
                return CreatedAtAction(nameof(GetReview), new { id = createdReview.Id }, createdReview);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid review data provided");
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Referenced product not found");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating review");
                return StatusCode(500, new { message = "Error occurred while creating review" });
            }
        }

        /// <summary>
        /// Update an existing review
        /// PUT /api/reviews/5
        /// Body: { "id": 5, "productId": 1, "reviewerId": "user123", "rating": 4, "comment": "Good product" }
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutReview(int id, Review review)
        {
            try
            {
                if (id != review.Id)
                {
                    return BadRequest(new { message = "Review ID mismatch" });
                }

                // Check if review exists
                var existingReview = await _reviewRepository.GetByIdAsync(id);
                if (existingReview == null)
                {
                    return NotFound(new { message = "Review not found" });
                }

                // Validate rating
                if (!review.IsValidRating)
                {
                    return BadRequest(new { message = "Rating must be between 1 and 5" });
                }

                var updatedReview = await _reviewRepository.UpdateAsync(review);
                return Ok(updatedReview);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, $"Review with ID {id} not found");
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid review data provided");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while updating review with ID: {id}");
                return StatusCode(500, new { message = "Error occurred while updating review" });
            }
        }

        /// <summary>
        /// Delete a review
        /// DELETE /api/reviews/5
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            try
            {
                var result = await _reviewRepository.DeleteAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "Review not found" });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while deleting review with ID: {id}");
                return StatusCode(500, new { message = "Error occurred while deleting review" });
            }
        }

        /// <summary>
        /// Get average rating for a product
        /// GET /api/reviews/1/rating
        /// </summary>
        [HttpGet("{productId}/rating")]
        public async Task<ActionResult<decimal>> GetAverageRating(int productId)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(productId);
                if (product == null)
                {
                    return NotFound(new { message = "Product not found" });
                }

                var averageRating = await _reviewRepository.GetAverageRatingAsync(productId);
                return Ok(new { productId, averageRating });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while fetching average rating for product {productId}");
                return StatusCode(500, new { message = "Error occurred while fetching average rating" });
            }
        }

        /// <summary>
        /// Get review count for a product
        /// GET /api/reviews/1/count
        /// </summary>
        [HttpGet("{productId}/count")]
        public async Task<ActionResult<int>> GetReviewCount(int productId)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(productId);
                if (product == null)
                {
                    return NotFound(new { message = "Product not found" });
                }

                var reviewCount = await _reviewRepository.GetReviewCountAsync(productId);
                return Ok(new { productId, reviewCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while fetching review count for product {productId}");
                return StatusCode(500, new { message = "Error occurred while fetching review count" });
            }
        }
    }
}
