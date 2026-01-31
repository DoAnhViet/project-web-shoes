namespace WebBanGiay.API.Models
{
    /// <summary>
    /// Review entity representing a customer review for a product
    /// </summary>
    public class Review
    {
        /// <summary>
        /// Unique identifier for the review
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Product ID this review is for (Foreign Key)
        /// </summary>
        public int ProductId { get; set; }

        /// <summary>
        /// Navigation property to Product
        /// </summary>
        public Product? Product { get; set; }

        /// <summary>
        /// ID of the user who wrote the review
        /// For future enhancement: use actual UserId from authentication
        /// </summary>
        public string ReviewerId { get; set; } = string.Empty;

        /// <summary>
        /// Rating from 1 to 5 stars
        /// </summary>
        public int Rating { get; set; }

        /// <summary>
        /// Review comment/feedback text
        /// </summary>
        public string Comment { get; set; } = string.Empty;

        /// <summary>
        /// Timestamp when review was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Timestamp when review was last updated
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Validation: Ensure rating is between 1 and 5
        /// </summary>
        public bool IsValidRating => Rating >= 1 && Rating <= 5;
    }
}
