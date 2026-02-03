using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebBanGiay.API.Models
{
    /// <summary>
    /// Shopping cart entity
    /// </summary>
    public class Cart
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// User ID (nullable for guest cart using session)
        /// </summary>
        public int? UserId { get; set; }

        /// <summary>
        /// Session ID for guest users
        /// </summary>
        [StringLength(100)]
        public string? SessionId { get; set; }

        /// <summary>
        /// Navigation property to User
        /// </summary>
        [ForeignKey("UserId")]
        public User? User { get; set; }

        /// <summary>
        /// Cart items
        /// </summary>
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

        /// <summary>
        /// Created timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last updated timestamp
        /// </summary>
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// Cart item entity
    /// </summary>
    public class CartItem
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Cart ID
        /// </summary>
        public int CartId { get; set; }

        /// <summary>
        /// Navigation property to Cart
        /// </summary>
        [ForeignKey("CartId")]
        public Cart? Cart { get; set; }

        /// <summary>
        /// Product ID
        /// </summary>
        public int ProductId { get; set; }

        /// <summary>
        /// Navigation property to Product
        /// </summary>
        [ForeignKey("ProductId")]
        public Product? Product { get; set; }

        /// <summary>
        /// Selected size
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Size { get; set; } = string.Empty;

        /// <summary>
        /// Selected color
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Color { get; set; } = string.Empty;

        /// <summary>
        /// Quantity
        /// </summary>
        public int Quantity { get; set; } = 1;

        /// <summary>
        /// Price at time of adding to cart
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        /// <summary>
        /// Added timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
