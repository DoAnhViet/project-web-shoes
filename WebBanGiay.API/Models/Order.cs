using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebBanGiay.API.Models
{
    /// <summary>
    /// Order entity representing a customer order
    /// </summary>
    public class Order
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Unique order code (e.g., ORD + timestamp)
        /// </summary>
        [Required]
        [StringLength(50)]
        public string OrderCode { get; set; } = string.Empty;

        /// <summary>
        /// User ID who placed the order (nullable for guest checkout)
        /// </summary>
        public int? UserId { get; set; }

        /// <summary>
        /// Navigation property to User
        /// </summary>
        [ForeignKey("UserId")]
        public User? User { get; set; }

        /// <summary>
        /// Customer full name
        /// </summary>
        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        /// <summary>
        /// Customer email
        /// </summary>
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Customer phone
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Phone { get; set; } = string.Empty;

        /// <summary>
        /// Shipping address
        /// </summary>
        [Required]
        [StringLength(500)]
        public string Address { get; set; } = string.Empty;

        /// <summary>
        /// City/Province
        /// </summary>
        [StringLength(100)]
        public string City { get; set; } = string.Empty;

        /// <summary>
        /// District
        /// </summary>
        [StringLength(100)]
        public string District { get; set; } = string.Empty;

        /// <summary>
        /// Ward
        /// </summary>
        [StringLength(100)]
        public string Ward { get; set; } = string.Empty;

        /// <summary>
        /// Order note
        /// </summary>
        [StringLength(500)]
        public string? Note { get; set; }

        /// <summary>
        /// Subtotal (before shipping & discount)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }

        /// <summary>
        /// Shipping fee
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingFee { get; set; }

        /// <summary>
        /// Discount amount
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal Discount { get; set; }

        /// <summary>
        /// Total amount
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }

        /// <summary>
        /// Payment method: cod, bank, card, momo
        /// </summary>
        [Required]
        [StringLength(20)]
        public string PaymentMethod { get; set; } = "cod";

        /// <summary>
        /// Payment status: pending, completed
        /// </summary>
        [StringLength(20)]
        public string PaymentStatus { get; set; } = "pending";

        /// <summary>
        /// Order status: pending, confirmed, shipping, delivered, cancelled
        /// </summary>
        [StringLength(20)]
        public string Status { get; set; } = "pending";

        /// <summary>
        /// Order creation timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update timestamp
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Navigation property to order items
        /// </summary>
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }

    /// <summary>
    /// Order item entity
    /// </summary>
    public class OrderItem
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Order ID (Foreign Key)
        /// </summary>
        public int OrderId { get; set; }

        /// <summary>
        /// Navigation property to Order
        /// </summary>
        [ForeignKey("OrderId")]
        public Order? Order { get; set; }

        /// <summary>
        /// Product ID (Foreign Key)
        /// </summary>
        public int ProductId { get; set; }

        /// <summary>
        /// Navigation property to Product
        /// </summary>
        [ForeignKey("ProductId")]
        public Product? Product { get; set; }

        /// <summary>
        /// Product name at time of order
        /// </summary>
        [Required]
        [StringLength(200)]
        public string ProductName { get; set; } = string.Empty;

        /// <summary>
        /// Product image at time of order
        /// </summary>
        [StringLength(500)]
        public string ProductImage { get; set; } = string.Empty;

        /// <summary>
        /// Selected size
        /// </summary>
        [StringLength(20)]
        public string Size { get; set; } = string.Empty;

        /// <summary>
        /// Selected color
        /// </summary>
        [StringLength(50)]
        public string Color { get; set; } = string.Empty;

        /// <summary>
        /// Unit price at time of order
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        /// <summary>
        /// Quantity ordered
        /// </summary>
        public int Quantity { get; set; }

        /// <summary>
        /// Line total (price * quantity)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal LineTotal { get; set; }
    }
}
