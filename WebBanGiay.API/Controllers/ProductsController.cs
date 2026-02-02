using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.Models;
using WebBanGiay.API.Repositories.Interfaces;
using WebBanGiay.API.Middleware;

namespace WebBanGiay.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepository _productRepository;
        private readonly ILogger<ProductsController> _logger;

        public ProductsController(IProductRepository productRepository, ILogger<ProductsController> logger)
        {
            _productRepository = productRepository;
            _logger = logger;
        }

        // GET: api/Products
        [HttpGet]
        public async Task<ActionResult<PagedResult<Product>>> GetProducts(
            [FromQuery] string? search = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] string? brand = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] string? gender = null,
            [FromQuery] string? size = null,
            [FromQuery] string? color = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var filter = new ProductFilter
                {
                    SearchKeyword = search,
                    CategoryId = categoryId,
                    Brand = brand,
                    MinPrice = minPrice,
                    MaxPrice = maxPrice,
                    Gender = gender,
                    Size = size,
                    Color = color,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                };

                var result = await _productRepository.GetProductsAsync(filter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching products");
                return StatusCode(500, new { message = "Error occurred while fetching products" });
            }
        }

        // GET: api/Products/suggestions
        [HttpGet("suggestions")]
        public async Task<ActionResult<List<Product>>> GetSuggestions([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                {
                    return Ok(new List<Product>());
                }

                var suggestions = await _productRepository.GetSuggestionsWithDetailsAsync(query);
                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching suggestions");
                return StatusCode(500, new { message = "Error occurred while fetching suggestions" });
            }
        }

        // GET: api/Products/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(id);

                if (product == null)
                {
                    return NotFound(new { message = "Product not found" });
                }

                return Ok(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching product with ID: {ProductId}", id);
                return StatusCode(500, new { message = "Error occurred while fetching product" });
            }
        }

        // POST: api/Products
        [HttpPost]
        [RequireAdmin]
        public async Task<ActionResult<Product>> PostProduct([FromBody] ProductCreateDto createDto)
        {
            try
            {
                // === LOGGING: Log received payload ===
                _logger.LogInformation("📥 POST /api/products received payload");
                _logger.LogInformation("  Name: {Name}", createDto?.Name ?? "NULL");
                _logger.LogInformation("  Description: {Description}", createDto?.Description ?? "NULL");
                _logger.LogInformation("  Price: {Price}", createDto?.Price);
                _logger.LogInformation("  Stock: {Stock}", createDto?.Stock);
                _logger.LogInformation("  ImageUrl: {ImageUrl}", createDto?.ImageUrl ?? "NULL");
                _logger.LogInformation("  Brand: {Brand}", createDto?.Brand ?? "NULL");
                _logger.LogInformation("  Size: {Size}", createDto?.Size ?? "NULL");
                _logger.LogInformation("  Color: {Color}", createDto?.Color ?? "NULL");

                // === LOGGING: Log CategoryId with type info ===
                _logger.LogInformation("  ⚠️ CategoryId VALUE: {CategoryIdValue}",
                    createDto?.CategoryId ?? 0);

                // Validate ModelState (automatic validation of DataAnnotations)
                if (!ModelState.IsValid)
                {
                    // === LOGGING: Log ModelState errors ===
                    _logger.LogWarning("❌ ModelState validation failed");
                    var errors = ModelState.Values.SelectMany(v => v.Errors);
                    foreach (var error in errors)
                    {
                        _logger.LogWarning("   - Error: {ErrorMessage}", error.ErrorMessage);
                    }

                    var errorMessage = string.Join("; ", errors.Select(e => e.ErrorMessage));
                    return BadRequest(new { message = errorMessage });
                }

                _logger.LogInformation("✅ ModelState validation passed");

                // Null check
                if (createDto == null)
                {
                    return BadRequest(new { message = "Request body cannot be empty" });
                }

                // Additional validation for CategoryId
                if (createDto.CategoryId <= 0)
                {
                    _logger.LogWarning("⚠️ CategoryId validation failed: CategoryId <= 0 (Value: {CategoryId})", createDto.CategoryId);
                    return BadRequest(new { message = "Vui lòng chọn một mục trong danh sách" });
                }

                _logger.LogInformation("✅ CategoryId validation passed (Value: {CategoryId})", createDto.CategoryId);

                // Map DTO to Product model
                var product = new Product
                {
                    Name = createDto.Name ?? string.Empty,
                    Description = createDto.Description ?? string.Empty,
                    Price = createDto.Price,
                    Stock = createDto.Stock,
                    ImageUrl = createDto.ImageUrl ?? string.Empty,
                    CategoryId = createDto.CategoryId,
                    Brand = createDto.Brand ?? string.Empty,
                    Size = createDto.Size ?? string.Empty,
                    Color = createDto.Color ?? string.Empty,
                    CreatedAt = DateTime.UtcNow
                };

                _logger.LogInformation("🔄 Mapped DTO to Product model, saving to database...");
                var createdProduct = await _productRepository.CreateAsync(product);
                _logger.LogInformation("✨ Product created successfully with ID: {ProductId}", createdProduct.Id);

                return CreatedAtAction(nameof(GetProduct), new { id = createdProduct.Id }, createdProduct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error occurred while creating product");
                return StatusCode(500, new { message = "Error occurred while creating product" });
            }
        }

        // PUT: api/Products/5
        [HttpPut("{id}")]
        [RequireAdmin]
        public async Task<IActionResult> PutProduct(int id, Product product)
        {
            try
            {
                if (id != product.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                var exists = await _productRepository.ExistsAsync(id);
                if (!exists)
                {
                    return NotFound(new { message = "Product not found" });
                }

                await _productRepository.UpdateAsync(product);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Product not found with ID: {ProductId}", id);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating product with ID: {ProductId}", id);
                return StatusCode(500, new { message = "Error occurred while updating product" });
            }
        }

        // DELETE: api/Products/5
        [HttpDelete("{id}")]
        [RequireAdmin]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                var deleted = await _productRepository.DeleteAsync(id);
                if (!deleted)
                {
                    return NotFound(new { message = "Product not found" });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting product with ID: {ProductId}", id);
                return StatusCode(500, new { message = "Error occurred while deleting product" });
            }
        }

        // PATCH: api/Products/{id}/image - Update product image (no auth required)
        [HttpPatch("{id}/image")]
        [AllowAnonymous]
        public async Task<ActionResult> UpdateProductImage(int id, [FromBody] UpdateImageDto dto)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(id);
                if (product == null)
                {
                    return NotFound(new { message = "Product not found" });
                }

                product.ImageUrl = dto.ImageUrl;
                await _productRepository.UpdateAsync(product);

                return Ok(new { message = "Image updated successfully", imageUrl = product.ImageUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product image");
                return StatusCode(500, new { message = "Error updating product image" });
            }
        }
    }

    public class UpdateImageDto
    {
        public string ImageUrl { get; set; } = string.Empty;
    }
}
