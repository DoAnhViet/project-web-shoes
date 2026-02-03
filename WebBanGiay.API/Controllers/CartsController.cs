using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebBanGiay.API.Data;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.Models;

namespace WebBanGiay.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CartsController> _logger;

        public CartsController(ApplicationDbContext context, ILogger<CartsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get cart by session ID (for guest users)
        /// GET /api/carts/session/{sessionId}
        /// </summary>
        [HttpGet("session/{sessionId}")]
        public async Task<ActionResult<CartResponseDto>> GetCartBySession(string sessionId)
        {
            try
            {
                var cart = await GetOrCreateCart(null, sessionId);
                return Ok(MapToResponseDto(cart));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cart by session");
                return StatusCode(500, new { message = "Error getting cart" });
            }
        }

        /// <summary>
        /// Get cart by user ID (for logged-in users)
        /// GET /api/carts/user/{userId}
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<CartResponseDto>> GetCartByUser(int userId)
        {
            try
            {
                var cart = await GetOrCreateCart(userId, null);
                return Ok(MapToResponseDto(cart));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cart by user");
                return StatusCode(500, new { message = "Error getting cart" });
            }
        }

        /// <summary>
        /// Add item to cart
        /// POST /api/carts/session/{sessionId}/items or /api/carts/user/{userId}/items
        /// </summary>
        [HttpPost("session/{sessionId}/items")]
        public async Task<ActionResult<CartResponseDto>> AddToCartBySession(string sessionId, [FromBody] AddToCartDto dto)
        {
            return await AddToCart(null, sessionId, dto);
        }

        [HttpPost("user/{userId}/items")]
        public async Task<ActionResult<CartResponseDto>> AddToCartByUser(int userId, [FromBody] AddToCartDto dto)
        {
            return await AddToCart(userId, null, dto);
        }

        private async Task<ActionResult<CartResponseDto>> AddToCart(int? userId, string? sessionId, AddToCartDto dto)
        {
            try
            {
                // Validate product exists
                var product = await _context.Products.FindAsync(dto.ProductId);
                if (product == null)
                {
                    return NotFound(new { message = "Product not found" });
                }

                // Check stock
                if (product.Stock < dto.Quantity)
                {
                    return BadRequest(new { message = "Insufficient stock" });
                }

                var cart = await GetOrCreateCart(userId, sessionId);

                // Check if item already exists in cart (same product, size, color)
                var existingItem = cart.CartItems.FirstOrDefault(ci =>
                    ci.ProductId == dto.ProductId &&
                    ci.Size == dto.Size &&
                    ci.Color == dto.Color);

                if (existingItem != null)
                {
                    // Update quantity
                    existingItem.Quantity += dto.Quantity;
                    if (existingItem.Quantity > product.Stock)
                    {
                        return BadRequest(new { message = "Insufficient stock" });
                    }
                }
                else
                {
                    // Add new item
                    cart.CartItems.Add(new CartItem
                    {
                        ProductId = dto.ProductId,
                        Size = dto.Size,
                        Color = dto.Color,
                        Quantity = dto.Quantity,
                        Price = product.Price,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                cart.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Reload cart with products
                cart = await GetCartWithProducts(cart.Id);

                _logger.LogInformation("Item added to cart {CartId}", cart.Id);

                return Ok(MapToResponseDto(cart!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding item to cart");
                return StatusCode(500, new { message = "Error adding item to cart" });
            }
        }

        /// <summary>
        /// Update cart item quantity
        /// PUT /api/carts/items/{itemId}
        /// </summary>
        [HttpPut("items/{itemId}")]
        public async Task<ActionResult<CartResponseDto>> UpdateCartItem(int itemId, [FromBody] UpdateCartItemDto dto)
        {
            try
            {
                var cartItem = await _context.CartItems
                    .Include(ci => ci.Cart)
                    .ThenInclude(c => c!.CartItems)
                    .Include(ci => ci.Product)
                    .FirstOrDefaultAsync(ci => ci.Id == itemId);

                if (cartItem == null)
                {
                    return NotFound(new { message = "Cart item not found" });
                }

                // Check stock
                if (cartItem.Product != null && dto.Quantity > cartItem.Product.Stock)
                {
                    return BadRequest(new { message = "Insufficient stock" });
                }

                cartItem.Quantity = dto.Quantity;
                cartItem.Cart!.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var cart = await GetCartWithProducts(cartItem.CartId);

                _logger.LogInformation("Cart item {ItemId} updated", itemId);

                return Ok(MapToResponseDto(cart!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating cart item");
                return StatusCode(500, new { message = "Error updating cart item" });
            }
        }

        /// <summary>
        /// Remove item from cart
        /// DELETE /api/carts/items/{itemId}
        /// </summary>
        [HttpDelete("items/{itemId}")]
        public async Task<ActionResult<CartResponseDto>> RemoveCartItem(int itemId)
        {
            try
            {
                var cartItem = await _context.CartItems
                    .Include(ci => ci.Cart)
                    .FirstOrDefaultAsync(ci => ci.Id == itemId);

                if (cartItem == null)
                {
                    return NotFound(new { message = "Cart item not found" });
                }

                var cartId = cartItem.CartId;

                _context.CartItems.Remove(cartItem);

                var cart = await _context.Carts.FindAsync(cartId);
                if (cart != null)
                {
                    cart.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                cart = await GetCartWithProducts(cartId);

                _logger.LogInformation("Cart item {ItemId} removed", itemId);

                return Ok(MapToResponseDto(cart!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing cart item");
                return StatusCode(500, new { message = "Error removing cart item" });
            }
        }

        /// <summary>
        /// Clear all items from cart
        /// DELETE /api/carts/session/{sessionId} or /api/carts/user/{userId}
        /// </summary>
        [HttpDelete("session/{sessionId}")]
        public async Task<ActionResult> ClearCartBySession(string sessionId)
        {
            return await ClearCart(null, sessionId);
        }

        [HttpDelete("user/{userId}")]
        public async Task<ActionResult> ClearCartByUser(int userId)
        {
            return await ClearCart(userId, null);
        }

        private async Task<ActionResult> ClearCart(int? userId, string? sessionId)
        {
            try
            {
                Cart? cart;
                if (userId.HasValue)
                {
                    cart = await _context.Carts
                        .Include(c => c.CartItems)
                        .FirstOrDefaultAsync(c => c.UserId == userId);
                }
                else
                {
                    cart = await _context.Carts
                        .Include(c => c.CartItems)
                        .FirstOrDefaultAsync(c => c.SessionId == sessionId);
                }

                if (cart == null)
                {
                    return Ok(new { message = "Cart is already empty" });
                }

                _context.CartItems.RemoveRange(cart.CartItems);
                cart.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Cart {CartId} cleared", cart.Id);

                return Ok(new { message = "Cart cleared successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing cart");
                return StatusCode(500, new { message = "Error clearing cart" });
            }
        }

        /// <summary>
        /// Merge guest cart to user cart after login
        /// POST /api/carts/merge/{userId}
        /// </summary>
        [HttpPost("merge/{userId}")]
        public async Task<ActionResult<CartResponseDto>> MergeCart(int userId, [FromBody] MergeCartDto dto)
        {
            try
            {
                // Get guest cart
                var guestCart = await _context.Carts
                    .Include(c => c.CartItems)
                    .FirstOrDefaultAsync(c => c.SessionId == dto.SessionId);

                if (guestCart == null || !guestCart.CartItems.Any())
                {
                    // No guest cart, just return user cart
                    var existingUserCart = await GetOrCreateCart(userId, null);
                    return Ok(MapToResponseDto(existingUserCart));
                }

                // Get or create user cart
                var userCart = await GetOrCreateCart(userId, null);

                // Merge items
                foreach (var guestItem in guestCart.CartItems)
                {
                    var existingItem = userCart.CartItems.FirstOrDefault(ci =>
                        ci.ProductId == guestItem.ProductId &&
                        ci.Size == guestItem.Size &&
                        ci.Color == guestItem.Color);

                    if (existingItem != null)
                    {
                        existingItem.Quantity += guestItem.Quantity;
                    }
                    else
                    {
                        userCart.CartItems.Add(new CartItem
                        {
                            ProductId = guestItem.ProductId,
                            Size = guestItem.Size,
                            Color = guestItem.Color,
                            Quantity = guestItem.Quantity,
                            Price = guestItem.Price,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                userCart.UpdatedAt = DateTime.UtcNow;

                // Delete guest cart
                _context.CartItems.RemoveRange(guestCart.CartItems);
                _context.Carts.Remove(guestCart);

                await _context.SaveChangesAsync();

                // Reload user cart
                userCart = await GetCartWithProducts(userCart.Id);

                _logger.LogInformation("Cart merged from session {SessionId} to user {UserId}", dto.SessionId, userId);

                return Ok(MapToResponseDto(userCart!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error merging cart");
                return StatusCode(500, new { message = "Error merging cart" });
            }
        }

        /// <summary>
        /// Get cart item count
        /// GET /api/carts/count/session/{sessionId} or /api/carts/count/user/{userId}
        /// </summary>
        [HttpGet("count/session/{sessionId}")]
        public async Task<ActionResult> GetCartCountBySession(string sessionId)
        {
            try
            {
                var count = await _context.CartItems
                    .Where(ci => ci.Cart!.SessionId == sessionId)
                    .SumAsync(ci => ci.Quantity);

                return Ok(new { count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cart count");
                return StatusCode(500, new { message = "Error getting cart count" });
            }
        }

        [HttpGet("count/user/{userId}")]
        public async Task<ActionResult> GetCartCountByUser(int userId)
        {
            try
            {
                var count = await _context.CartItems
                    .Where(ci => ci.Cart!.UserId == userId)
                    .SumAsync(ci => ci.Quantity);

                return Ok(new { count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cart count");
                return StatusCode(500, new { message = "Error getting cart count" });
            }
        }

        #region Private Helpers

        private async Task<Cart> GetOrCreateCart(int? userId, string? sessionId)
        {
            Cart? cart;

            if (userId.HasValue)
            {
                cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                    .FirstOrDefaultAsync(c => c.UserId == userId);
            }
            else
            {
                cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                    .FirstOrDefaultAsync(c => c.SessionId == sessionId);
            }

            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = userId,
                    SessionId = sessionId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            return cart;
        }

        private async Task<Cart?> GetCartWithProducts(int cartId)
        {
            return await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.Id == cartId);
        }

        private static CartResponseDto MapToResponseDto(Cart cart)
        {
            var items = cart.CartItems.Select(ci => new CartItemResponseDto
            {
                Id = ci.Id,
                ProductId = ci.ProductId,
                ProductName = ci.Product?.Name ?? "Unknown Product",
                ProductImage = ci.Product?.ImageUrl ?? "",
                Size = ci.Size,
                Color = ci.Color,
                Quantity = ci.Quantity,
                Price = ci.Price,
                LineTotal = ci.Price * ci.Quantity,
                Stock = ci.Product?.Stock ?? 0
            }).ToList();

            return new CartResponseDto
            {
                Id = cart.Id,
                UserId = cart.UserId,
                SessionId = cart.SessionId,
                Items = items,
                Subtotal = items.Sum(i => i.LineTotal),
                TotalItems = items.Sum(i => i.Quantity),
                CreatedAt = cart.CreatedAt,
                UpdatedAt = cart.UpdatedAt
            };
        }

        #endregion
    }
}
