using System.ComponentModel.DataAnnotations;

namespace WebBanGiay.API.DTOs
{
    /// <summary>
    /// DTO for creating a new product
    /// Validates that all required fields are provided with proper types
    /// </summary>
    public class ProductCreateDto
    {
        [Required(ErrorMessage = "Product name is required")]
        [StringLength(255, MinimumLength = 1, ErrorMessage = "Product name must be between 1 and 255 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Product description is required")]
        [StringLength(2000, MinimumLength = 1, ErrorMessage = "Description must be between 1 and 2000 characters")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Product price is required")]
        [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Stock quantity is required")]
        [Range(0, int.MaxValue, ErrorMessage = "Stock must be 0 or greater")]
        public int Stock { get; set; }

        [Required(ErrorMessage = "Product image URL is required")]
        [Url(ErrorMessage = "Image URL must be a valid URL")]
        public string ImageUrl { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn một mục trong danh sách")]
        [Range(1, int.MaxValue, ErrorMessage = "Vui lòng chọn một mục trong danh sách")]
        public int CategoryId { get; set; }

        [Required(ErrorMessage = "Product brand is required")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Brand must be between 1 and 100 characters")]
        public string Brand { get; set; } = string.Empty;

        [Required(ErrorMessage = "Product size is required")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "Size must be between 1 and 50 characters")]
        public string Size { get; set; } = string.Empty;

        [Required(ErrorMessage = "Product color is required")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "Color must be between 1 and 50 characters")]
        public string Color { get; set; } = string.Empty;
    }
}
