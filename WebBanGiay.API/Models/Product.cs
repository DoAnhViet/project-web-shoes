using System.Text.Json.Serialization;

namespace WebBanGiay.API.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        
        [JsonIgnore]
        public Category? Category { get; set; }
        
        public string Brand { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Average rating calculated from all reviews (0-5)
        /// </summary>
        public decimal AverageRating { get; set; } = 0;

        /// <summary>
        /// Total number of reviews for this product
        /// </summary>
        public int ReviewCount { get; set; } = 0;

        /// <summary>
        /// Navigation property to reviews
        /// </summary>
        [JsonIgnore]
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
