using System.ComponentModel.DataAnnotations;

namespace WebBanGiay.API.DTOs
{
    /// <summary>
    /// DTO for adding item to cart
    /// </summary>
    public class AddToCartDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required]
        [StringLength(20)]
        public string Size { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Color { get; set; } = string.Empty;

        [Range(1, 100)]
        public int Quantity { get; set; } = 1;
    }

    /// <summary>
    /// DTO for updating cart item quantity
    /// </summary>
    public class UpdateCartItemDto
    {
        [Range(1, 100)]
        public int Quantity { get; set; }
    }

    /// <summary>
    /// Response DTO for cart
    /// </summary>
    public class CartResponseDto
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string? SessionId { get; set; }
        public List<CartItemResponseDto> Items { get; set; } = new();
        public decimal Subtotal { get; set; }
        public int TotalItems { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// Response DTO for cart item
    /// </summary>
    public class CartItemResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductImage { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal LineTotal { get; set; }
        public int Stock { get; set; }
    }

    /// <summary>
    /// DTO for merging guest cart to user cart after login
    /// </summary>
    public class MergeCartDto
    {
        public string SessionId { get; set; } = string.Empty;
    }
}
