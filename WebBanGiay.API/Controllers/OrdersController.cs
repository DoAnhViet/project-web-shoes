using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebBanGiay.API.Data;
using WebBanGiay.API.DTOs;
using WebBanGiay.API.Models;

namespace WebBanGiay.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(ApplicationDbContext context, ILogger<OrdersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all orders with pagination
        /// GET /api/orders?pageNumber=1&pageSize=10&status=pending
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<PagedResult<OrderResponseDto>>> GetOrders(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null,
            [FromQuery] string? email = null)
        {
            try
            {
                var query = _context.Orders
                    .Include(o => o.OrderItems)
                    .AsQueryable();

                // Filter by status
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(o => o.Status == status);
                }

                // Filter by email (for customer viewing their orders)
                if (!string.IsNullOrEmpty(email))
                {
                    query = query.Where(o => o.Email == email);
                }

                var totalItems = await query.CountAsync();
                var orders = await query
                    .OrderByDescending(o => o.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var orderDtos = orders.Select(MapToResponseDto).ToList();

                return Ok(new PagedResult<OrderResponseDto>
                {
                    Items = orderDtos,
                    TotalCount = totalItems,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orders");
                return StatusCode(500, new { message = "Error getting orders" });
            }
        }

        /// <summary>
        /// Get order by ID
        /// GET /api/orders/5
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderResponseDto>> GetOrder(int id)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                return Ok(MapToResponseDto(order));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order {Id}", id);
                return StatusCode(500, new { message = "Error getting order" });
            }
        }

        /// <summary>
        /// Get order by order code
        /// GET /api/orders/code/ORD123ABC
        /// </summary>
        [HttpGet("code/{orderCode}")]
        public async Task<ActionResult<OrderResponseDto>> GetOrderByCode(string orderCode)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.OrderCode == orderCode);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                return Ok(MapToResponseDto(order));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order by code {OrderCode}", orderCode);
                return StatusCode(500, new { message = "Error getting order" });
            }
        }

        /// <summary>
        /// Create a new order
        /// POST /api/orders
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<OrderResponseDto>> CreateOrder([FromBody] CreateOrderDto dto)
        {
            try
            {
                // Validate
                if (string.IsNullOrEmpty(dto.FullName) || string.IsNullOrEmpty(dto.Phone) || string.IsNullOrEmpty(dto.Address))
                {
                    return BadRequest(new { message = "Full name, phone and address are required" });
                }

                if (dto.Items == null || dto.Items.Count == 0)
                {
                    return BadRequest(new { message = "Order must have at least one item" });
                }

                // Generate order code
                var orderCode = "ORD" + DateTime.UtcNow.Ticks.ToString("X").ToUpper();

                // Calculate totals
                var subtotal = dto.Items.Sum(i => i.Price * i.Quantity);
                var shippingFee = subtotal >= 500000 ? 0 : 30000;
                var total = subtotal + shippingFee;

                // Create order
                var order = new Order
                {
                    OrderCode = orderCode,
                    FullName = dto.FullName,
                    Email = dto.Email,
                    Phone = dto.Phone,
                    Address = dto.Address,
                    City = dto.City,
                    District = dto.District,
                    Ward = dto.Ward,
                    Note = dto.Note,
                    Subtotal = subtotal,
                    ShippingFee = shippingFee,
                    Discount = 0,
                    Total = total,
                    PaymentMethod = dto.PaymentMethod,
                    PaymentStatus = dto.PaymentMethod == "cod" ? "pending" : "completed",
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow
                };

                // Add order items
                foreach (var item in dto.Items)
                {
                    order.OrderItems.Add(new OrderItem
                    {
                        ProductId = item.ProductId,
                        ProductName = item.ProductName,
                        ProductImage = item.ProductImage,
                        Size = item.Size,
                        Color = item.Color,
                        Price = item.Price,
                        Quantity = item.Quantity,
                        LineTotal = item.Price * item.Quantity
                    });
                }

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Order created: {OrderCode}", orderCode);

                return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, MapToResponseDto(order));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, new { message = "Error creating order" });
            }
        }

        /// <summary>
        /// Update order status
        /// PUT /api/orders/5/status
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<ActionResult<OrderResponseDto>> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                var validStatuses = new[] { "pending", "confirmed", "shipping", "delivered", "cancelled" };
                if (!validStatuses.Contains(dto.Status.ToLower()))
                {
                    return BadRequest(new { message = "Invalid status. Valid values: pending, confirmed, shipping, delivered, cancelled" });
                }

                order.Status = dto.Status.ToLower();
                order.UpdatedAt = DateTime.UtcNow;

                // Auto-complete payment when delivered with COD
                if (order.Status == "delivered" && order.PaymentMethod == "cod")
                {
                    order.PaymentStatus = "completed";
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Order {Id} status updated to {Status}", id, dto.Status);

                return Ok(MapToResponseDto(order));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order status");
                return StatusCode(500, new { message = "Error updating order status" });
            }
        }

        /// <summary>
        /// Update payment status
        /// PUT /api/orders/5/payment-status
        /// </summary>
        [HttpPut("{id}/payment-status")]
        public async Task<ActionResult<OrderResponseDto>> UpdatePaymentStatus(int id, [FromBody] UpdatePaymentStatusDto dto)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                var validStatuses = new[] { "pending", "completed" };
                if (!validStatuses.Contains(dto.PaymentStatus.ToLower()))
                {
                    return BadRequest(new { message = "Invalid payment status. Valid values: pending, completed" });
                }

                order.PaymentStatus = dto.PaymentStatus.ToLower();
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Order {Id} payment status updated to {PaymentStatus}", id, dto.PaymentStatus);

                return Ok(MapToResponseDto(order));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating payment status");
                return StatusCode(500, new { message = "Error updating payment status" });
            }
        }

        /// <summary>
        /// Cancel order
        /// DELETE /api/orders/5
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> CancelOrder(int id)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                if (order.Status != "pending")
                {
                    return BadRequest(new { message = "Only pending orders can be cancelled" });
                }

                order.Status = "cancelled";
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Order {Id} cancelled", id);

                return Ok(new { message = "Order cancelled successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling order");
                return StatusCode(500, new { message = "Error cancelling order" });
            }
        }

        /// <summary>
        /// Get order statistics
        /// GET /api/orders/stats
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult> GetOrderStats()
        {
            try
            {
                var stats = new
                {
                    total = await _context.Orders.CountAsync(),
                    pending = await _context.Orders.CountAsync(o => o.Status == "pending"),
                    confirmed = await _context.Orders.CountAsync(o => o.Status == "confirmed"),
                    shipping = await _context.Orders.CountAsync(o => o.Status == "shipping"),
                    delivered = await _context.Orders.CountAsync(o => o.Status == "delivered"),
                    cancelled = await _context.Orders.CountAsync(o => o.Status == "cancelled"),
                    totalRevenue = await _context.Orders.Where(o => o.Status == "delivered").SumAsync(o => o.Total)
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order stats");
                return StatusCode(500, new { message = "Error getting order stats" });
            }
        }

        private static OrderResponseDto MapToResponseDto(Order order)
        {
            return new OrderResponseDto
            {
                Id = order.Id,
                OrderCode = order.OrderCode,
                UserId = order.UserId,
                FullName = order.FullName,
                Email = order.Email,
                Phone = order.Phone,
                Address = order.Address,
                City = order.City,
                District = order.District,
                Ward = order.Ward,
                Note = order.Note,
                Subtotal = order.Subtotal,
                ShippingFee = order.ShippingFee,
                Discount = order.Discount,
                Total = order.Total,
                PaymentMethod = order.PaymentMethod,
                PaymentStatus = order.PaymentStatus,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                Items = order.OrderItems.Select(i => new OrderItemResponseDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    ProductImage = i.ProductImage,
                    Size = i.Size,
                    Color = i.Color,
                    Price = i.Price,
                    Quantity = i.Quantity,
                    LineTotal = i.LineTotal
                }).ToList()
            };
        }
    }
}
